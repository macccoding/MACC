# Kemi Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Kemi (Python/FastAPI AI assistant) into me.io (Next.js on Vercel) by expanding the existing 22-tool Kemi infrastructure to ~60 tools, adding memory/embeddings, escalation, Telegram, cron jobs, Google integrations, and voice processing.

**Architecture:** Next.js 16 + Prisma 7 (Neon PostgreSQL with pgvector), Anthropic SDK for Claude, OpenAI SDK for embeddings + Whisper, googleapis for Gmail/Calendar/Sheets, Vercel Cron for scheduled jobs.

**Working Directory:** `/Users/mac/prod/me.io`

**Key Files:**
- Tools: `src/lib/kemi/tools.ts` (tool definitions), `src/lib/kemi/tool-executor.ts` (handlers)
- Context: `src/lib/kemi/context-manager.ts` (keyword-triggered data injection)
- Agent: `src/app/api/kemi/route.ts` (chat endpoint with tool loop)
- Schema: `prisma/schema.prisma`
- System prompt: `src/lib/kemi/system-prompt-builder.ts`, `soul.ts`, `mood.ts`, `autonomy.ts`

**Design System:** Parchment/vermillion/sumi-ink aesthetic, `requireAuth()` PIN guard, Jamaica timezone (UTC-5).

**Build Command:** `cd /Users/mac/prod/me.io && npx next build --webpack`

---

## Phase 0: Schema & Infrastructure

### Task 1: Add new Prisma models

**Files:**
- Modify: `prisma/schema.prisma`

Add these models after the existing ones:

```prisma
model KemiTask {
  id            String    @id @default(cuid())
  title         String
  description   String    @default("")
  status        String    @default("open")
  priority      String    @default("medium")
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
  id             String    @id @default(cuid())
  content        String
  embedding      Unsupported("vector(1536)")?
  memoryType     String    @default("conversation")
  metadata       Json      @default("{}")
  sourceChannel  String?
  importance     Float     @default(0.5)
  accessCount    Int       @default(0)
  lastAccessedAt DateTime?
  expiresAt      DateTime?
  createdAt      DateTime  @default(now())

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
  ruleType    String
  title       String
  description String   @default("")
  dayOfWeek   String[] @default([])
  startTime   String?
  endTime     String?
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
  type        String    @default("goal")
  category    String?
  targetDate  DateTime? @db.Date
  progress    Float     @default(0)
  status      String    @default("active")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("strategic_goals")
}

model ConversationMessage {
  id                String   @id @default(cuid())
  channel           String   @default("web")
  role              String
  content           String
  isVoiceNote       Boolean  @default(false)
  originalVoiceText String?
  metadata          Json     @default("{}")
  createdAt         DateTime @default(now())

  @@map("conversation_messages")
}
```

**Step 1:** Add all models to `prisma/schema.prisma`
**Step 2:** Run `cd /Users/mac/prod/me.io && npx prisma migrate dev --name kemi_migration_models`
**Step 3:** Create the pgvector index manually:
```sql
CREATE INDEX memory_entries_embedding_idx ON memory_entries
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```
Run via: `npx prisma db execute --stdin <<< "CREATE INDEX IF NOT EXISTS memory_entries_embedding_idx ON memory_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);"`
**Step 4:** Build and verify
**Step 5:** Commit

---

### Task 2: Install dependencies + create utility modules

**Files:**
- Modify: `package.json` (add `openai`)
- Create: `src/lib/kemi/action-log.ts` — action logging helper
- Create: `src/lib/kemi/preferences.ts` — preference get/set helper
- Create: `src/lib/kemi/utils.ts` — Jamaica timezone utilities

**action-log.ts:**
```typescript
import { prisma } from "@/lib/prisma";

export async function logAction(
  actionType: string,
  description: string,
  details: Record<string, unknown> = {},
  triggeredBy: string = "user_request",
  channel?: string,
) {
  try {
    await prisma.actionLog.create({
      data: { actionType, description, details, triggeredBy, channel },
    });
  } catch {
    console.error("Failed to log action:", actionType);
  }
}

export async function getActionLog(hoursAgo: number = 24, limit: number = 20) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return prisma.actionLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
```

**preferences.ts:**
```typescript
import { prisma } from "@/lib/prisma";

export async function getPreference<T = unknown>(key: string, defaultValue?: T): Promise<T | undefined> {
  const pref = await prisma.kemiPreference.findUnique({ where: { key } });
  return pref ? (pref.value as T) : defaultValue;
}

export async function setPreference(key: string, value: unknown) {
  await prisma.kemiPreference.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any },
  });
}
```

**utils.ts:**
```typescript
export const JAMAICA_TZ = "America/Jamaica";

export function nowJamaica(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: JAMAICA_TZ }));
}

export function formatJamaicaTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: JAMAICA_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function todayJamaica(): Date {
  const now = nowJamaica();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function startOfWeek(): Date {
  const d = todayJamaica();
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7)); // Monday start
  return d;
}

export function truncateToolResult(content: string, max: number = 4000): string {
  if (content.length <= max) return content;
  return content.slice(0, max) + "\n...[truncated]";
}
```

