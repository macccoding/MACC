# mikechen.xyz — Design Document

> **Date:** March 7, 2026
> **Project:** MikeOS — Personal Operating System
> **Owner:** Mike Chen (@macccoding)

---

## 1. Vision

mikechen.xyz is a single Next.js application with two faces:

1. **Public site** — An Awwward-level sumi-e scroll experience. A philosophy-driven personal site about who Mike is, what he cares about, and how he sees the world. Not a business portfolio — a personal statement.
2. **Private dashboard** — Behind a hidden ink seal + PIN/biometric gate. A personal life OS powered by Kemi (AI assistant) and Kioku (knowledge graph), managing finances, health, learning, goals, and more.

---

## 2. Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Single Next.js monolith | Personal project, one user, one deployment |
| Manifold structure | Not used | Personal project, not Manifold |
| Existing site | Fresh start, content reference only | Complete aesthetic departure |
| Kioku integration | Absorbed into project | No cross-service latency, one DB |
| Database | Supabase PostgreSQL + pgvector | Kemi v1 already on Supabase, built-in auth |
| Auth | Supabase Auth + WebAuthn passkeys | Face ID/fingerprint on registered devices |
| Dashboard entry | Hidden ink seal + 4-digit PIN | Secret door only Mike knows |
| Design direction | Sumi-e + Okami inspired, modern | Warm ink tones, brush textures, vermillion accent |
| Public site content | Philosophy/personal, not business | Interests and beliefs, not ventures |
| Contact page | None — email in footer only | Keep it minimal |

---

## 3. Design System

### 3.1 Aesthetic

**Sumi-e (墨絵) + Okami (大神) inspired, modern execution.** Japanese brush painting aesthetic with flowing ink washes, organic textures, and bold vermillion accents. Not literal traditional art — a modern web interpretation that feels like a digital scroll painting.

### 3.2 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--ink-black` | `#1A1814` | Primary background (warm near-black) |
| `--ink-dark` | `#2A2520` | Card backgrounds, elevated surfaces |
| `--parchment` | `#F5EDE0` | Primary text, light surfaces |
| `--parchment-muted` | `#B8A99A` | Secondary text, muted labels |
| `--vermillion` | `#D03A2C` | Primary accent (torii gate red) |
| `--vermillion-glow` | `#E8503F` | Hover/active state |
| `--ink-wash` | `rgba(26,24,20,0.6)` | Translucent overlays |
| `--gold-seal` | `#C9A84C` | Secondary accent (seal stamps) |
| `--sumi-gray` | `#6B635A` | Dividers, borders |

### 3.3 Typography

| Role | Font | Notes |
|------|------|-------|
| Display/Headings | AI-generated brush typeface | Custom SVG letterforms or generated web font |
| Body | Noto Serif or Source Serif Pro | Warm, readable, pairs with brush style |
| UI/Labels | IBM Plex Mono | Technical contrast against organic art |

Fluid scaling with `clamp()` for responsive typography.

### 3.4 Textures & Effects

- **Animated ink wash background:** Canvas 2D or WebGL shader — ink particles drifting in water
- **Washi paper grain overlay:** Subtle CSS noise filter with warm tone
- **Brush stroke dividers:** SVG paths with draw-on animation
- **Ink splatter transitions:** On hover states and section changes

### 3.5 Cursor

- Custom brush dot cursor with **dripping ink trail**
- Ink particles fall from cursor, fade as they drift down
- On interactive elements: cursor enlarges, vermillion glow

### 3.6 Sound Design

- Ambient ink sounds (opt-in): brush-on-paper on scroll, ink drip on interactions
- Sound toggle: subtle icon, defaults to muted
- Implementation: Howler.js

---

## 4. Public Site Experience

### 4.1 Loading Screen

Brush stroke draws Mike's name/logo stroke by stroke on ink-black background. Strokes animate in vermillion ink, then fade to parchment. Site fades in behind. Duration: 2-3 seconds.

### 4.2 Landing Page — Philosophy Scroll

A single continuous scroll narrative. No traditional page sections.

**Flow:**
1. **Opening** — Animated ink wash background. Name materializes from brush strokes. Tagline fades in: *"Abundance favors the persistent, not the deserving."*
2. **The Philosophy** — Text reveals word-by-word on scroll (like directionless.webflow.io). Themes: persistence, humility, caring for others, building with hands and mind. Sumi-e illustrations paint themselves alongside text.
3. **The Illustrations** — Symbolic sumi-e objects that represent Mike's interests (not businesses):
   - A **wok** (Chinese-Jamaican heritage, food culture)
   - A **camera** (Sony A7IV, seeing the world)
   - A **figure in motion** (fitness, physical discipline)
   - A **ping pong paddle** (table tennis)
   - A **Porsche 911 RWB** (the dream car)
   - A **3D printer** (maker mindset, BambuLab)
   - A **landscape** (travel, 37+ countries)
   - A **laptop with flowing code** (builder, digital creator)
   - A **coffee cup with rising steam** (the daily ritual, 4+ cups)
