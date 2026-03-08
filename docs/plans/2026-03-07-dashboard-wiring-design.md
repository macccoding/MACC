# Dashboard Wiring — Design Document

> **Date:** March 7, 2026
> **Project:** MikeOS — Dashboard Data Integration
> **Owner:** Mike Chen

---

## 1. Vision

Wire every MikeOS dashboard module to real data sources, build missing pages (Email, Captures, Knowledge Graph), make Kemi context-aware and proactive, and turn the dashboard home into a live command center with AI briefings.

---

## 2. Architecture & Integration Layer

All workstreams share a pattern: **external data → ingest API → Prisma DB → dashboard UI → Kemi reads it all**.

### Data Flow

```
External Sources                 Ingest APIs              DB              UI + Kemi
─────────────────                ──────────              ──              ─────────
Yahoo Finance / CoinGecko   →   /api/investments/sync   → Investment    → Investments page
copilot-money-cli            →   /api/finances/sync      → FinancialSnapshot + Transaction → Finances page
Health Auto Export (iOS)     →   /api/health/ingest      → HealthSnapshot → Health page
Gmail API                    →   /api/email/sync         → EmailCache    → Email page
QuickCapture                 →   /api/captures           → Capture       → Captures page (new)
Journal, Contacts, Goals...  →   (already wired)         → (existing)   → (existing pages)
         ↓                                                      ↓
    All of the above ──────────────────────────────────→ Kioku (Node/Link)
                                                              ↓
                                                         Kemi queries
                                                         everything via
                                                         tool-use pattern
```

### Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Price fetching | Server-side API route | No API keys exposed client-side |
| Copilot Money | Shell out to `copilot-money-cli` via `child_process` | Rust binary, fast, handles auth |
| Gmail | `googleapis` npm with OAuth2 | Official, well-documented |
| Health ingest | Webhook endpoint with API key auth | Health Auto Export POSTs directly |
| Kemi tool-use | Claude tool_use with typed functions per data source | Native Anthropic SDK pattern |
| Kioku indexing | Background job after writes — extract, embed, link | Non-blocking |
| Auth for webhooks | `x-api-key` header for Health Auto Export | Simple, single-user |

### New Dependencies

```
yahoo-finance2          — stock/ETF quotes (no API key needed)
googleapis              — Gmail API (OAuth2)
```

CoinGecko called via REST (no package). `copilot-money-cli` installed via Homebrew.

---

## 3. Investments Module

### Schema Changes

```prisma
model Investment {
  // existing fields stay
  symbol        String
  thesis        String    @default("")
  entryPrice    Float?
  currentPrice  Float?
  // new fields
  quantity      Float?
  assetType     String    @default("stock")  // "stock" | "etf" | "crypto"
  costBasis     Float?
  lastSyncedAt  DateTime?
}
```

### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/investments/sync` | POST | Fetch live prices for all positions via Yahoo Finance + CoinGecko |
| `/api/investments/quote` | GET | `?symbol=AAPL&type=stock` — single quote lookup |

### Price Sync Logic (`src/lib/investments/price-sync.ts`)

1. Load all investments from DB
2. Split into stocks[] and crypto[]
3. Stocks: batch call `yahoo-finance2` for all symbols
4. Crypto: single CoinGecko `/simple/price` call with comma-joined IDs
5. Bulk update `currentPrice` + `lastSyncedAt` in one transaction
6. Return `{ updated, errors }`

### Sync Triggers

- On page load if `lastSyncedAt` > 5 min ago
- Manual "Refresh" button
- Kemi's morning briefing

### UI Changes

- Add `quantity` and `assetType` fields to add form
- Per-position: quantity, cost basis, current value, P&L ($, %)
- Portfolio summary card: total value, total cost, total P&L, day change
- "Last synced" indicator + refresh button
- Asset type badge per card (stock/etf/crypto)

---

## 4. Finances (Copilot Money Integration)

### Schema Addition