**Step 1:** Run `cd /Users/mac/prod/me.io && npm install openai`
**Step 2:** Create all three utility files
**Step 3:** Build and verify
**Step 4:** Commit

---

### Task 3: Create escalation system

**Files:**
- Create: `src/lib/kemi/escalation.ts`

Port the Python escalation logic. This is called by the tool executor before mutating operations.

```typescript
import { prisma } from "@/lib/prisma";
import { getPreference } from "./preferences";

interface EscalationResult {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
}

const SENSITIVE_KEYWORDS = [
  "contract", "legal", "termination", "lawsuit",
  "attorney", "settlement", "confidential",
];

const AUTONOMOUS_ACTIONS = new Set([
  "task_created", "task_updated", "task_completed", "task_queried",
  "action_logged", "action_queried",
  "project_queried", "project_activity_updated",
  "email_checked", "email_searched",
  "habit_logged", "journal_entry_created",
  "reading_session_logged", "reading_progress_updated",
  "subscription_created", "subscription_cancelled",
  "memory_stored", "memory_searched",
  "calendar_rule_created", "calendar_rule_updated",
]);

export async function checkEscalation(
  actionType: string,
  details: Record<string, unknown> = {},
): Promise<EscalationResult> {
  const ok: EscalationResult = { allowed: true, reason: "", requiresApproval: false };

  // 1. Kill switch
  const killSwitch = await getPreference<boolean>("kill_switch", false);
  if (killSwitch) {
    return { allowed: false, reason: "Kill switch is active. All autonomous actions paused.", requiresApproval: true };
  }

  // 2. Caricom Freight
  const category = (details.category as string) || "";
  if (category.toLowerCase().includes("caricom") || JSON.stringify(details).toLowerCase().includes("caricom")) {
    return { allowed: false, reason: "Caricom Freight matters always require Mike's explicit approval.", requiresApproval: true };
  }

  // 3. Deletions
  if (actionType.includes("deleted") && !details.confirmed) {
    return { allowed: false, reason: "Deletions require explicit confirmation.", requiresApproval: true };
  }

  // 4. External meeting invitations
  if (["calendar_event_created", "calendar_event_updated"].includes(actionType)) {
    const attendees = (details.external_attendees || details.attendees) as string[] | undefined;
    if (attendees?.length && !details.confirmed) {
      return { allowed: false, reason: `Calendar event with external attendees (${attendees.join(", ")}) requires confirmation.`, requiresApproval: true };
    }
  }

  // 5. Email to unknown contacts
  if (actionType === "email_sent" && !details.confirmed) {
    const toEmail = details.to as string;
    if (toEmail) {
      const contact = await prisma.contact.findFirst({ where: { email: toEmail } });
      if (!contact) {
        return { allowed: false, reason: `First email to unknown contact (${toEmail}) — confirm before sending.`, requiresApproval: true };
      }
    }
    // 6. Sensitive keywords
    const combined = `${details.subject || ""} ${details.body || ""}`.toLowerCase();
    if (SENSITIVE_KEYWORDS.some(kw => combined.includes(kw))) {
      return { allowed: false, reason: "Email contains sensitive keywords — confirm before sending.", requiresApproval: true };
    }
  }

  // 7. Spending thresholds
  const amount = details.amount as number | undefined;
  const currency = (details.currency as string) || "JMD";
  if (amount && amount > 0) {
    const thresholdUsd = await getPreference<number>("spending_threshold_usd", 100);
    const thresholdJmd = await getPreference<number>("spending_threshold_jmd", 15000);
    const threshold = currency.toUpperCase() === "USD" ? thresholdUsd! : thresholdJmd!;
    if (amount > threshold) {
      return { allowed: false, reason: `Spending ${currency} $${amount.toLocaleString()} exceeds threshold of ${currency} $${threshold.toLocaleString()}. Confirm?`, requiresApproval: true };
    }
  }

  // 8. Autonomous allowed
  if (AUTONOMOUS_ACTIONS.has(actionType)) return ok;

  return ok;
}
```

**Step 1:** Create the file
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 1: Tool Expansion (Batch 1 — Prisma-backed tools)

### Task 4: Add Task management tools (4 tools)

**Files:**
- Modify: `src/lib/kemi/tools.ts` — add `create_task`, `update_task`, `complete_task`, `query_tasks` definitions
- Modify: `src/lib/kemi/tool-executor.ts` — add handlers

**Tool definitions to add:**