4. **Footer** — Large hanko (seal stamp) in vermillion, personal email below, social links as small ink icons. Background fades to pure ink-black.

### 4.3 Navigation

- **Hidden/minimal:** Subtle brush-stroke menu icon. Clicking opens full-screen ink wash overlay with links.
- **Pages accessible via nav:** Projects ("Things I've Built"), possibly About (or fold into landing scroll)
- **No visible navbar.** Menu is there if needed but the page doesn't demand it.

### 4.4 Projects Page

Scroll gallery — each venture/build gets a full-viewport section. Sumi-e illustration paints in on scroll entry, then text reveals name, role, and description. Presented through the lens of *what was built and why*, not corporate descriptions. Ventures: Istry, SuperPlus, Kemi, Caricom Freight, creative builds.

### 4.5 Hidden Dashboard Entrance

- Decorative ink seal element, always visible (looks like a chop stamp)
- Only Mike knows it's clickable
- Click → subtle ink ripple animation → 4-digit PIN input overlay (brush strokes on parchment)
- Correct PIN → Supabase Auth session → brush stroke wipe transition → dashboard
- On registered devices: click seal → Face ID/fingerprint (WebAuthn passkey) → dashboard

### 4.6 Page Transitions

Brush stroke wipe: a bold ink brush stroke sweeps across the screen. Like Okami's combat transitions.

---

## 5. Dashboard Experience

### 5.1 Layout

- **Left sidebar:** Ink-wash background, brush-painted navigation icons for each module, Kemi character at bottom (small, animated, always visible)
- **Main content area:** Clean functional cards on `--ink-dark` background
- **Sumi-e accents:** Brush stroke dividers, ink wash card headers, vermillion highlights for alerts
- **Quick Capture bar:** Persistent at top (Cmd+K shortcut), styled as brush stroke input field

### 5.2 Kemi Visual Presence

- Sumi-e illustrated character in sidebar, always visible
- Click her → chat panel slides in from right
- Built in Rive for interactive state machine
- **Animation states:**
  | State | Trigger | Visual |
  |-------|---------|--------|
  | Idle | No interaction | Gentle breathing, subtle ink particle aura |
  | Listening | Mike typing | Attentive lean, ears perked |
  | Thinking | Processing | Ink particles swirl around her |
  | Talking | Delivering response | Expression animation, gestures |
  | Alerting | Needs attention | Vermillion glow pulse |
  | Sleeping | Late night / inactive | Relaxed, eyes closed |
  | Celebrating | Goal hit, milestone | Excited, confetti ink splashes |

### 5.3 Dashboard Home (Daily Brief)

Kemi greets Mike with contextual brief. Cards below:
- Calendar highlights
- Financial snapshot (kill/live/build gauges)
- Flagged emails count
- Health summary
- Active streaks
- One playful observation from Kemi

### 5.4 Module Design Pattern

Every dashboard module follows:
- Header with brush-stroke underline
- Data cards: `--ink-dark` bg, parchment text
- Charts/graphs: vermillion + gold-seal accent colors
- Hover: vermillion glow
- Kemi commentary: inline quotes with her avatar

### 5.5 Dashboard Modules

14 modules as specified:
1. **Home / Daily Brief** — Kemi greeting + contextual cards
2. **Financial Pulse** — Kill/Live/Build streams, net worth trend, spend breakdown
3. **Investment Tracker** — Watchlist, positions, thesis journal
4. **Email Triage** — Gmail categorized inbox (Urgent/Respond/FYI/Archive/Spam)
5. **Learning** — Spanish (Pimsleur/Anki/iTalki), finance, skills progress
6. **Health & Fitness** — Apple Watch data, rings, sleep, workout log
7. **Goals & Habits** — Streak tracker (GitHub graph style), accountability
8. **Travel / Bucket List** — Map, destinations, trip planning
9. **Creative Projects** — Photo gallery, 3D prints, drone, builds
10. **Reading / Media** — Currently reading/watching, queue, finished
11. **Journal** — Conversational reflection via Kemi (she asks, you reflect)
12. **Contacts / People** — Relationship context, last interaction, reach-out reminders
13. **Blueprint** — 36-month plan timeline, progress per track
14. **Quick Capture** — Frictionless input, Kemi categorizes later

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase PostgreSQL + pgvector |
| Auth | Supabase Auth + WebAuthn (passkeys/Face ID) |
| AI | Anthropic Claude API (Haiku/Sonnet/Opus tiered) |
| Memory | Kioku pipeline (absorbed, TypeScript) |
| Styling | Tailwind CSS v4 + custom sumi-e design system |
| Animation | Framer Motion (UI) + Canvas/WebGL (ink effects) + Rive (Kemi) |
| Sound | Howler.js |
| Hosting | Vercel |

