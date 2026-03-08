# Module Overhaul Implementation Plan (me.io)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade existing modules (Habits, Journal, Reading, Health, Finances, People) and build 2 new modules (Budget, Calendar) in the MikeOS dashboard at mikechen.xyz.

**Architecture:** Next.js 16 + React 19, Prisma 7 (PrismaPg adapter, Neon PostgreSQL), Tailwind CSS v4 with custom design system (parchment/vermillion/sumi-ink aesthetic), Framer Motion for all animations, PIN-based auth via `requireAuth()`.

**Design System:**
- Cards: `bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4`
- Buttons: `bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase`
- Headings: `text-ink-black font-light` with `fontSize: "var(--text-heading)"`
- Labels: `font-mono tracking-[0.12em] uppercase text-sumi-gray-light` with `fontSize: "var(--text-micro)"`
- Ease curve: `[0.22, 1, 0.36, 1]`
- All pages use `"use client"` with Framer Motion `<motion.div>` wrappers

**API Pattern:**
```typescript
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
// GET/POST/PATCH/DELETE with requireAuth(request) guard
```

**Route Pattern:** `src/app/(dashboard)/dashboard/[module]/page.tsx`

---

## Phase 0: Schema Evolution

### Task 1: Prisma schema migration — Habits upgrade

**Files:**
- Modify: `prisma/schema.prisma`

**Changes to Habit model:**
```prisma
model Habit {
  id               String   @id @default(cuid())
  title            String
  type             String   @default("daily")       // daily, frequency, quantity, negative, timed
  targetValue      Float    @default(1)              // quantity target or minutes
  frequencyPerPeriod Int    @default(1)              // e.g. 3 for "3x per week"
  period           String   @default("day")          // day, week, month
  color            String   @default("#e04835")      // vermillion default
  icon             String?                           // emoji
  sortOrder        Int      @default(0)
  archived         Boolean  @default(false)
  frequency        String   @default("daily")        // KEEP existing field for backwards compat
  streakProtection Boolean  @default(false)          // KEEP existing field
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  logs HabitLog[]

  @@map("habits")
}

model HabitLog {
  id        String   @id @default(cuid())
  habitId   String
  date      DateTime @db.Date
  completed Boolean  @default(true)                  // KEEP existing field
  value     Float    @default(1)                     // quantity amount
  skipped   Boolean  @default(false)                 // intentional skip
  note      String?
  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])
  @@map("habit_logs")
}
```

**Step 1:** Update prisma/schema.prisma with the new fields
**Step 2:** Run `cd /Users/mac/prod/me.io && npx prisma migrate dev --name habits_upgrade`
**Step 3:** Commit

---

### Task 2: Prisma schema migration — Journal restructure

**Files:**
- Modify: `prisma/schema.prisma`

**Replace Journal model with JournalEntry:**
```prisma
model JournalEntry {
  id        String   @id @default(cuid())
  type      String   @default("reflection")    // reflection, capture, note
  title     String?
  body      String
  prompt    String?                            // the question that generated it
  tags      String[] @default([])
  date      DateTime @db.Date                  // keep date for backwards compat
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("journal_entries")
}
```

**IMPORTANT:** The old `Journal` model uses `journals` table with unique `date` constraint. We need to:
1. Create the new `journal_entries` table alongside
2. Migrate existing journal data: each old entry becomes a `type: "reflection"` entry
3. Update all API routes and pages to use JournalEntry
4. Drop old journals table after migration

**Step 1:** Add JournalEntry model to schema (keep old Journal temporarily)
**Step 2:** Run migration
**Step 3:** Write a data migration script to copy journals → journal_entries
**Step 4:** Remove old Journal model, run another migration
**Step 5:** Commit

---

### Task 3: Prisma schema migration — Reading upgrade + Budget + Recurring

**Files:**
- Modify: `prisma/schema.prisma`

**Add fields to ReadingItem:**
```prisma
model ReadingItem {
  id         String    @id @default(cuid())
  title      String
  author     String?
  coverUrl   String?
  type       String    @default("book")        // KEEP: book, article, paper, podcast
  format     String?                           // NEW: audiobook, ebook, physical
  status     String    @default("to_read")
  progress   Float     @default(0)             // NEW: 0-100
  startedAt  DateTime?                         // NEW
  finishedAt DateTime?                         // NEW
  rating     Int?
  takeaway   String?                           // NEW: one-line takeaway
  notes      String    @default("")
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  logs ReadingLog[]                            // NEW relation

  @@map("reading_items")
}

model ReadingLog {
  id          String   @id @default(cuid())
  readingItemId String
  date        DateTime @db.Date
  minutesRead Int?
  pagesRead   Int?
  note        String?
  createdAt   DateTime @default(now())

  readingItem ReadingItem @relation(fields: [readingItemId], references: [id], onDelete: Cascade)

  @@map("reading_logs")
}
```