```typescript
// create_task
{
  name: "create_task",
  description: "Create a new task for Mike. Use for action items, reminders, follow-ups.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Task title" },
      description: { type: "string", description: "Details" },
      priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "Priority level" },
      category: { type: "string", description: "Category (e.g. superplus, personal, caricom)" },
      due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
      tags: { type: "array", items: { type: "string" }, description: "Tags" },
    },
    required: ["title"],
  },
}

// update_task
{
  name: "update_task",
  description: "Update an existing task's fields.",
  input_schema: {
    type: "object",
    properties: {
      task_id: { type: "string", description: "Task ID" },
      title: { type: "string" },
      description: { type: "string" },
      status: { type: "string", enum: ["open", "in_progress", "done", "cancelled", "parked"] },
      priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
      due_date: { type: "string", description: "YYYY-MM-DD" },
      notes: { type: "string" },
    },
    required: ["task_id"],
  },
}

// complete_task
{
  name: "complete_task",
  description: "Mark a task as done.",
  input_schema: {
    type: "object",
    properties: {
      task_id: { type: "string", description: "Task ID to complete" },
    },
    required: ["task_id"],
  },
}

// query_tasks
{
  name: "query_tasks",
  description: "Search and filter tasks. Returns open/in-progress tasks by default.",
  input_schema: {
    type: "object",
    properties: {
      status: { type: "array", items: { type: "string" }, description: "Filter by status(es)" },
      category: { type: "string", description: "Filter by category" },
      search: { type: "string", description: "Search title/description" },
      limit: { type: "number", description: "Max results (default 20)" },
    },
    required: [],
  },
}
```

**Executor handlers:** Use `prisma.kemiTask` for all CRUD. `complete_task` sets `status: "done"` + `completedAt: new Date()`. `query_tasks` defaults status to `["open", "in_progress"]`. All write ops call `logAction()`.

**Step 1:** Add tool definitions to `tools.ts`
**Step 2:** Add executor cases to `tool-executor.ts`
**Step 3:** Build and verify
**Step 4:** Commit

---

### Task 5: Add Contact CRM tools (5 tools)

**Files:**
- Modify: `src/lib/kemi/tools.ts` — add `create_contact`, `update_contact`, `search_contacts`, `set_contact_frequency`, `get_relationship_summary`
- Modify: `src/lib/kemi/tool-executor.ts` — add handlers

**Tools:**
- `create_contact` — accepts name, email, phone, company, relationship, context, birthday, importance, contactFrequency, notes. Creates via `prisma.contact.create()`, logs action.
- `update_contact` — accepts contact_id + any updatable fields. Uses `prisma.contact.update()`.
- `search_contacts` — accepts name, email, context, limit. Uses `OR` query on name/email/company (case-insensitive `contains`).
- `set_contact_frequency` — accepts contact_id, frequency (daily/weekly/biweekly/monthly/quarterly). Maps to days (1/7/14/30/90), computes `nextReachOut = today + days`, updates contact.
- `get_relationship_summary` — no params. Queries overdue reachouts (`nextReachOut < today`) and upcoming birthdays (within 7 days). Returns formatted summary.

**Note:** The existing `get_contacts` and `log_interaction` tools remain. These new tools ADD to them.

**Step 1:** Add definitions and handlers
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 6: Add Strategy tools (5 tools)

**Files:**
- Modify: `src/lib/kemi/tools.ts` — add `set_goal`, `set_priority`, `set_okr`, `review_goals`, `update_goal_progress`
- Modify: `src/lib/kemi/tool-executor.ts` — add handlers

**All use `prisma.strategicGoal` model:**
- `set_goal` — create with type="goal", accepts title, description, category, target_date
- `set_priority` — create with type="priority"
- `set_okr` — create with type="okr"
- `review_goals` — findMany filtered by type and status="active", accepts context_type filter (all/goal/priority/okr)
- `update_goal_progress` — update progress (0-100) and optionally status

**Step 1:** Add definitions and handlers
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 7: Add Calendar Rules tools (4 tools)

**Files:**
- Modify: `src/lib/kemi/tools.ts` — add `create_calendar_rule`, `update_calendar_rule`, `get_calendar_rules`, `delete_calendar_rule`
- Modify: `src/lib/kemi/tool-executor.ts` — add handlers

**All use `prisma.calendarRule` model. Standard CRUD. Delete requires `confirmed: true` (enforced by escalation system).**

**Step 1:** Add definitions and handlers
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 8: Add Action Log + Personal Entry tools (5 tools)

**Files:**
- Modify: `src/lib/kemi/tools.ts` — add `log_action`, `get_action_log`, `log_entry`, `query_entries`, `get_summary`
- Modify: `src/lib/kemi/tool-executor.ts` — add handlers

**Action Log tools:**
- `log_action` — wraps `logAction()` utility, exposes it as tool
- `get_action_log` — wraps `getActionLog()` utility

**Personal Entry tools (map to existing Transaction model + FinancialSnapshot):**
- `log_entry` — accepts category (expense/income/health/learning/note), title, amount, currency (default JMD), tags, notes, date. Creates `Transaction` record. Runs escalation check for expenses.
- `query_entries` — accepts category, date_from, date_to, tags, limit. Queries `Transaction` with filters.
- `get_summary` — accepts category, period (week/month/year). Computes period boundaries, queries transactions, groups by category, returns totals.