### 6.2 Project Structure

```
src/
├── app/
│   ├── (public)/              # Public pages (static generation)
│   │   ├── page.tsx           # Philosophy scroll landing
│   │   ├── projects/          # Scroll gallery
│   │   └── layout.tsx         # Public layout (no nav, ink seal)
│   ├── (dashboard)/           # Private pages (SSR, auth-gated)
│   │   ├── dashboard/         # Home / daily brief
│   │   ├── finances/
│   │   ├── email/
│   │   ├── goals/
│   │   ├── health/
│   │   ├── learning/
│   │   ├── journal/
│   │   ├── investments/
│   │   ├── travel/
│   │   ├── creative/
│   │   ├── reading/
│   │   ├── people/
│   │   ├── blueprint/
│   │   └── layout.tsx         # Dashboard layout (sidebar, Kemi)
│   ├── api/
│   │   ├── kemi/
│   │   ├── kioku/
│   │   ├── email/
│   │   ├── health/
│   │   ├── finance/
│   │   └── auth/
│   └── layout.tsx
├── components/
│   ├── ink/                   # Sumi-e visual system
│   ├── kemi/                  # Kemi character + chat UI
│   ├── dashboard/             # Dashboard components
│   └── ui/                    # Shared primitives
├── lib/
│   ├── kemi/                  # Agent logic, personality, tools
│   ├── kioku/                 # Knowledge graph pipeline
│   ├── supabase/              # Client + auth helpers
│   └── sounds/                # Sound manager
└── styles/
    └── sumi-e/                # Design tokens, textures
```

### 6.3 Auth Flow

1. Public site: no auth
2. Click hidden ink seal → ink ripple animation
3. First visit: 4-digit PIN overlay → Supabase Auth sign-in → prompt passkey registration
4. Subsequent visits (registered device): click seal → Face ID/fingerprint → dashboard
5. Session: Supabase JWT in httpOnly cookie, middleware checks on dashboard routes

### 6.4 Kemi Agent (TypeScript port from v1)

```
User message → /api/kemi
  ├── Build context
  │   ├── Compact system prompt (<1000 tokens)
  │   ├── Kioku RAG recall (2 relevant memories, 0.78 threshold)
  │   └── Current date/time + active context
  ├── Keyword-based tool filtering (6-10 tools, not all)
  ├── Model routing
  │   ├── Haiku: simple messages (<20 chars, acknowledgments)
  │   ├── Sonnet: routine (email triage, quick responses, logging)
  │   └── Opus: complex (journal synthesis, investment analysis, weekly reviews)
  ├── Claude API call with tool_use
  ├── Tool execution loop (max 10 iterations)
  ├── Save conversation to DB
  └── Return response
```

**Personality (from v1):**
- Sharp, warm, direct, practical
- Understands Jamaican English/Patois naturally
- Calls Mike by name, has opinions, uses dry wit
- Not subservient — a professional peer
- Firm on accountability ("the NCB follow-up has been sitting here for 4 days...")
- Serious when stakes are high (health, finances, deadlines)

**Token Budget (from v1 learnings):**
- System prompt: <1000 tokens
- Kioku RAG: 2 results, 0.78 similarity
- History: 6 messages, max 1000 chars each
- Tools: keyword-filtered subset
- Target: ~4-5K input tokens per request
- Prompt caching: static personality cached with `cache_control: ephemeral`

### 6.5 Kioku Pipeline (Absorbed)

**Prisma Models:** Node, Link, Message, NodeRecall, Journal

**Pipeline:**
1. **Ingest** — Normalize input (text, image via Claude vision, audio via Whisper, URL, PDF)
2. **Extract** — Claude extracts nodes, links, updates, reply, follow_up from conversation
3. **Store** — Upsert nodes (idempotent), append notes (never overwrite), create bidirectional links
4. **Record Surfaced** — Update NodeRecall for spaced repetition
5. **Embed** — Async pgvector embedding (non-blocking)

**Key patterns preserved:**
- Append-only notes
- Bidirectional links
- Nudge context (stale nodes resurfaced in extraction context)
- Idempotent node creation (upsert)

### 6.6 Database Schema