**Add Budget models:**
```prisma
model BudgetAllocation {
  id            String   @id @default(cuid())
  category      String
  amount        Float
  percentage    Float?
  period        String   @default("monthly")
  effectiveFrom DateTime @db.Date
  createdAt     DateTime @default(now())

  @@map("budget_allocations")
}

model BudgetScore {
  id        String   @id @default(cuid())
  date      DateTime @unique @db.Date
  score     Int
  breakdown Json     @default("{}")
  createdAt DateTime @default(now())

  @@map("budget_scores")
}
```

**Add RecurringTransaction:**
```prisma
model RecurringTransaction {
  id        String   @id @default(cuid())
  name      String
  amount    Float
  currency  String   @default("USD")
  category  String?
  frequency String   @default("monthly")      // weekly, monthly, yearly
  nextDate  DateTime? @db.Date
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  @@map("recurring_transactions")
}
```

**Add fields to Contact:**
```prisma
model Contact {
  id               String    @id @default(cuid())
  name             String
  context          String    @default("")
  email            String?                        // NEW
  phone            String?                        // NEW
  company          String?                        // NEW
  relationship     String?                        // NEW
  birthday         DateTime? @db.Date             // NEW
  importance       String?                        // NEW: high, medium, low
  contactFrequency String?                        // NEW: weekly, biweekly, monthly, quarterly
  nextReachOut     DateTime? @db.Date             // NEW
  lastInteraction  DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  interactions ContactInteraction[]

  @@map("contacts")
}
```

**Step 1:** Add all new models and fields
**Step 2:** Run `npx prisma migrate dev --name reading_budget_contacts_upgrade`
**Step 3:** Commit

---

### Task 4: Update Sidebar with Budget + Calendar

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx`

**Add to MODULES array** (insert after Finances):
```typescript
{ label: "Budget", href: "/dashboard/budget", icon: "算" },
```
**Add after Email:**
```typescript
{ label: "Calendar", href: "/dashboard/calendar", icon: "暦" },
```

**Step 1:** Edit MODULES array
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 1: Habits Upgrade (HabitMaker Replacement)

### Task 5: Upgrade Habits API

**Files:**
- Modify: `src/app/api/habits/route.ts` — add type/color/icon to POST, update streak logic for types
- Modify: `src/app/api/habits/[id]/route.ts` — expand PATCH fields
- Modify: `src/app/api/habits/[id]/log/route.ts` — support value, skipped, note fields

**Changes:**
- GET: include new fields, calculate streaks per habit type:
  - daily/timed: consecutive completed days
  - frequency: consecutive periods meeting threshold
  - negative: consecutive days with NO log (no slip)
  - quantity: consecutive days where value >= targetValue
- POST: accept type, targetValue, frequencyPerPeriod, period, color, icon, sortOrder
- PATCH: accept all new fields + archived flag
- Log POST: accept value (Float), skipped (Boolean), note (String)

**Step 1:** Update all three files
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 6: Upgrade Habits page with 30-day dot grid

**Files:**
- Modify: `src/app/(dashboard)/dashboard/habits/page.tsx` — complete rewrite

**Replace the 7-day grid with:**

1. **Weekly completion bar** at top: `X% this week` progress bar
2. **30-day dot grid:** Each habit = row, columns = last 30 days (horizontally scrollable, today on right)
   - Day headers: abbreviated letter + date number
   - Dot states by type:
     - daily/frequency/timed: empty circle → filled vermillion → slashed (skipped)
     - quantity: progress ring (SVG) showing value/targetValue
     - negative: filled (good) by default → red on slip
   - Tap: toggle via `/api/habits/[id]/log` with optimistic UI
   - Quantity: tap opens mini number input popover
3. **Streak display:** Fire emoji + count per habit
4. **Perfect day glow** when all habits done today
5. **Add Habit form upgrade:** type picker (5 chips), target value, frequency fields, color picker (5 presets), icon emoji input
6. **Archive** instead of hard delete

**Keep the me.io design system:** parchment cards, vermillion accents, font-mono labels, Framer Motion animations

**Step 1:** Rewrite the page
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 2: Journal Upgrade

### Task 7: Create Journal API routes for new model

**Files:**
- Modify: `src/app/api/journal/route.ts` — query JournalEntry with type/search/days filters
- Modify: `src/app/api/journal/today/route.ts` — adapt to work with JournalEntry model
- Create: `src/app/api/journal/[id]/route.ts` — PATCH/DELETE individual entries
- Create: `src/app/api/journal/prompt/route.ts` — contextual prompt generator

**Prompt generator logic:**
- Check today's health snapshot, completed goals, habit logs
- Build contextual question from data
- Fallback to random from 10 generic prompts

**Step 1:** Update/create all route files
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 8: Upgrade Journal page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/journal/page.tsx` — add entry types, capture bar, filters

**Upgrade from single-textarea to multi-mode journal:**

1. **Today's prompt card:** If no reflection today → show contextual prompt + textarea + Save. If done → summary card
2. **Quick capture bar:** Always-visible input for instant thought capture (type: "capture")
3. **Filter tabs:** All | Reflections | Captures | Notes
4. **Search bar** with debounced search
5. **Entry feed:** Grouped by date, type badges (vermillion=reflection, gold=capture, sumi=note), expandable with inline edit
6. **New Note button:** Opens form for structured notes with title + tags