**Step 1:** Add definitions and handlers
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 9: Add Budget/Reading/Habits/Journal tool definitions

**Files:**
- Modify: `src/lib/kemi/tools.ts` — add tool defs for existing me.io APIs
- Modify: `src/lib/kemi/tool-executor.ts` — add handlers that call Prisma directly

These tools already have me.io API routes. The Kemi tool definitions call Prisma directly (not HTTP).

**Tools to add:**
- `get_budget_overview` — query BudgetAllocation + Transaction (current month) + compute per-category spending
- `get_subscriptions` — query RecurringTransaction where active=true
- `add_subscription` — create RecurringTransaction
- `cancel_subscription` — update RecurringTransaction active=false
- `log_reading_session` — create ReadingLog for a reading item
- `update_reading_progress` — update ReadingItem progress/status/rating/takeaway
- `create_journal_entry` — create JournalEntry (replaces simple `add_journal`)
- `query_journal` — query JournalEntry with type/search/date filters

**Note:** Some of these overlap with existing tools (`add_journal`, `get_reading`, `log_habit`). Update the existing tool handlers to use the new models and add the new tools alongside.

**Step 1:** Add definitions and handlers
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 2: Google Integrations

### Task 10: Create Google auth + Gmail client

**Files:**
- Create: `src/lib/kemi/google/auth.ts` — OAuth2 client with service account refresh tokens
- Create: `src/lib/kemi/google/gmail.ts` — getUnreadEmails, getEmailBody, sendEmail, searchEmails

**auth.ts:**
```typescript
import { google } from "googleapis";

const ACCOUNTS = {
  business: process.env.GOOGLE_REFRESH_TOKEN_BUSINESS,
  personal: process.env.GOOGLE_REFRESH_TOKEN_PERSONAL,
  tools: process.env.GOOGLE_REFRESH_TOKEN_TOOLS,
} as const;

export function getOAuth2Client(account: keyof typeof ACCOUNTS = "business") {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: ACCOUNTS[account] });
  return oauth2;
}

export function getGmail(account: keyof typeof ACCOUNTS = "business") {
  return google.gmail({ version: "v1", auth: getOAuth2Client(account) });
}

export function getCalendarClient(account: keyof typeof ACCOUNTS = "business") {
  return google.calendar({ version: "v3", auth: getOAuth2Client(account) });
}

export function getSheetsClient(account: keyof typeof ACCOUNTS = "business") {
  return google.sheets({ version: "v4", auth: getOAuth2Client(account) });
}

export type GoogleAccount = keyof typeof ACCOUNTS;
```

**gmail.ts:**
```typescript
import { getGmail, type GoogleAccount } from "./auth";

export async function getUnreadEmails(account: GoogleAccount = "business", maxResults = 10) {
  const gmail = getGmail(account);
  const res = await gmail.users.messages.list({
    userId: "me", q: "is:unread", maxResults,
  });
  if (!res.data.messages) return [];
  const emails = await Promise.all(
    res.data.messages.map(async (m) => {
      const msg = await gmail.users.messages.get({ userId: "me", id: m.id! });
      const headers = msg.data.payload?.headers || [];
      return {
        id: m.id,
        subject: headers.find(h => h.name === "Subject")?.value || "",
        from: headers.find(h => h.name === "From")?.value || "",
        date: headers.find(h => h.name === "Date")?.value || "",
        snippet: msg.data.snippet || "",
      };
    })
  );
  return emails;
}

export async function getEmailBody(account: GoogleAccount, messageId: string) {
  const gmail = getGmail(account);
  const msg = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
  // Extract plain text body from parts
  const parts = msg.data.payload?.parts || [];
  const textPart = parts.find(p => p.mimeType === "text/plain");
  const body = textPart?.body?.data
    ? Buffer.from(textPart.body.data, "base64").toString()
    : msg.data.snippet || "";
  return { ...msg.data, bodyText: body };
}

export async function sendEmail(
  account: GoogleAccount,
  to: string, subject: string, body: string,
  threadId?: string,
) {
  const gmail = getGmail(account);
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  ).toString("base64url");
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId },
  });
  return res.data;
}

export async function searchEmails(account: GoogleAccount, query: string, maxResults = 10) {
  const gmail = getGmail(account);
  const res = await gmail.users.messages.list({ userId: "me", q: query, maxResults });
  if (!res.data.messages) return [];
  const emails = await Promise.all(
    res.data.messages.map(async (m) => {
      const msg = await gmail.users.messages.get({ userId: "me", id: m.id! });
      const headers = msg.data.payload?.headers || [];
      return {
        id: m.id,
        subject: headers.find(h => h.name === "Subject")?.value || "",
        from: headers.find(h => h.name === "From")?.value || "",
        snippet: msg.data.snippet || "",
      };
    })
  );
  return emails;
}
```

**Step 1:** Create both files
**Step 2:** Add env vars to `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN_BUSINESS`, `GOOGLE_REFRESH_TOKEN_PERSONAL`, `GOOGLE_REFRESH_TOKEN_TOOLS`
**Step 3:** Build and verify
**Step 4:** Commit

