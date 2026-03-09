# Kemi Migration Design: Python → me.io (Next.js)

## Problem

Kemi (Python/FastAPI AI assistant) runs on Railway, whose free trial expired. Rather than find new Python hosting, we migrate Kemi's capabilities into me.io (Next.js on Vercel) — which already has 22 Kemi tools, chat UI, briefing, soul system, and model routing.

## Scope

Port **all** Python Kemi capabilities except:
- **Multi-agent dispatch** — skip (existing 10-round tool loop suffices for personal use)
- **MCP protocol infrastructure** — replace with direct API calls (simpler on serverless)
- **Supabase MCP server** — drop (Prisma handles all DB access)

### Capabilities to Migrate

| Capability | Python Source | me.io Target |
|-----------|-------------|-------------|
| 47 additional tools | `agent/tools/*.py` | `src/lib/kemi/tools.ts` + `tool-executor.ts` |
| Telegram channel | `gateway/channels/telegram.py` | `/api/telegram/webhook` route |
| Voice processing | `services/whisper.py` | OpenAI Whisper API call in webhook |
| Memory/embeddings | `services/memory.py` | `src/lib/kemi/memory.ts` + pgvector |
| 20+ scheduled jobs | `scheduler/setup.py` | 8 Vercel Cron routes |
| Escalation system | `core/escalation.py` | `src/lib/kemi/escalation.ts` |
| Google integrations | `services/gmail.py`, `gcalendar.py`, `gsheets.py` | `src/lib/kemi/google/*.ts` |
| Context manager (15 keyword groups) | `core/context_manager.py` | Expand existing `context-manager.ts` |
| Soul/identity files | `soul/*.md` | Already in `src/lib/kemi/soul.ts` (expand) |
| Conversation history | `db/queries.py` | Expand `KemiConversation` model |
| Agent loop (10 rounds) | `core/agent.py` | Upgrade existing `/api/kemi/route.ts` |

## Architecture

```
me.io (Next.js on Vercel)
├── /api/kemi/route.ts              ← upgraded agent loop (10 rounds)
├── /api/kemi/briefing/route.ts     ← existing (keep)
├── /api/telegram/webhook/route.ts  ← NEW: Telegram input
├── /api/cron/
│   ├── morning/route.ts            ← briefing, habits, exercise
│   ├── evening/route.ts            ← digest, wind-down, budget score
│   ├── hourly/route.ts             ← email triage, calendar sync
│   ├── health/route.ts             ← Apple Health pull
│   ├── weekly/route.ts             ← reviews, reachouts, strategy
│   ├── finance/route.ts            ← investment prices
│   ├── maintenance/route.ts        ← memory cleanup, embedding refresh
│   └── predictions/route.ts        ← proactive AI suggestions
├── /src/lib/kemi/
│   ├── tools.ts                    ← expand 22 → ~60 tools
│   ├── tool-executor.ts            ← expand handlers
│   ├── context-manager.ts          ← expand 5 → 15 keyword groups
│   ├── escalation.ts               ← NEW: spending/approval gates
│   ├── memory.ts                   ← NEW: embeddings + pgvector
│   ├── preferences.ts              ← NEW: kill switch, thresholds
│   ├── google/
│   │   ├── auth.ts                 ← service account OAuth2
│   │   ├── gmail.ts                ← read, send, search
│   │   ├── calendar.ts             ← CRUD events
│   │   └── sheets.ts               ← read, update, append
│   └── telegram.ts                 ← send message, inline keyboards
```

## Key Decisions

1. **No MCP** — Tavily, Zapier, currency via direct `fetch()` calls
2. **Vercel Cron** — 8 consolidated routes (Pro plan: 40 crons, 300s timeout)
3. **Service account** for Google APIs (single user, no OAuth flow needed)
4. **pgvector in Neon** for memory (vector extension already enabled)
5. **Telegram webhook** as API route (not polling)
6. **OpenAI** for embeddings only (`text-embedding-3-small`)
7. **Tool loop upgrade** from 5 → 10 iterations with 4000-char result truncation