```prisma
model Transaction {
  id          String   @id @default(cuid())
  externalId  String   @unique
  date        DateTime
  name        String
  amount      Float
  category    String   @default("")
  account     String   @default("")
  reviewed    Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/finances/sync` | POST | Run copilot-money-cli, upsert transactions, recalculate snapshot |
| `/api/finances/transactions` | GET | `?days=30&category=food` — list with filters |

### Sync Logic (`src/lib/finances/copilot-sync.ts`)

1. Shell out: `copilot-money-cli transactions --format json --days 30`
2. Parse JSON → upsert into Transaction table (externalId unique key)
3. Aggregate: sum income, sum expenses, group by category
4. Upsert today's FinancialSnapshot
5. Return `{ synced, newTransactions }`

### Auth

- First-time: run `copilot-money-cli auth` manually in terminal
- Token persists locally, CLI handles refresh
- Surface "auth expired" in UI if token fails

### UI Changes

- Keep existing metrics grid (netWorth, debt, savings, income, burn)
- Add transactions list: date, merchant, amount, category, account
- Category filter pills
- Spending by category breakdown
- Monthly trends: income vs expenses
- "Last synced" indicator + sync button

---

## 5. Health (Apple Health Auto Export)

### Integration

- **App:** Health Auto Export ($5, iOS)
- **Webhook URL:** `https://mikechen.xyz/api/health/ingest`
- **Auth:** `x-api-key: <HEALTH_INGEST_KEY>` header
- **Schedule:** Daily at 11:59 PM
- **Metrics:** steps, activeCalories, restingHeartRate, sleepHours, distanceWalking, exerciseMinutes, standHours

### Schema — No Changes

Existing `HealthSnapshot` handles everything:
- `steps`, `calories`, `heartRate`, `sleep` as dedicated columns
- `data Json?` absorbs extras (distance, exerciseMinutes, standHours)

### API Changes (`/api/health/ingest`)