---

### Task 11: Create Google Calendar + Sheets clients

**Files:**
- Create: `src/lib/kemi/google/calendar.ts`
- Create: `src/lib/kemi/google/sheets.ts`

**calendar.ts:**
- `getEvents(startDate, endDate, account)` — calendar.events.list with timeMin/timeMax
- `createEvent(summary, start, end, description?, location?, attendees?, account?)` — calendar.events.insert
- `updateEvent(eventId, updates, account?)` — calendar.events.patch
- `deleteEvent(eventId, account?)` — calendar.events.delete
- `getTodayEvents(account?)` — convenience wrapper for today's range

All use `getCalendarClient()` from auth.ts. Default calendarId from `process.env.GOOGLE_CALENDAR_ID || "primary"`.

**sheets.ts:**
- `getSheetValues(spreadsheetId, range)` — sheets.spreadsheets.values.get
- `updateSheetValues(spreadsheetId, range, values[][])` — sheets.spreadsheets.values.update (RAW input)
- `appendRows(spreadsheetId, range, rows[][])` — sheets.spreadsheets.values.append

All use `getSheetsClient()` from auth.ts.

**Step 1:** Create both files
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 12: Add Gmail/Calendar/Sheets tools (11 tools)

**Files:**
- Modify: `src/lib/kemi/tools.ts` — add 11 tool definitions
- Modify: `src/lib/kemi/tool-executor.ts` — add handlers calling Google clients

**Email tools (4):**
- `check_email` — calls `getUnreadEmails()` for specified or all accounts
- `read_email` — calls `getEmailBody(account, messageId)`
- `send_email` — runs escalation check, then calls `sendEmail()`, logs action, auto-logs contact interaction
- `search_email` — calls `searchEmails(account, query)` with Gmail syntax

**Calendar tools (4):**
- `get_calendar_events` — calls `getEvents(startDate, endDate)`
- `create_calendar_event` — runs escalation (external attendees), calls `createEvent()`, logs action
- `update_calendar_event` — calls `updateEvent()`, logs action
- `delete_calendar_event` — requires confirmed=true (via escalation), calls `deleteEvent()`

**Sheets tools (3):**
- `read_sheet` — calls `getSheetValues(spreadsheetId, range)`
- `update_sheet` — calls `updateSheetValues()`, logs action
- `append_sheet` — calls `appendRows()`, logs action

**Step 1:** Add all 11 tool definitions
**Step 2:** Add all 11 executor handlers
**Step 3:** Build and verify
**Step 4:** Commit

---

## Phase 3: Memory System

### Task 13: Create memory service with OpenAI embeddings + pgvector

**Files:**
- Create: `src/lib/kemi/memory.ts`

```typescript
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embedText(content: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });
  return res.data[0].embedding;
}

export async function remember(
  content: string,
  memoryType: string = "conversation",
  metadata: Record<string, unknown> = {},
  sourceChannel?: string,
  importance: number = 0.5,
): Promise<string | null> {
  try {
    const embedding = await embedText(content);
    const vectorStr = `[${embedding.join(",")}]`;
    // Use raw query for vector insert (Prisma doesn't support vector type natively)
    const result = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO memory_entries (id, content, embedding, "memoryType", metadata, "sourceChannel", importance, "createdAt")
       VALUES (gen_random_uuid(), $1, $2::vector, $3, $4::jsonb, $5, $6, NOW())
       RETURNING id`,
      content, vectorStr, memoryType, JSON.stringify(metadata), sourceChannel, importance,
    );
    return result[0]?.id ?? null;
  } catch (e) {
    console.error("Memory store failed:", e);
    return null;
  }
}

export async function recall(
  query: string,
  limit: number = 5,
  filterType?: string,
  threshold: number = 0.7,
): Promise<Array<{ id: string; content: string; similarity: number; memoryType: string }>> {
  try {
    const embedding = await embedText(query);
    const vectorStr = `[${embedding.join(",")}]`;
    const typeFilter = filterType ? `AND "memoryType" = '${filterType}'` : "";
    const results = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, content, "memoryType", 1 - (embedding <=> $1::vector) as similarity
       FROM memory_entries
       WHERE embedding IS NOT NULL ${typeFilter}
       AND 1 - (embedding <=> $1::vector) > $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      vectorStr, threshold, limit,
    );
    // Fire-and-forget: update access timestamps
    if (results.length > 0) {
      const ids = results.map(r => r.id);
      prisma.$executeRawUnsafe(
        `UPDATE memory_entries SET "accessCount" = "accessCount" + 1, "lastAccessedAt" = NOW() WHERE id = ANY($1)`,
        ids,
      ).catch(() => {});
    }
    return results;
  } catch (e) {
    console.error("Memory recall failed:", e);
    return [];
  }
}