```sql
-- Kioku layer
nodes (id, name, slug, tags[], status, fields jsonb, notes, embedding vector(512), timestamps)
links (id, source_node_id, target_node_id, relation, timestamps)
messages (id, role, content, follow_up, created_nodes[], updated_nodes[], timestamps)
node_recalls (id, node_id, last_surfaced, surface_count)
journals (id, date, content, timestamps)

-- Dashboard modules
goals (id, user_id, title, description, deadline, status, timestamps)
habits (id, user_id, title, frequency, streak_protection, timestamps)
habit_logs (id, habit_id, date, completed, timestamps)
investments (id, user_id, symbol, thesis, entry_price, current_price, timestamps)
investment_notes (id, investment_id, content, timestamps)
travel_items (id, user_id, title, category, status, budget, timestamps)
creative_projects (id, user_id, title, status, description, images[], timestamps)
reading_items (id, user_id, title, type, status, rating, notes, timestamps)
contacts (id, user_id, name, context, last_interaction, timestamps)
contact_interactions (id, contact_id, date, notes, timestamps)
learning_tracks (id, user_id, title, type, progress, timestamps)
learning_logs (id, track_id, date, notes, duration, timestamps)
captures (id, user_id, content, category, processed, timestamps)
email_cache (id, gmail_id, subject, sender, category, summary, timestamps)
health_snapshots (id, date, steps, calories, heart_rate, sleep, data jsonb, timestamps)
financial_snapshots (id, date, data jsonb, timestamps)
kemi_conversations (id, user_id, messages jsonb, context, timestamps)
```

### 6.7 Cron Jobs (Vercel Cron)

| Task | Frequency | Purpose |
|------|-----------|---------|
| Email triage | Every 30 min | Fetch + categorize new Gmail |
| Health sync | Daily morning | Pull Apple Watch data from webhook |
| Financial sync | Daily | Refresh CoPilot Money data |
| Morning brief | Daily 7 AM | Generate Kemi brief, cache, optional WhatsApp push |
| Streak check | Daily midnight | Update habit streaks, flag breaks |
| Relationship reminder | Weekly | Flag stale contacts |
| Blueprint review | Monthly | Kemi suggests review session |

### 6.8 External Integrations

| Service | Method | Auth |
|---------|--------|------|
| Anthropic Claude | REST API | API key |
| Gmail | OAuth 2.0 | Google Cloud project |
| Google Calendar | OAuth 2.0 | Same Google Cloud project |
| CoPilot Money | Local MCP / unofficial CLI | Token-based |
| Apple HealthKit | Health Auto Export app → webhook | API key |
| WhatsApp | Baileys (unofficial) | QR pairing |
| Telegram | Bot API | Bot token |
| Market data | Alpha Vantage / Yahoo Finance | API key |

---

## 7. Build Phases

### Phase 1: Foundation (Week 1-2)
- Next.js scaffold with project structure
- Supabase project setup (DB, auth)
- Design system: colors, typography, Tailwind config
- Ink wash background (Canvas/WebGL)
- Custom cursor (dripping ink brush)
- Loading screen (brush stroke name draw)
- Landing page scroll narrative (text reveals, basic illustrations)
- Hidden ink seal + PIN auth flow
- Dashboard layout (sidebar, main area)
- Kemi chat interface (UI only)

### Phase 2: Kemi + Core (Week 3-4)
- Kemi personality + Claude API integration
- Kioku pipeline (extract, store, embed)
- Kemi character placeholder (static sumi-e image)
- Dashboard home / daily brief
- Financial Pulse module
- Email Triage (Gmail OAuth)
- Quick Capture bar
- Goals & Habits tracker

### Phase 3: Life Modules (Week 5-6)
- Health & Fitness (Apple Watch sync)
- Learning Dashboard
- Journal (conversational via Kemi)
- Blueprint Tracker
- Passkey/Face ID registration flow

### Phase 4: Depth (Week 7-8)
- Investment Tracker
- Contacts / Relationships
- Travel / Bucket List
- Creative Projects
- Reading / Media

### Phase 5: Polish (Week 9-10)
- Kemi character animation (Rive state machine)
- WhatsApp/Telegram notifications
- Morning brief generation + push
- Public site illustrations (AI-generated sumi-e assets)
- Projects page (scroll gallery)
- Page transitions (brush stroke wipe)
- Sound design implementation
- Ambient ink sounds
- Performance optimization
- Mobile responsive polish

---

## 8. Asset Generation Pipeline

### Sumi-e Illustrations
- Generate via AI image tools (Midjourney, DALL-E, Stable Diffusion)
- Prompt pattern: "sumi-e ink wash painting of [object], Japanese brush stroke style, minimal, on transparent/dark background, Okami game aesthetic"
- Objects: wok, camera, athletic figure, ping pong paddle, Porsche 911 RWB, 3D printer, landscape, laptop, coffee cup
- Output: high-res PNGs, then optimize for web (WebP)

### Brush Typeface
- Generate AI brush letterforms for A-Z + 0-9
- Convert to SVG paths
- Package as web font (woff2) or use inline SVGs for key headings

### Kemi Character
- Generate sumi-e style character concepts
- Create expression sheet (idle, happy, thinking, concerned, excited, sleepy, alert)
- Build in Rive with state machine transitions

---

*Designed for Mike Chen. Built by Mike Chen.*