- Add API key auth via `x-api-key` header (bypass session cookie)
- Map Health Auto Export fields to schema (activeCalories → calories, etc.)
- Upsert by date (re-sends don't duplicate)

### Field Mapping (`src/lib/health/ingest-mapper.ts`)

```
activeCalories     → calories
restingHeartRate    → heartRate
sleepHours          → sleep
distanceWalking     → data.distance
exerciseMinutes     → data.exerciseMinutes
standHours          → data.standHours
```

### UI Changes

- Keep manual entry as fallback
- Add exercise minutes, distance, stand hours to metrics grid
- Expand 7-day charts for new metrics
- "Last synced" indicator
- "Waiting for Health Auto Export..." when no data today

---

## 6. Email Module (Gmail API)

### Gmail OAuth2 Setup

- Google Cloud project with Gmail API enabled
- Scopes: `gmail.readonly`
- One-time auth flow saves refresh token
- Account: michael.ac.chen@gmail.com

### Schema Additions

```prisma
model EmailCache {
  // existing
  id        String   @id @default(cuid())
  gmailId   String   @unique
  subject   String
  sender    String
  category  String   @default("")
  summary   String   @default("")
  // new
  snippet   String   @default("")
  date      DateTime
  isRead    Boolean  @default(false)
  isStarred Boolean  @default(false)
  labels    String[] @default([])
  body      String   @default("")
}
```

### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/email/sync` | POST | Fetch from Gmail, upsert, AI-categorize new emails |
| `/api/email` | GET | `?category=important&unread=true` — list cached emails |
| `/api/email/digest` | GET | Kemi-generated summary of unread/recent |

### Sync Logic (`src/lib/email/gmail-sync.ts`)

1. Gmail API: list messages (`newer_than:2d`, max 50)
2. For new messages (gmailId not in DB):
   a. Fetch full message (subject, sender, date, snippet, body)
   b. Claude Haiku categorizes + summarizes:
      - Categories: important, action_needed, fyi, newsletter, receipt, spam
      - Summary: 1-2 sentences
   c. Upsert into EmailCache
3. For existing: update isRead/isStarred if changed
4. Return `{ synced, newEmails }`

### New Page (`/dashboard/email/page.tsx`)

- AI digest card at top (collapsible) — calls `/api/email/digest`
- Category filter pills: Important, Action, FYI, All
- Email cards: sender, subject, summary snippet, time ago, read/starred indicators
- Sync button + "last synced" indicator
- Read-only triage view (not a mail client)

---

## 7. Captures (Auto-route + Inbox)

### Auto-route Logic (`src/lib/captures/auto-route.ts`)

On capture creation, Claude Haiku classifies:

```
"Read Thinking Fast and Slow" → { route: "reading", confidence: 0.95, title: "Thinking Fast and Slow", type: "book" }
"AAPL looks undervalued"      → { route: "investment_note", confidence: 0.7, symbol: "AAPL" }
"That restaurant in Shibuya"  → { route: "none", confidence: 0.3 }  ← stays in inbox
```

### Route Targets

| Route | Action |
|-------|--------|
| `reading` | Create ReadingItem (to_read) |
| `goal` | Create Goal (active) |
| `habit` | Create Habit |
| `travel` | Create TravelItem (planning) |
| `creative` | Create CreativeProject (idea) |
| `investment_note` | Add note to matching Investment |
| `journal` | Append to today's journal |
| `contact` | Log interaction on matching Contact |
| `none` | Stay in inbox for manual triage |

**Confidence threshold:** Auto-route if ≥ 0.85. Below that, show Kemi's suggestion for manual approval.

### Schema Changes

```prisma
model Capture {
  // existing
  id         String   @id @default(cuid())
  content    String
  category   String   @default("")
  processed  Boolean  @default(false)
  createdAt  DateTime @default(now())
  // new
  suggestedRoute  String?
  suggestedData   Json?
  routedTo        String?
  confidence      Float?
}
```

### API Changes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/captures` | POST | Save + auto-route if confident |
| `/api/captures` | GET | `?status=inbox` for unprocessed |
| `/api/captures/[id]/route` | POST | Manually route a capture |
| `/api/captures/[id]/dismiss` | POST | Mark processed without routing |

### Page (`/dashboard/captures`)

- Not in sidebar — accessed via badge on QuickCapture button + dashboard home
- Pending captures with Kemi's suggestion + approve/skip buttons
- Manual route dropdown for unsuggestible captures
- "Recently Routed" section (last 10, collapsed)

---

## 8. Knowledge Graph (Kioku)

### Two Roles

1. **Passive indexer** — Extracts entities from journal, captures, emails, Kemi conversations
2. **Browsable page** — Visual graph explorer + semantic search

### Indexing Pipeline (`src/lib/kioku/indexer.ts`)

Triggered after writes to Journal, Capture (routed), EmailCache, Kemi conversation.

1. Extract entities via Claude Haiku:
   ```
   Input: "Had coffee with James, talked about his startup in climate tech"
   Output: {
     entities: [{ name: "James", type: "person" }, { name: "climate tech", type: "topic" }],
     concepts: ["networking", "startups"]
   }
   ```
2. For each entity: fuzzy match existing nodes, create or link
3. Generate embeddings for new nodes (Voyage AI or text-embedding-3-small)
4. Create links between co-occurring entities
5. Update NodeRecall.lastSurfaced for resurfaced nodes

### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/kioku/nodes` | GET | `?search=climate&type=person` |
| `/api/kioku/nodes` | POST | Manual node creation |
| `/api/kioku/nodes/[id]` | GET | Node detail with links |
| `/api/kioku/nodes/[id]/related` | GET | Vector similarity search |
| `/api/kioku/graph` | GET | `?center=nodeId&depth=2` — subgraph |
| `/api/kioku/search` | POST | Semantic search via embedding |

### New Page (`/dashboard/knowledge/page.tsx`)

- Sidebar entry: icon 脳 (brain), label "Knowledge"
- Search bar with semantic search
- Force-directed graph visualization (d3-force)
- Recent nodes list
- Spaced repetition: surface forgotten but important nodes

---

## 9. Kemi Intelligence

### Architecture: Claude tool_use

Kemi's API route sends system prompt + tool definitions. Claude returns tool_use calls, server executes against Prisma, feeds results back.

### Soul Files → MikeOS

Ported from `/Users/mac/prod/Kemi/soul/`:

```
src/lib/kemi/
├── soul.ts              ← SOUL.md + CONTEXT_MIKE.md (static, cached)
├── mood.ts              ← MOOD_*.md time-of-day personality injection
├── autonomy.ts          ← RULES_AUTONOMY.md decision logic
├── system-prompt.ts     ← Assembles: soul + mood + dynamic context
├── tools.ts             ← Tool definitions (22 tools: 15 read + 7 write)
├── tool-executor.ts     ← Prisma queries per tool
├── model-router.ts      ← Haiku/Sonnet/Opus routing
├── briefing.ts          ← Proactive morning/evening briefings
└── context-manager.ts   ← Selective context injection (keyword-triggered)
```

### Tool Definitions (22 tools)

**Read (15):** get_habits, get_goals, get_portfolio, get_finances, get_transactions, get_health, get_emails, get_journal, get_contacts, get_learning, get_reading, get_travel, get_creative, get_captures, search_knowledge

**Write (7):** log_habit, add_goal, add_capture, add_journal, log_interaction, add_reading, update_goal_status

### Model Routing (`src/lib/kemi/model-router.ts`)

- **Haiku:** Simple lookups (≤8 words, greetings, single-tool queries)
- **Sonnet:** Multi-tool queries, advice, general conversation (default)
- **Opus:** Strategic questions ("review", "plan", "strategy", "analyze")

### Personality (from soul files)

- Sharp, warm, direct, Jamaican professional woman
- Understands Patois naturally
- Encouraging when winning, firm when slipping
- Dry wit, not a clown
- Morning: upbeat, action-oriented
- Evening: reflective, summarizing
- Late night: gentle, light touch

### Proactive Briefing (`src/lib/kemi/briefing.ts`)

Called by dashboard home on load. Fetches all data sources in parallel, sends to Claude Sonnet:

"Generate Mike's morning briefing. Be concise, highlight what needs attention. Lead with the most important thing. Use his data, not platitudes. 3-5 bullet points max."

Cached for 4 hours. Mood-aware. Monday gets week-ahead preview.

### Conversation Memory

- Save conversations to KemiConversation model
- Load last 3 conversations as context summary on new session
- Important facts → Kioku nodes (async, fire-and-forget)

### Kill Switch

- "STOP" pauses autonomous actions, Kemi still responds but recommends only
- "RESUME" reactivates
- UI toggle in dashboard settings

---

## 10. Dashboard Home

### Layout

Kemi briefing card at top (collapsible), then 3-column grid of live module cards.

### Briefing Card

- Calls `/api/kemi/briefing` on page load
- Cached 4 hours
- Mood-aware (morning/evening/late night)
- Collapsible after reading

### Module Cards (3-column grid, 2-col on mobile)

Each card links to module page with 1-2 live data points:

| Card | Data |
|------|------|
| Habits | completed/total today, dot indicators |
| Goals | active count, overdue count |
| Health | steps, sleep hours |
| Portfolio | total value, day change % |
| Finances | net worth, debt |
| Email | unread count, action needed |
| Captures | pending count |
| Learning | top track name, progress % |
| Reading | currently reading, queued |
| Journal | written today (✓/✗) |
| Travel | planning count |
| People | overdue reachouts |
| Creative | in-progress count |
| Blueprint | active count |

### Brief API Expansion (`/api/dashboard/brief`)

Single endpoint returns all module summaries. Each is a simple `prisma.count()` or `findFirst()`.

---

## 11. Implementation Dependencies

Natural ordering based on data dependencies:

```
1. Investments (standalone, no dependencies)
2. Finances (standalone)
3. Health ingest (standalone)
4. Email module (standalone)
5. Captures auto-route (needs Haiku, standalone otherwise)
6. Kemi intelligence (needs all data sources wired first)
7. Knowledge Graph (needs content flowing from all modules)
8. Dashboard Home (needs brief API expansion + Kemi briefing)
```

Workstreams 1-5 can be parallelized. 6-8 build on top.