export async function deleteExpiredMemories(): Promise<number> {
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM memory_entries WHERE "expiresAt" IS NOT NULL AND "expiresAt" < NOW()`,
  );
  return result;
}
```

**Step 1:** Add `OPENAI_API_KEY` to `.env.local`
**Step 2:** Create the file
**Step 3:** Build and verify
**Step 4:** Commit

---

### Task 14: Add memory tools + wire into agent loop

**Files:**
- Modify: `src/lib/kemi/tools.ts` — add `search_memories`, `store_memory`
- Modify: `src/lib/kemi/tool-executor.ts` — add handlers
- Modify: `src/app/api/kemi/route.ts` — add fire-and-forget conversation embedding after response

**Memory tools:**
- `search_memories` — accepts query, limit (default 5), memory_type, threshold (default 0.7). Calls `recall()`.
- `store_memory` — accepts content, memory_type (preference/fact/note), metadata, importance (default 0.5). Calls `remember()`.

**Agent loop change:**
After extracting final response text, add:
```typescript
// Fire-and-forget: embed conversation in memory
if (userMessage.length >= 20 || responseText.length >= 50) {
  remember(
    `User: ${userMessage}\nAssistant: ${responseText.slice(0, 500)}`,
    "conversation",
    {},
    "web",
    0.3,
  ).catch(() => {});
}
```

**Step 1:** Add tool definitions and handlers
**Step 2:** Update agent loop
**Step 3:** Build and verify
**Step 4:** Commit

---

## Phase 4: Telegram

### Task 15: Create Telegram webhook + send utilities

**Files:**
- Create: `src/lib/kemi/telegram.ts` — sendMessage, sendInlineKeyboard
- Create: `src/app/api/telegram/webhook/route.ts` — POST handler

**telegram.ts:**
```typescript
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const MIKE_CHAT_ID = process.env.MIKE_TELEGRAM_CHAT_ID!;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(text: string, chatId: string = MIKE_CHAT_ID) {
  await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

export async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  const fileRes = await fetch(`${API_BASE}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result.file_path;
  const downloadRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
  return Buffer.from(await downloadRes.arrayBuffer());
}
```

**webhook/route.ts:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage, downloadTelegramFile } from "@/lib/kemi/telegram";
import { prisma } from "@/lib/prisma";
// Import the agent processing function (extract from /api/kemi/route.ts into shared module)

const MIKE_CHAT_ID = process.env.MIKE_TELEGRAM_CHAT_ID!;

export async function POST(request: NextRequest) {
  const update = await request.json();
  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  // Auth: only process Mike's messages
  const chatId = String(message.chat.id);
  if (chatId !== MIKE_CHAT_ID) return NextResponse.json({ ok: true });

  let text = message.text || "";
  let isVoiceNote = false;
  let originalVoiceText: string | undefined;

  // Handle voice messages
  if (message.voice) {
    isVoiceNote = true;
    try {
      const audioBuffer = await downloadTelegramFile(message.voice.file_id);
      // Transcribe with Whisper
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI();
      const file = new File([audioBuffer], "voice.ogg", { type: "audio/ogg" });
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file,
        language: "en",
        prompt: "Jamaican English and Patois. Names: Juddy, Camille, Jermone, Claudette, Aleer, Arlene, Manda, Matthieu, Jamie, Sabrina, Charles. Businesses: SuperPlus, GasMart, Kingsland Kitchen, D'Ville, Istry, Caricom Freight. Places: Mandeville, Kingsland, Opa Locka.",
      });
      originalVoiceText = transcription.text;
      text = transcription.text;
    } catch (e) {
      console.error("Voice transcription failed:", e);
      await sendTelegramMessage("Couldn't transcribe that voice note. Try again?");
      return NextResponse.json({ ok: true });
    }
  }

  if (!text) return NextResponse.json({ ok: true });

  // Kill switch handling
  if (text.toUpperCase() === "STOP") {
    const { setPreference } = await import("@/lib/kemi/preferences");
    await setPreference("kill_switch", true);
    await sendTelegramMessage("Kill switch activated. I'll only respond — no autonomous actions until you say RESUME.");
    return NextResponse.json({ ok: true });
  }
  if (text.toUpperCase() === "RESUME") {
    const { setPreference } = await import("@/lib/kemi/preferences");
    await setPreference("kill_switch", false);
    await sendTelegramMessage("Resumed. Back to full autonomous mode.");
    return NextResponse.json({ ok: true });
  }

  try {
    // Process through Kemi agent (reuse the core logic from /api/kemi)
    const { processKemiMessage } = await import("@/lib/kemi/agent");
    const response = await processKemiMessage(text, "telegram", isVoiceNote, originalVoiceText);
    await sendTelegramMessage(response);
  } catch (e) {
    console.error("Telegram processing error:", e);
    await sendTelegramMessage("Something went wrong. Try again.");
  }

  return NextResponse.json({ ok: true });
}
```

**Step 1:** Create both files
**Step 2:** Add `TELEGRAM_BOT_TOKEN` and `MIKE_TELEGRAM_CHAT_ID` to `.env.local`
**Step 3:** Build and verify
**Step 4:** Commit

