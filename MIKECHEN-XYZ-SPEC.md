# mikechen.xyz — Personal Operating System

> **Project codename:** MikeOS
> **Owner:** Mike Chen (@macccoding)
> **Governance:** Manifold LLC — "Designed by Manifold"
> **Last updated:** March 6, 2026

---

## 1. Vision

mikechen.xyz is Mike's personal operating system — a single Next.js application with two faces:

1. **Public site** — a portfolio and personal brand presence. Who Mike is, what he builds, what he's about. The thing people land on when they Google him.
2. **Private dashboard** — behind authentication (Mike only). A unified command center for personal life management, powered by an AI agent named **Kemi** and backed by a knowledge/memory layer called **Kioku**.

This is NOT a business tool. No company dashboards, no accounting, no operational metrics. This is a personal life OS — finances, health, learning, relationships, creativity, goals, and an AI assistant that ties it all together.

---

## 2. Prior Art — READ THESE FIRST

Before building anything, Claude Code MUST inspect the following local projects to understand existing work, extract reusable code, personality definitions, and architectural decisions:

### Kemi (Executive Assistant Agent — v1)
```bash
cd /users/mac/prod/kemi
```

**What to extract from Kemi v1:**
- System prompts and personality definition (CRITICAL — this defines Kemi's voice)
- Any character bible, tone guidelines, or behavioral rules
- The OpenClaw / Baileys integration architecture
- Email triage logic and categorization rules
- WhatsApp/Telegram message handling patterns
- Token optimization strategies (v1 was killed by token cost)

### Kioku (Knowledge Graph / Second Brain)
```bash
cd /users/mac/prod/kioku
```
**GitHub:** https://github.com/macccoding/kioku
**Live:** https://kiokuchat.vercel.app

**What to extract from Kioku:**
- The conversational interface architecture
- Knowledge graph data model and storage approach
- The Obsidian vault integration pattern (if still relevant)
- Any existing API routes or backend services
- The chat interface components (reusable in the dashboard)

### Existing mikechen.xyz Site
```bash
cd /users/mac/prod/macc
```

**What to extract from the existing site:**
- Current route structure and content (about text, project descriptions, etc.)
- Domain/DNS configuration (Vercel project settings, custom domain setup)
- Any existing assets (images, fonts, icons)
- The tech stack (likely Next.js — confirm)
- What works about the current content (carry forward), what doesn't (redesign)

**IMPORTANT:** The new design is a complete departure. Do NOT replicate the existing aesthetic. Use the old site for content and infrastructure reference only. The new design should be built from scratch following the design principles in Section 11.

### Manifold Governance
```bash
cat /users/mac/prod/MANIFOLD.md
cat /users/mac/prod/CLAUDE.md
```

**This project MUST follow the Manifold structure:**
- `core/` — the extractable, reusable engine (Kemi agent, Kioku integration, shared utilities)
- `spurs/` — mikechen.xyz-specific UI, pages, and configurations
- `manifold.config.json` — project-level configuration
- `CLAUDE.md` — machine-readable project rules for Claude Code

---

## 3. Architecture

### 3.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Hosting | Vercel (Pro tier — commercial use) |
| Auth | Single-user auth (magic link, passkey, or simple password — Mike only) |
| AI | Anthropic Claude API (powers Kemi) |
| Memory | Kioku (existing project — integrate, don't rebuild) |
| Styling | Tailwind CSS + custom design system |
| Animation | Rive or Lottie (for Kemi character), Framer Motion (UI) |
| Data | Postgres (Neon or Supabase) for structured data, Kioku for knowledge graph |

### 3.2 Route Structure

```
mikechen.xyz/
├── / .......................... Public landing / portfolio
├── /about ..................... Public — who Mike is
├── /projects .................. Public — what Mike builds
├── /contact ................... Public — reach Mike
│
├── /login ..................... Auth gate (Mike only)
│
├── /dashboard ................. Private — home view (Kemi greeting + daily brief)
├── /dashboard/finances ........ Private — financial pulse
├── /dashboard/investments ..... Private — investment tracker
├── /dashboard/email ........... Private — email triage
├── /dashboard/learning ........ Private — Spanish, finance, skills
├── /dashboard/health .......... Private — Apple Watch data, fitness
├── /dashboard/goals ........... Private — habits, streaks, commitments
├── /dashboard/travel .......... Private — bucket list, trip planning
├── /dashboard/creative ........ Private — photo, 3D printing, builds
├── /dashboard/reading ......... Private — books, articles, media
├── /dashboard/journal ......... Private — reflection (conversational via Kemi)
├── /dashboard/people .......... Private — contacts, relationships
├── /dashboard/blueprint ....... Private — 36-month life plan
│
├── /api/kemi .................. Kemi agent endpoint
├── /api/email ................. Gmail integration
├── /api/health ................ Apple HealthKit sync
├── /api/finance ............... CoPilot Money data
└── /api/kioku ................. Kioku bridge
```

### 3.3 Auth

Single-user authentication. Mike is the only person who ever logs in. Options (choose simplest):
- Passkey (WebAuthn) — most secure, no passwords
- Magic link to Mike's email
- Simple email + password with rate limiting

All `/dashboard/*` and `/api/*` routes are protected. Public routes are open.

---

## 4. Kemi — The AI Agent

### 4.1 Identity

**Name:** Kemi
**Role:** Personal AI executive assistant
**Personality:** Playful, a bit cheeky. Not formal. Not corporate. She knows Mike well, understands his shorthand, and isn't afraid to call things out. She's helpful but has personality — more like a sharp friend who happens to be incredibly organized than a sterile assistant.

**CRITICAL:** Before defining Kemi's personality in code, Claude Code MUST read the original Kemi project's system prompts and character definition from the local prod folder. The v1 personality is the canonical reference. Carry it forward, refine it for the dashboard context, but don't reinvent it.

### 4.2 Personality Guidelines

These are baseline guidelines. Defer to the v1 system prompts where they exist:

- She calls Mike by name
- She's direct — doesn't pad responses with filler
- She has opinions and shares them (within reason)
- She uses light humor and occasional playful jabs ("You said you'd go to the gym today. That was 6 hours ago.")
- She's aware of context — time of day, what Mike's been doing, what's coming up
- She doesn't over-explain. Mike is technical; she matches that level
- She can be serious when the moment calls for it — health concerns, important deadlines, financial alerts

### 4.3 Technical Architecture

```
┌─────────────────────────────────────────────────┐
│                   KEMI AGENT                     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Anthropic │  │  Kioku   │  │  Tool Layer  │   │
│  │ Claude    │  │  Memory  │  │              │   │
│  │ API       │  │  Layer   │  │ - Gmail API  │   │
│  │           │  │          │  │ - HealthKit  │   │
│  │ (Brain)   │  │ (Memory) │  │ - CoPilot $  │   │
│  │           │  │          │  │ - Calendar   │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │           Output Channels                │    │
│  │  - Dashboard UI (primary)                │    │
│  │  - WhatsApp via Baileys (notifications)  │    │
│  │  - Telegram Bot API (notifications)      │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**Brain:** Anthropic Claude API (claude-sonnet-4-20250514 for speed, claude-opus-4-6 for complex reasoning)
**Memory:** Kioku provides persistent context about Mike — past conversations, knowledge graph, relationship data
**Tools:** Kemi can call external APIs as tool use within Claude's function calling:
  - Read/search/draft emails (Gmail API)
  - Check health data (Apple HealthKit via sync)
  - Query financial data (CoPilot Money local MCP or unofficial API)
  - Check calendar (Google Calendar API)

**Token Optimization (learned from v1):**
- Kemi does NOT maintain always-on context. She activates on interaction or trigger
- System prompt is compact — personality + current context window, not full history
- Kioku provides relevant memory on-demand (RAG pattern), not full graph injection
- Background tasks (email triage, health alerts) run on scheduled cron, not real-time streaming
- Use claude-sonnet-4-20250514 for routine tasks, reserve claude-opus-4-6 for complex reasoning

### 4.4 Visual Representation

Kemi has a 2D animated character that lives in the dashboard. This is NOT optional — it's central to the experience.

**Character design approach:** AI-generated, then refined. The character should feel:
- Stylized, not photorealistic
- Expressive — able to convey idle, thinking, talking, alerting, sleeping states
- Consistent with the overall dashboard aesthetic
- Memorable — something Mike would want as a sticker, an icon, a brand mark

**Animation states:**
| State | Trigger | Visual |
|-------|---------|--------|
| Idle | No active interaction | Subtle breathing/floating, ambient movement |
| Listening | Mike is typing or speaking | Attentive posture, slight lean forward |
| Thinking | Processing a request | Visual processing indicator (eyes moving, gears, particles) |
| Talking | Delivering a response | Mouth/expression animation, gestures |
| Alerting | Something needs attention | More energetic movement, visual pulse or glow |
| Sleeping | Late night / inactive period | Relaxed, eyes closed, gentle movement |
| Celebrating | Goal hit, debt paid off, streak maintained | Excited animation, confetti, jump |

**Implementation:** Rive (preferred for interactive state machines) or Lottie (simpler, pre-rendered). The character should be a persistent element in the dashboard — visible from any page, not just the chat interface. Clicking/interacting with her opens the conversational UI.

### 4.5 Messaging Output (WhatsApp / Telegram)

Kemi's primary home is the dashboard. But she can reach out via messaging for time-sensitive notifications:

- **WhatsApp** (via Baileys library — reference Kemi v1 implementation)
- **Telegram** (via Telegram Bot API — simpler, more reliable than Baileys)

These are OUTPUT channels only in v2. Kemi sends notifications, Mike can do quick replies, but the full conversational experience lives in the dashboard. This solves the v1 token problem — no more parsing every inbound WhatsApp message.

**Notification triggers:**
- Urgent email that needs response
- Financial alert (large transaction, bill due)
- Health concern (abnormal heart rate, missed activity goal)
- Reminder for something Mike committed to
- Daily morning brief (optional — "Here's your day")

---

## 5. Dashboard Modules

### 5.1 Home / Daily Brief

The landing page after login. Kemi greets Mike with a contextual brief:
- Time-aware greeting
- Today's calendar highlights
- Financial snapshot (debt payoff progress, spend so far this month)
- Any flagged emails
- Health summary from overnight
- Active goal streaks
- One playful/motivational observation from Kemi

### 5.2 Financial Pulse

**Data source:** CoPilot Money (via local Firestore MCP server or unofficial API client)

**Views:**
- **Kill / Live / Build streams** — the three-bucket allocation system:
  - Kill: Debt payoff progress. $15K CC debt, visual countdown, projected payoff date
  - Live: Monthly discretionary budget remaining, guilt-free spending tracker
  - Build: Savings/investment fund accumulation, opportunity reserve balance
- **Net worth trend** — line chart over time
- **Monthly spend breakdown** — categories from CoPilot
- **Income tracking** — $10K/month post-tax baseline
- **Recurring expenses** — the $1,500 baseline, any changes flagged

**Post-debt evolution:** Once the $15K is cleared (~4 months), the Kill stream converts to additional Build allocation. The UI should celebrate this milestone (Kemi animation + visual confetti).

**Important:** This is NOT a replacement for CoPilot Money. It's a strategic overlay that adds the kill/live/build framework on top of CoPilot's transaction data. CoPilot remains the source of truth for categorization and account linking.

### 5.3 Investment Tracker

**Purpose:** Track investment opportunities and positions Mike is watching or holding.

**Features:**
- Watchlist of opportunities with thesis notes
- Current positions with live pricing (market data API — Alpha Vantage free tier, or Yahoo Finance)
- Performance tracking (gain/loss, % return)
- Thesis journal — why Mike entered/exited a position
- Kemi can surface relevant news about watched assets
- Prediction market positions (Polymarket, if applicable)

**Note:** This is a tracker and journal, not a trading platform. No execution. Mike manages trades in their native platforms; this is his unified view.

### 5.4 Email Triage (Gmail)

**Data source:** Gmail API (OAuth, read + draft scopes)

**How it works:**
1. Kemi periodically fetches new emails (cron job, every 15-30 min)
2. Claude categorizes each email: Urgent / Needs Response / FYI / Archive / Spam
3. Dashboard shows the categorized inbox
4. Mike can ask Kemi to draft responses, which she prepares for his review
5. One-click to open in Gmail for sending (or send via API with Mike's confirmation)

**Categories should include context tags:** Personal, Istry, Caricom, Manifold, etc. — even though this is a personal dashboard, Mike's email has business threads that need categorization.

**Kemi's email personality:** She summarizes threads, highlights the actual ask, and flags what's time-sensitive. "3 new emails. One from [person] about the Istry proposal — they want a number by Friday. Two newsletters you'll probably skip."

### 5.5 Learning Dashboard

**Tracks:**
- **Spanish** — Pimsleur lesson progress, Anki streak/retention rate, iTalki session log
- **Financial literacy** — Wharton Coursera progress, Breaking Into Wall Street modules, book notes
- **Technical skills** — any courses, tutorials, or deliberate practice Mike is tracking

**Features:**
- Visual progress bars per track
- Streak counters (days in a row)
- Kemi nudges: "You haven't done Spanish in 3 days. Pimsleur lesson 47 is waiting."
- Notes/reflections per session (can capture via Kemi conversation)
- Milestone celebrations

**Data input:** Primarily manual logging or conversational ("Hey Kemi, did Pimsleur lesson 47 today"). Could integrate with Anki API for automated streak data.

### 5.6 Health & Fitness

**Data source:** Apple Watch via Apple HealthKit

**Sync approach:** HealthKit data lives on iPhone. Options:
1. **Apple Shortcuts + Webhook** — an iOS Shortcut that runs daily, exports health data, and POSTs to a mikechen.xyz API endpoint
2. **Health Auto Export app** — third-party iOS app that syncs HealthKit to a REST API or cloud storage automatically
3. **Manual CSV export** — lowest tech, highest friction (avoid)

Recommend option 2 (Health Auto Export → API endpoint) for automatic daily sync.

**Data to capture:**
- Steps, distance, active calories
- Heart rate (resting, average, anomalies)
- Sleep (duration, quality, consistency)
- Workouts (type, duration, calories)
- Activity ring completion (Move, Exercise, Stand)

**Dashboard views:**
- Today's snapshot (rings, steps, sleep last night)
- Weekly/monthly trends
- Workout log
- Sleep consistency chart
- Kemi commentary: "You slept 5 hours and your resting heart rate is up. Maybe take it easy today."

### 5.7 Goals & Habits

**Purpose:** Track daily/weekly commitments and build streaks.

**Features:**
- Define habits (daily: gym, Spanish, reading | weekly: meal prep, review finances)
- Visual streak tracker (GitHub contribution graph style)
- Streak protection ("You can miss one day without breaking the streak")
- Kemi accountability: She knows the commitments and calls out gaps
- Goal setting with deadlines and milestones
- Weekly review prompt (Kemi-guided reflection)

**Data input:** Check-in via dashboard toggle, or conversational with Kemi ("Done with gym today").

### 5.8 Travel / Bucket List

**Purpose:** Places to go, experiences to have, trips to plan.

**Features:**
- Bucket list with categories (countries, cities, experiences, events)
- Trip planning workspace (dates, budget, itinerary notes)
- Financial tie-in: "You need $X more in the Build fund before this trip makes sense"
- Map visualization of places visited vs. want to visit (Mike has visited 37+ countries reference from context — verify)
- Kemi can research destinations, suggest timing, estimate costs

### 5.9 Creative Projects

**Purpose:** Track Mike's maker/builder projects across photography, 3D printing, drone work, and other creative pursuits.

**Features:**
- Project cards with status (Idea → In Progress → Complete → Shelved)
- Photo gallery for A7IV work
- 3D print queue and completed prints (links to STL files, notes on settings)
- Drone footage log
- Vibe code project tracker
- Integration with the public portfolio — completed projects can be featured on the public site

### 5.10 Reading / Media

**Purpose:** Track what Mike is consuming and what stuck.

**Features:**
- Currently reading / watching / listening
- Queue (to-read, to-watch, to-listen)
- Finished with notes/ratings
- Kemi can add items via conversation ("Add [book] to my reading list")
- Highlights and takeaways (feeds into Kioku knowledge graph)
- Recommendations based on patterns

### 5.11 Journal / Reflection

**Purpose:** A space for reflection, but conversational — not a blank page.

**How it works:** Mike talks to Kemi. She asks questions, he reflects, and the conversation IS the journal. Kemi guides the reflection with prompts based on context:
- "What went well today?"
- "You seemed stressed about [thing] earlier this week. How's that sitting now?"
- "You hit your Spanish streak goal. How does the progress feel?"

**Storage:** Journal entries are timestamped conversations stored in the database, browsable by date. Kemi can reference past entries for continuity.

**Weekly review:** Kemi generates a weekly summary — highlights, patterns, mood trends (inferred from conversation tone), wins, areas of focus.

### 5.12 Contacts / Relationships

**Purpose:** The people in Mike's life, with context.

**Data source:** Kioku's relationship layer (reference existing Kioku implementation)

**Features:**
- Contact cards with relationship context (how they met, what they do, shared history)
- Last interaction date and notes
- "Reach out" reminders for people Mike hasn't connected with in a while
- Pre-meeting briefs: "You're meeting [person] tomorrow. Last time you discussed [topic]. They mentioned [thing]."
- Kemi can update contact notes via conversation ("Had coffee with [person], they're starting a new company in logistics")

### 5.13 Blueprint Tracker

**Purpose:** The 36-month personal plan as a living, breathing view.

**Reference:** The blueprint was created in early March 2026 and covers five tracks:
1. Spanish acquisition (A1→B2 over 24 months)
2. Financial literacy progression
3. AI automation of existing businesses
4. Industry pivot strategy (logistics/freight tech, real estate, or B2B SaaS)
5. Partnership decision-making framework

**Features:**
- Visual timeline with milestones per track
- Current position indicator ("You are here")
- Progress percentage per track
- Quarterly review prompts (Kemi-guided)
- Adjustable — Mike can revise targets and Kemi tracks the changes

### 5.14 Quick Capture

**Purpose:** Frictionless input for anything — thoughts, ideas, links, voice notes.

**Implementation:** A persistent input bar or keyboard shortcut (Cmd+K style) available from ANY dashboard page. Type or paste anything, hit enter, it's captured. Kemi (or a background process) categorizes it later and routes it to the appropriate module or into Kioku's knowledge graph.

**Voice input:** Support for voice-to-text capture (Web Speech API or Whisper via API).

**No friction, no forms, no categorization required at capture time.** The whole point is speed. Organization happens asynchronously.

---

## 6. Public Site

### 6.1 Purpose

The public face of mikechen.xyz is a personal brand and portfolio site. It should signal: builder, entrepreneur, maker, technical, creative range.

### 6.2 Content

- **Hero / Landing** — bold, memorable first impression. Name, one-liner, visual impact.
- **About** — who Mike is. Entrepreneur across Jamaica and Florida. Builder. Maker. The story.
- **Projects / Work** — showcase of ventures and builds. Manifold, Istry, creative projects, technical work. Curated, not exhaustive.
- **Photography / Creative** — gallery of A7IV work, drone footage, 3D prints. The maker side.
- **Contact** — how to reach Mike. Simple.

### 6.3 Design Direction

Reference the frontend-design skill guidelines. The site should be:
- **Distinctive** — not a template. Not generic startup aesthetic. Something that feels like Mike.
- **Bold** — strong typography, confident layout, memorable visual choices
- **Fast** — performance matters. Static generation for public pages.
- **Dark-mode native** — matches the dashboard aesthetic, feels premium
- **Photography-forward** — Mike has an A7IV for a reason. Use real images, not stock.

The public site and private dashboard should feel like the same product — same design system, same typography, same color palette. The transition from public to dashboard after login should feel seamless, like the site is revealing its full self.

---

## 7. Financial Plan (Context for Financial Pulse Module)

This is the strategy the Financial Pulse module visualizes:

### Phase 1: Kill (Months 1-4)
- Monthly income: $10,000 post-tax
- Monthly expenses: ~$1,500
- Surplus: ~$8,500
- Debt allocation: $4,000/month toward $15K CC debt
- Live allocation: $3,000/month (discretionary, guilt-free)
- Minimum build: $1,500/month (emergency/opportunity fund)
- Projected debt-free date: ~July 2026

### Phase 2: Build (Month 5 onward)
- Kill stream ($4,000) rolls into Build
- New split: $5,500 Build / $2,500 Live / $500 flex
- Build fund targets: $20-25K liquid reserve first, then branch into investments
- By end of 2026: debt-free + $30-40K in reserves

### Kemi's role in finances
- Weekly spend summaries
- Alerts when approaching Live budget limit
- Celebration when debt milestones are hit
- Monthly "state of the money" brief
- Does NOT give financial advice — surfaces data and tracks the plan Mike sets

---

## 8. Technical Implementation Notes

### 8.1 API Integrations

| Service | Method | Auth | Notes |
|---------|--------|------|-------|
| Anthropic Claude | REST API | API key | Powers Kemi. Sonnet for routine, Opus for complex |
| Gmail | OAuth 2.0 | Google Cloud project | Read, draft, send scopes |
| Google Calendar | OAuth 2.0 | Same Google Cloud project | Read access for daily brief |
| CoPilot Money | Local MCP server OR unofficial CLI | Token-based | Reads from local Firestore cache on Mac |
| Apple HealthKit | iOS Shortcut or Health Auto Export app → webhook | API key on webhook endpoint | Daily sync of health metrics |
| WhatsApp | Baileys (unofficial) | QR code pairing | Output notifications only |
| Telegram | Bot API | Bot token | Output notifications only |
| Market data | Alpha Vantage or Yahoo Finance | API key | For investment tracker live pricing |

### 8.2 Database Schema (High-Level)

```
users (just Mike, but future-proof)
├── goals
├── habits
│   └── habit_logs (daily check-ins)
├── journal_entries
├── investments
│   └── investment_notes
├── travel_items (bucket list)
├── creative_projects
├── reading_items
├── contacts
│   └── contact_interactions
├── learning_tracks
│   └── learning_logs
├── captures (quick capture items)
├── email_cache (triaged emails)
├── health_snapshots (daily synced data)
├── financial_snapshots (periodic CoPilot syncs)
└── kemi_conversations (chat history with Kemi)
```

### 8.3 Cron Jobs / Background Tasks

| Task | Frequency | Purpose |
|------|-----------|---------|
| Email triage | Every 15-30 min | Fetch + categorize new emails |
| Health sync | Daily (morning) | Pull Apple Watch data from webhook |
| Financial sync | Daily | Refresh CoPilot Money cache data |
| Kemi morning brief | Daily 7-8 AM | Generate and optionally push via WhatsApp |
| Streak check | Daily midnight | Update habit streaks, flag breaks |
| Relationship reminder | Weekly | Flag contacts Mike hasn't engaged with |
| Blueprint review prompt | Monthly | Trigger Kemi to suggest a blueprint review session |

### 8.4 Kemi Token Budget Strategy

Lessons from v1: token cost killed the original Kemi. Mitigations:

1. **Compact system prompt** — personality + current date/time + minimal context. Under 1000 tokens.
2. **RAG for memory** — Kioku provides relevant context on-demand via embedding search, not full graph injection. Only retrieve what's relevant to the current query.
3. **Tiered model usage:**
   - Sonnet: email categorization, quick responses, daily briefs, habit logging
   - Opus: complex reasoning, investment analysis, journal synthesis, weekly reviews
4. **No always-on streaming** — Kemi activates on user interaction or scheduled trigger. No idle token consumption.
5. **Cached responses** — daily brief, email triage results, and health summaries are generated once and cached. Re-query only on new data.
6. **Background tasks use structured output** — email triage returns JSON categories, not conversational prose. Cheaper and faster.

### 8.5 Kemi Character Asset Pipeline

1. **Generate base character** using AI image generation (Midjourney, DALL-E, or Stable Diffusion)
   - Generate multiple concepts: different styles, expressions, poses
   - Mike selects and refines the winning direction
2. **Create expression sheet** — idle, happy, thinking, concerned, excited, sleepy, alert
3. **Build in Rive** (preferred) — create interactive state machine with transitions between expression states
   - Alternative: Lottie animations exported from After Effects
   - Fallback: CSS/SVG sprite animations
4. **Integrate into dashboard** — persistent character element, positioned in corner or sidebar, reactive to application state

---

## 9. Project Structure (Manifold Convention)

```
mikechen.xyz/
├── CLAUDE.md ..................... Machine-readable rules for Claude Code
├── MANIFOLD.md ................... Human-readable project constitution
├── manifold.config.json .......... Project configuration
├── package.json
├── next.config.ts
├── tailwind.config.ts
│
├── core/ ......................... Extractable, reusable engine
│   ├── kemi/ ..................... Kemi agent logic
│   │   ├── personality.ts ........ System prompt + character definition
│   │   ├── agent.ts .............. Claude API integration + tool orchestration
│   │   ├── tools/ ................ Tool definitions (email, health, finance, etc.)
│   │   └── memory.ts ............. Kioku integration bridge
│   ├── kioku/ .................... Kioku memory layer integration
│   │   ├── client.ts ............. API client for Kioku
│   │   └── types.ts .............. Knowledge graph types
│   └── shared/ ................... Shared utilities, types, constants
│
├── spurs/ ........................ mikechen.xyz-specific implementation
│   └── mikechen/
│       ├── app/ .................. Next.js app directory
│       │   ├── (public)/ ......... Public routes (portfolio)
│       │   │   ├── page.tsx ...... Landing page
│       │   │   ├── about/ ....... About page
│       │   │   ├── projects/ .... Projects showcase
│       │   │   └── contact/ ..... Contact page
│       │   ├── (dashboard)/ ...... Private routes (behind auth)
│       │   │   ├── dashboard/ .... Dashboard home (daily brief)
│       │   │   ├── finances/ ..... Financial pulse
│       │   │   ├── investments/ .. Investment tracker
│       │   │   ├── email/ ........ Email triage
│       │   │   ├── learning/ ..... Learning dashboard
│       │   │   ├── health/ ....... Health & fitness
│       │   │   ├── goals/ ........ Goals & habits
│       │   │   ├── travel/ ....... Travel / bucket list
│       │   │   ├── creative/ ..... Creative projects
│       │   │   ├── reading/ ...... Reading / media
│       │   │   ├── journal/ ...... Journal / reflection
│       │   │   ├── people/ ....... Contacts / relationships
│       │   │   └── blueprint/ .... Blueprint tracker
│       │   ├── api/ .............. API routes
│       │   └── layout.tsx ........ Root layout
│       ├── components/ ........... UI components
│       │   ├── kemi/ ............. Kemi character + chat UI
│       │   ├── dashboard/ ........ Dashboard module components
│       │   └── public/ ........... Public site components
│       └── lib/ .................. Client-side utilities
│
├── ui/theme/ ..................... Design system tokens
│   ├── colors.ts
│   ├── typography.ts
│   └── animations.ts
│
└── api/ .......................... API integration clients
    ├── gmail.ts
    ├── calendar.ts
    ├── copilot-money.ts
    ├── health.ts
    ├── anthropic.ts
    ├── whatsapp.ts
    └── telegram.ts
```

---

## 10. Build Order

Suggested phasing — build the foundation first, then expand:

### Phase 1: Shell + Kemi (Week 1-2)
- [ ] Scaffold Next.js project with Manifold structure
- [ ] Public site — basic landing page, about, projects
- [ ] Auth implementation (Mike only)
- [ ] Dashboard layout with navigation
- [ ] Kemi conversational UI (chat interface)
- [ ] Kemi personality + Claude API integration
- [ ] Kemi character placeholder (static image, animate later)

### Phase 2: Core Modules (Week 3-4)
- [ ] Financial Pulse — CoPilot Money integration + kill/live/build UI
- [ ] Email Triage — Gmail OAuth + categorization
- [ ] Quick Capture — persistent input bar
- [ ] Goals & Habits — streak tracker

### Phase 3: Life Modules (Week 5-6)
- [ ] Health & Fitness — Apple Watch sync pipeline
- [ ] Learning Dashboard — Spanish, finance, skills tracking
- [ ] Journal — conversational reflection via Kemi
- [ ] Blueprint Tracker — 36-month plan visualization

### Phase 4: Depth (Week 7-8)
- [ ] Investment Tracker — watchlist + live pricing
- [ ] Contacts / Relationships — Kioku people layer
- [ ] Travel / Bucket List
- [ ] Creative Projects gallery
- [ ] Reading / Media tracker

### Phase 5: Polish (Week 9-10)
- [ ] Kemi character animation (Rive/Lottie)
- [ ] WhatsApp/Telegram notification output
- [ ] Kemi morning brief generation
- [ ] Public site design polish
- [ ] Performance optimization
- [ ] Mobile responsiveness

---

## 11. Design Principles

1. **This is personal, not professional.** Every design choice should feel like Mike's space, not a SaaS product.
2. **Kemi is the soul.** She's not a feature — she's the personality of the entire experience.
3. **No friction for capture.** Getting information IN should be instant. Organization happens later.
4. **Ambient awareness over active monitoring.** The dashboard should give Mike a sense of his life at a glance, not demand his attention.
5. **Celebrate progress.** Streaks, milestones, debt payoff, goals hit — the system should make wins feel real.
6. **Dark mode native.** This is a personal tool used at all hours. Dark theme is default.
7. **Fast.** Every page should load instantly. Static generation for public, ISR/SSR for dashboard.
8. **Built to evolve.** Modules can be added, removed, or modified without restructuring. The architecture should support this.

---

## 12. Open Questions (Resolve During Build)

- [ ] Kemi v1 system prompt — extract from local project and carry forward
- [ ] Kioku integration depth — how much of the existing Kioku codebase can be reused vs. needs rebuilding?
- [ ] CoPilot Money data access — test the MCP server locally, validate data availability
- [ ] Apple HealthKit sync — evaluate Health Auto Export app vs. iOS Shortcut approach
- [ ] Kemi character design — generate concepts, Mike selects direction
- [ ] Domain/DNS — is mikechen.xyz already pointed at Vercel, or does this need configuration?
- [ ] Baileys stability — evaluate if WhatsApp via Baileys is still viable, or if Telegram-only is simpler for v1

---

*Designed by Manifold.*