**Keep:** Auto-save pattern, Framer Motion, parchment styling, reflection prompts

**Step 1:** Rewrite the page
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 3: Budget Module (New)

### Task 9: Create Budget API routes

**Files:**
- Create: `src/app/api/budget/route.ts` — GET overview (allocations + spending from transactions), POST allocations
- Create: `src/app/api/budget/score/route.ts` — GET latest score, POST compute score

**Budget overview GET logic:**
- Query BudgetAllocation (latest per category)
- Query Transaction (current month expenses)
- Compute per-category spent vs allocated
- Compute runway (days left × daily allowable)

**Score POST logic:**
- Allocation adherence (40pts)
- Savings rate vs 20% target (30pts)
- Tracking consistency (30pts)

**Step 1:** Create both route files
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 10: Create Budget page

**Files:**
- Create: `src/app/(dashboard)/dashboard/budget/page.tsx`

**Sections:**
1. Health score ring (SVG circle, vermillion/gold/red)
2. Runway card ("X days left · $Y/day")
3. Allocation bars (horizontal, color-coded)
4. Setup view (income input + category sliders)
5. Insight cards (over-budget warnings, savings praise)

**Step 1:** Create the page
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 4: Reading Upgrade

### Task 11: Upgrade Reading API + page

**Files:**
- Modify: `src/app/api/reading/route.ts` — include new fields (author, format, progress, dates)
- Create: `src/app/api/reading/[id]/log/route.ts` — POST reading session logs
- Modify: `src/app/(dashboard)/dashboard/reading/page.tsx` — add heatmap, progress tracking, reading logs

**Page additions:**
1. Progress bar on currently-reading items
2. GitHub-style reading heatmap (90 days, from ReadingLog data)
3. Reading streak + days-this-month stats
4. "Update Progress" slider
5. Author, format badge, cover image support
6. "Finished" flow → rating + takeaway prompt

**Step 1:** Update API and page
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 5: Module Upgrades

### Task 12: Upgrade Health page with tabs

**Files:**
- Modify: `src/app/(dashboard)/dashboard/health/page.tsx` — restructure with tabs

**Tab layout:** Overview | Sleep | Nutrition | Body

- Overview: keep existing metrics + mini charts as-is
- Sleep: weekly bar chart for sleep hours, quality tracking, "Log Sleep" button
- Nutrition: macro progress bars (protein/carbs/fat), calorie trend, "Connect MacroFactor" placeholder
- Body: weight/BMI/body fat trends, "Connect RingConn" placeholder

**Note:** HealthSnapshot already stores all this data in the `data` JSON field. No schema change needed — just display it in tabs.

**Step 1:** Rewrite with tabbed layout
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 13: Upgrade Finances page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/finances/page.tsx` — add subscriptions, quick-add

**Additions:**
1. Quick-add FAB → modal for manual transaction entry
2. Subscriptions section from RecurringTransaction model
3. "Add Subscription" modal

**Keep:** All existing functionality (snapshots, transactions, category breakdown, sync)

**Step 1:** Update the page
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 14: Upgrade People page with CRM features

**Files:**
- Modify: `src/app/(dashboard)/dashboard/people/page.tsx` — add birthday alerts, overdue dashboard, expanded fields
- Modify: `src/app/api/contacts/route.ts` — support new fields in POST/PATCH

**Additions:**
1. Birthday alert banner (within 7 days)
2. Overdue reachouts section (vermillion styling)
3. Upcoming reachouts section
4. Expanded add/edit form: email, phone, company, relationship, birthday, importance, contact frequency
5. Auto-compute nextReachOut on interaction log

**Step 1:** Update API and page
**Step 2:** Build and verify
**Step 3:** Commit

---

### Task 15: Create Calendar/Agenda page

**Files:**
- Create: `src/app/(dashboard)/dashboard/calendar/page.tsx`
- Create: `src/app/api/calendar/route.ts` — GET today's agenda from multiple sources

**Agenda view:**
- "Connect Google Calendar" placeholder banner
- Timeline built from: Goals with deadlines today, Habit completions, Health snapshot
- Date navigation (prev/next day)
- Simple vertical timeline with colored dots

**Step 1:** Create API and page
**Step 2:** Build and verify
**Step 3:** Commit

---

## Phase 6: Polish

### Task 16: Final build verification + cleanup

**Step 1:** Full build: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -30`
**Step 2:** Verify all routes render
**Step 3:** Final commit

---

## Implementation Order Summary

| Phase | Tasks | What |
|-------|-------|------|
| 0 | 1-4 | Schema migrations + sidebar update |
| 1 | 5-6 | Habits upgrade (HabitMaker replacement) |
| 2 | 7-8 | Journal upgrade (multi-mode) |
| 3 | 9-10 | Budget module (new) |
| 4 | 11 | Reading upgrade (heatmap + logs) |
| 5 | 12-15 | Health tabs, Finances subs, People CRM, Calendar |
| 6 | 16 | Final verification |

**Total: 16 tasks across 7 phases.**