---

### Task 16: Extract shared agent processing function

**Files:**
- Create: `src/lib/kemi/agent.ts` — shared `processKemiMessage()` function
- Modify: `src/app/api/kemi/route.ts` — refactor to use `processKemiMessage()`

Extract the core agent logic (context building, system prompt, Claude call, tool loop) from `/api/kemi/route.ts` into a reusable function:

```typescript
export async function processKemiMessage(
  message: string,
  channel: string = "web",
  isVoiceNote: boolean = false,
  originalVoiceText?: string,
  history?: Array<{ role: string; content: string }>,
  conversationId?: string,
): Promise<string>
```

This function:
1. Routes model via `routeModel()`
2. Fetches context via `getRelevantContext(message)`
3. Builds system prompt
4. Loads conversation history from `ConversationMessage` table (for telegram channel) or uses passed `history` (for web)
5. Runs Claude with tools (max 10 rounds)
6. Saves conversation messages
7. Fire-and-forget embeds to memory
8. Returns response text

The `/api/kemi/route.ts` becomes a thin wrapper that parses the request body, calls `processKemiMessage()`, and returns the response.

**Step 1:** Create `agent.ts`
**Step 2:** Refactor `route.ts` to use it
**Step 3:** Build and verify — ensure web chat still works
**Step 4:** Commit

---

## Phase 5: Context Manager Expansion

### Task 17: Expand context manager from 5 to 15 keyword groups

**Files:**
- Modify: `src/lib/kemi/context-manager.ts`

Add these keyword groups (porting from Python `context_manager.py`):

**Already exists (5):**
- habits, health, portfolio, finance, goals

**Add (10):**
1. **Calendar** — keywords: `calendar, schedule, meeting, event, time block, gym, deep work`. Fetch: `getTodayEvents()` from Google Calendar.
2. **Email** — keywords: `email, gmail, inbox, reply, thread`. Fetch: `getUnreadEmails()` count per account.
3. **Tasks** — keywords: `task, todo, overdue, deadline, action item`. Fetch: overdue + due-today from `KemiTask`.
4. **Projects** — always include if any exist. Fetch: active projects from existing `CreativeProject` or future project model.
5. **Actions** — keywords: `what did you do, actions, action log, audit`. Fetch: last 24h from `ActionLog`.
6. **Birthdays** — keywords: `birthday, birthdays`. Fetch: contacts with birthday within 7 days.
7. **Memory** — keywords: `remember, earlier, before, last time, previous, you said, i said` OR message >= 20 chars. Fetch: `recall(message, 3, undefined, 0.72)`.
8. **Journal** — keywords: `journal, reflect, reflection, capture, thought, diary`. Fetch: today's entry count from `JournalEntry`.
9. **Reading** — keywords: `reading, book, books, pages, read, audiobook`. Fetch: currently-reading items with progress.
10. **Budget** — keywords: `budget, allocation, runway, subscription, recurring, bills`. Fetch: latest `BudgetScore`.

Implement budget management: max 3500 chars total context. Each section is appended with truncation.

**Step 1:** Add all keyword groups
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 18: Expand soul files + system prompt

**Files:**
- Modify: `src/lib/kemi/soul.ts` — add CONTEXT_BUSINESSES
- Modify: `src/lib/kemi/system-prompt-builder.ts` — include businesses context

Add business context from Python `CONTEXT_BUSINESSES.md`:
- Istry: parent company, bespoke food & beverage
- SuperPlus: community store, Kingsland Mandeville, 5 days/week
- D'Ville: restaurant, CEO high-level
- Caricom Freight: father's business, ALWAYS HIGH STAKES

**Step 1:** Add business context
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 6: Cron Jobs

### Task 19: Create cron routes + vercel.json

**Files:**
- Create: `src/app/api/cron/morning/route.ts`
- Create: `src/app/api/cron/midday/route.ts`
- Create: `src/app/api/cron/evening/route.ts`
- Create: `src/app/api/cron/night/route.ts`
- Create: `src/app/api/cron/hourly/route.ts`
- Create: `src/app/api/cron/weekly/route.ts`
- Create: `src/app/api/cron/predictions/route.ts`
- Modify: `vercel.json` (or create if not exists)

**Auth pattern for all cron routes:**
```typescript
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... job logic
}
```

**Morning (6:00 AM Jamaica):**
- Exercise reminder → send via Telegram
- Birthday check → query contacts, send alerts
- Daily reachout check → query overdue contacts, send list

**Midday (11:00 AM Jamaica):**
- Briefing generation → reuse existing `/api/kemi/briefing` logic, send via Telegram
- Overdue task nudge → query KemiTask where dueDate < today, escalate based on days overdue

**Evening (8:00 PM Jamaica):**
- Evening digest → summarize today's actions, tasks completed, spending
- Budget score computation → compute and store BudgetScore
- Verbal capture prompt → Telegram nudge