## New Prisma Models

```prisma
model KemiTask {
  id            String    @id @default(cuid())
  title         String
  description   String    @default("")
  status        String    @default("open")     // open, in_progress, done, cancelled, parked
  priority      String    @default("medium")   // urgent, high, medium, low
  category      String?
  dueDate       DateTime? @db.Date
  completedAt   DateTime?
  tags          String[]  @default([])
  notes         String    @default("")
  sortOrder     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("kemi_tasks")
}

model ActionLog {
  id          String   @id @default(cuid())
  actionType  String
  description String
  details     Json     @default("{}")
  triggeredBy String   @default("user_request")
  channel     String?
  status      String   @default("completed")
  createdAt   DateTime @default(now())

  @@map("action_logs")
}

model MemoryEntry {
  id            String    @id @default(cuid())
  content       String
  embedding     Unsupported("vector(1536)")?
  memoryType    String    @default("conversation")
  metadata      Json      @default("{}")
  sourceChannel String?
  importance    Float     @default(0.5)
  accessCount   Int       @default(0)
  lastAccessedAt DateTime?
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())

  @@map("memory_entries")
}

model KemiPreference {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt

  @@map("kemi_preferences")
}

model CalendarRule {
  id          String   @id @default(cuid())
  ruleType    String                          // block_recurring, auto_decline, focus_time, reminder
  title       String
  description String   @default("")
  dayOfWeek   String[] @default([])
  startTime   String?                         // HH:MM
  endTime     String?                         // HH:MM
  calendarId  String?
  metadata    Json     @default("{}")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("calendar_rules")
}

model StrategicGoal {
  id          String    @id @default(cuid())
  title       String
  description String    @default("")
  type        String    @default("goal")      // goal, priority, okr
  category    String?
  targetDate  DateTime? @db.Date
  progress    Float     @default(0)
  status      String    @default("active")    // active, completed, paused, abandoned
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("strategic_goals")
}

model ConversationMessage {
  id               String   @id @default(cuid())
  channel          String   @default("web")
  role             String                       // user, assistant
  content          String
  isVoiceNote      Boolean  @default(false)
  originalVoiceText String?
  metadata         Json     @default("{}")
  createdAt        DateTime @default(now())

  @@map("conversation_messages")
}
```

## Cron Consolidation

| Route | Schedule | Jobs Consolidated |
|-------|----------|-------------------|
| `/api/cron/morning` | `0 6 * * *` | Exercise reminder, birthday check, daily reachout check |
| `/api/cron/midday` | `0 11 * * *` | Midday briefing, overdue task nudge |
| `/api/cron/evening` | `0 20 * * *` | Evening digest, budget score, verbal capture prompt |
| `/api/cron/night` | `30 22 * * *` | Wind-down note, night owl check |
| `/api/cron/hourly` | `0 8-20 * * *` | Email triage, email monitor, task nudge (business hours) |
| `/api/cron/health` | `0 23 * * *` | Apple Health data pull |
| `/api/cron/weekly` | `0 17 * * 5` | Weekly project pulse, expense summary, strategy session, SuperPlus report, calendar rules |
| `/api/cron/predictions` | `0 8,12,16,20 * * *` | Proactive AI suggestions |

## New Dependencies

- `openai` — embeddings via `text-embedding-3-small` (Whisper also via OpenAI API)
- No new deps for Google — `googleapis` already installed
- No new deps for Telegram — raw `fetch()` to Bot API

## What Gets Dropped

- Python FastAPI server + Railway hosting
- MCP protocol infrastructure (6 server connections)
- Multi-agent dispatcher (5 specialists)
- Supabase direct client (replaced by Prisma)
- APScheduler (replaced by Vercel Cron)
- meio_client.py (Kemi IS me.io now — direct Prisma queries)