**Night (10:30 PM Jamaica):**
- Wind-down note → gentle Telegram message
- Night owl check (12:30 AM) — separate cron entry

**Hourly (8 AM-8 PM Jamaica):**
- Email triage → sync unread emails to EmailCache, flag urgent
- Task nudge (every 2 hours) → check overdue tasks

**Weekly (Friday 5 PM Jamaica):**
- Project pulse, expense summary, strategy review, calendar rules application

**Predictions (4x daily: 8, 12, 16, 20):**
- Generate proactive suggestions using Claude → send top 3 via Telegram

**vercel.json:**
```json
{
  "crons": [
    { "path": "/api/cron/morning", "schedule": "0 11 * * *" },
    { "path": "/api/cron/midday", "schedule": "0 16 * * *" },
    { "path": "/api/cron/evening", "schedule": "0 1 * * *" },
    { "path": "/api/cron/night", "schedule": "30 3 * * *" },
    { "path": "/api/cron/hourly", "schedule": "0 13-1 * * *" },
    { "path": "/api/cron/weekly", "schedule": "0 22 * * 5" },
    { "path": "/api/cron/predictions", "schedule": "0 13,17,21,1 * * *" }
  ]
}
```
**Note:** Cron schedules are in UTC. Jamaica is UTC-5, so 6 AM Jamaica = 11 AM UTC.

**Step 1:** Create all cron route files with proper auth
**Step 2:** Create/update vercel.json
**Step 3:** Add `CRON_SECRET` to Vercel env vars
**Step 4:** Build and verify
**Step 5:** Commit

---

## Phase 7: Agent Loop Upgrade

### Task 20: Upgrade agent loop + conversation persistence

**Files:**
- Modify: `src/lib/kemi/agent.ts` — increase limits, add tool result truncation, add conversation saving

**Changes:**
1. `MAX_TOOL_ROUNDS`: 5 → 10
2. Add `truncateToolResult()` call on all tool results (4000 char max)
3. Save conversation messages to `ConversationMessage` table (not just KemiConversation JSON blob)
4. Load recent conversation history from `ConversationMessage` for context
5. Add kill switch check at top of `processKemiMessage()`
6. Add image support (base64 encoding for photo messages from Telegram)

**Step 1:** Update the agent
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 21: Wire escalation into tool executor

**Files:**
- Modify: `src/lib/kemi/tool-executor.ts` — add escalation checks before mutating operations

Add escalation check before these tools:
- `send_email` → action_type: "email_sent"
- `create_calendar_event` → action_type: "calendar_event_created"
- `update_calendar_event` → action_type: "calendar_event_updated"
- `delete_calendar_event` → action_type: "calendar_event_deleted"
- `log_entry` (expense) → check spending threshold
- `create_task` → action_type: "task_created" (autonomous OK, just log)
- `delete_calendar_rule` → action_type: "calendar_rule_deleted"
- `cancel_subscription` → action_type: "subscription_cancelled"

Pattern:
```typescript
case "send_email": {
  const esc = await checkEscalation("email_sent", {
    to: input.to, confirmed: input.confirmed,
    subject: input.subject, body: input.body,
  });
  if (!esc.allowed) return { error: esc.reason, requiresApproval: esc.requiresApproval };
  // ... proceed with sending
}
```

**Step 1:** Add escalation checks
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 22: Register Telegram webhook + final verification

**Files:**
- None (API calls only)

**Step 1:** Register webhook with Telegram:
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://mikechen.xyz/api/telegram/webhook"
```

**Step 2:** Add all required env vars to Vercel:
- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `MIKE_TELEGRAM_CHAT_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN_BUSINESS`
- `GOOGLE_REFRESH_TOKEN_PERSONAL`
- `GOOGLE_REFRESH_TOKEN_TOOLS`
- `GOOGLE_CALENDAR_ID`
- `CRON_SECRET`

**Step 3:** Full build verification: `cd /Users/mac/prod/me.io && npx next build --webpack`

**Step 4:** Deploy: `git push`

**Step 5:** Test Telegram: send a message to the bot, verify response

**Step 6:** Test web chat: open mikechen.xyz, chat with Kemi, verify tools work

**Step 7:** Commit any final fixes

---

## Implementation Order Summary

| Phase | Tasks | What | Tools Added |
|-------|-------|------|-------------|
| 0 | 1-3 | Schema, deps, utilities, escalation | 0 |
| 1 | 4-9 | Tool expansion (Prisma-backed) | ~30 |
| 2 | 10-12 | Google integrations + tools | ~11 |
| 3 | 13-14 | Memory system + tools | 2 |
| 4 | 15-16 | Telegram + shared agent function | 0 |
| 5 | 17-18 | Context manager + soul expansion | 0 |
| 6 | 19 | Cron jobs (8 routes) | 0 |
| 7 | 20-22 | Agent upgrade, escalation wiring, deploy | 0 |

**Total: 22 tasks across 8 phases. ~43 new tools (22 existing + 43 new = ~65 total).**
