# Habits + Health Auto Export Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign habits page to show 7-day compact view (expandable to full history), seed health-linked habits that auto-populate from Health Auto Export data, and fix the existing workout habit type.

**Architecture:** Add `healthKey` field to Habit model to link habits to HealthSnapshot fields. On health ingest, auto-create HabitLogs for health-linked habits. Frontend shows 7-day compact grid by default, expandable to 30 days.

**Tech Stack:** Next.js 16, Prisma 7, Neon PostgreSQL, Framer Motion

---

### Task 1: Add `healthKey` to Habit schema + migrate

**Files:**
- Modify: `prisma/schema.prisma:111-130`

**Step 1: Add healthKey field to Habit model**

In `prisma/schema.prisma`, add `healthKey` to the Habit model:

```prisma
model Habit {
  id               String   @id @default(cuid())
  title            String
  type             String   @default("daily")
  targetValue      Float    @default(1)
  frequencyPerPeriod Int    @default(1)
  period           String   @default("day")
  color            String   @default("#e04835")
  icon             String?
  healthKey        String?                      // ← NEW: links to HealthSnapshot field
  sortOrder        Int      @default(0)
  archived         Boolean  @default(false)
  frequency        String   @default("daily")
  streakProtection Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  logs HabitLog[]

  @@map("habits")
}
```

`healthKey` values: `"sleep"`, `"steps"`, `"calories"`, `"exerciseMinutes"`, `"standHours"` — matches HealthSnapshot fields.

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add-habit-health-key
```

**Step 3: Commit**

```bash
git add prisma/
git commit -m "schema: add healthKey to Habit for health-linked habits"
```

---

### Task 2: Seed health-linked habits + fix workout habit

**Files:**
- Create: `scripts/seed-health-habits.ts`

**Step 1: Write seed script**

```typescript
// scripts/seed-health-habits.ts
import { prisma } from "../src/lib/prisma";

const HEALTH_HABITS = [
  {
    title: "Sleep 8 Hours",
    type: "quantity",
    targetValue: 8,
    healthKey: "sleep",
    color: "#3B82F6",
    icon: "😴",
    sortOrder: 1,
  },
  {
    title: "10K Steps",
    type: "quantity",
    targetValue: 10000,
    healthKey: "steps",
    color: "#22C55E",
    icon: "🚶",
    sortOrder: 2,
  },
  {
    title: "30min Exercise",
    type: "quantity",
    targetValue: 30,
    healthKey: "exerciseMinutes",
    color: "#D03A2C",
    icon: "💪",
    sortOrder: 3,
  },
  {
    title: "500 Active Calories",
    type: "quantity",
    targetValue: 500,
    healthKey: "calories",
    color: "#C9A84C",
    icon: "🔥",
    sortOrder: 4,
  },
  {
    title: "12 Stand Hours",
    type: "quantity",
    targetValue: 12,
    healthKey: "standHours",
    color: "#A855F7",
    icon: "🧍",
    sortOrder: 5,
  },
];

async function main() {
  // Fix existing workout habit: change from negative to daily
  const workout = await prisma.habit.findFirst({
    where: { title: { contains: "workout" } },
  });
  if (workout) {
    await prisma.habit.update({
      where: { id: workout.id },
      data: { type: "daily", sortOrder: 0 },
    });
    console.log(`Fixed workout habit → daily type`);
  }

  // Seed health habits (skip if already exist by healthKey)
  for (const h of HEALTH_HABITS) {
    const exists = await prisma.habit.findFirst({
      where: { healthKey: h.healthKey },
    });
    if (exists) {
      console.log(`Skipping ${h.title} — already exists`);
      continue;
    }
    await prisma.habit.create({ data: h });
    console.log(`Created: ${h.title}`);
  }

  await prisma.$disconnect();
}

main();
```

**Step 2: Run seed script**

```bash
export $(grep -v '^#' .env | xargs) && npx tsx scripts/seed-health-habits.ts
```

Expected: 5 health habits created, workout habit fixed.

**Step 3: Commit**

```bash
git add scripts/seed-health-habits.ts
git commit -m "feat: seed health-linked habits, fix workout habit type"
```

---

### Task 3: Auto-populate health habit logs on ingest

**Files:**
- Modify: `src/app/api/health/ingest/route.ts`

**Step 1: After upserting HealthSnapshot, auto-create HabitLogs**

After the `prisma.healthSnapshot.upsert(...)` call, add:

```typescript
// Auto-populate health-linked habit logs
try {
  const healthHabits = await prisma.habit.findMany({
    where: { healthKey: { not: null }, archived: false },
  });

  for (const habit of healthHabits) {
    const value = getHealthValue(habit.healthKey!, snapshot, extraData);
    if (value === null) continue;

    await prisma.habitLog.upsert({
      where: {
        habitId_date: { habitId: habit.id, date: normalized },
      },
      create: {
        habitId: habit.id,
        date: normalized,
        completed: value >= habit.targetValue,
        value,
      },
      update: {
        completed: value >= habit.targetValue,
        value,
      },
    });
  }
} catch (err) {
  console.error("[health/ingest] Auto-populate habits error:", err);
  // Don't fail the ingest if habit auto-populate fails
}
```

Add helper function at top of file:

```typescript
function getHealthValue(
  healthKey: string,
  snapshot: { steps: number | null; calories: number | null; heartRate: number | null; sleep: number | null },
  extraData: Record<string, unknown>
): number | null {
  switch (healthKey) {
    case "steps": return snapshot.steps;
    case "calories": return snapshot.calories;
    case "sleep": return snapshot.sleep;
    case "exerciseMinutes": return typeof extraData.exerciseMinutes === "number" ? extraData.exerciseMinutes : null;
    case "standHours": return typeof extraData.standHours === "number" ? extraData.standHours : null;
    default: return null;
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/health/ingest/route.ts
git commit -m "feat: auto-populate health habit logs on ingest"
```

---

### Task 4: Redesign habits page — 7-day compact view

**Files:**
- Modify: `src/app/(dashboard)/dashboard/habits/page.tsx`

**Step 1: Replace `getLast30Days` with configurable day range**

Replace the `getLast30Days` function:

```typescript
function getDays(count: number): { dateStr: string; dayLetter: string; dayNum: number }[] {
  const days: { dateStr: string; dayLetter: string; dayNum: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const letters = ["S", "M", "T", "W", "T", "F", "S"];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: fmtDate(d),
      dayLetter: letters[d.getDay()],
      dayNum: d.getDate(),
    });
  }
  return days;
}
```

**Step 2: Add expanded state + toggle**

Add state:
```typescript
const [expanded, setExpanded] = useState(false);
```

Replace:
```typescript
const last30Days = getLast30Days();
```
With:
```typescript
const days = getDays(expanded ? 30 : 7);
```

**Step 3: Add expand/collapse button in the grid header**

After the "HABIT" column header `<th>`, add a small toggle button. In the grid section, add an expand button near the grid:

```tsx
<button
  onClick={() => setExpanded(!expanded)}
  className="ml-2 text-sumi-gray-light hover:text-ink-black transition-colors duration-200"
  style={{ fontSize: "var(--text-micro)" }}
  title={expanded ? "Show 7 days" : "Show 30 days"}
>
  {expanded ? "◀" : "▶"}
</button>
```

**Step 4: Update all references from `last30Days` to `days`**

Search-replace `last30Days` → `days` in the JSX (header columns + dot cells).

**Step 5: Mark health-linked habits visually**

For habits with a `healthKey`, show a small health indicator (e.g., heart icon or "auto" badge) next to the title to distinguish auto-populated habits from manual ones.

Add to Habit type:
```typescript
type Habit = {
  // ... existing fields
  healthKey: string | null;
};
```

In the habit name cell, after the streak badge:
```tsx
{habit.healthKey && (
  <span
    className="text-sumi-gray-light/60 font-mono shrink-0"
    style={{ fontSize: "9px" }}
  >
    AUTO
  </span>
)}
```

**Step 6: Commit**

```bash
git add src/app/(dashboard)/dashboard/habits/page.tsx
git commit -m "feat: habits 7-day compact view with expand toggle + health badge"
```

---

### Task 5: Update habits API to return healthKey

**Files:**
- Modify: `src/app/api/habits/route.ts`

**Step 1: Add healthKey to the select/response**

In the GET handler's `prisma.habit.findMany`, ensure `healthKey` is included in the response. It should already be returned since Prisma returns all scalar fields by default, but verify the response shape includes it.

**Step 2: Add healthKey to POST/PATCH handlers**

In POST (create habit), accept optional `healthKey` in body.
In PATCH, allow updating `healthKey`.

**Step 3: Commit**

```bash
git add src/app/api/habits/route.ts
git commit -m "feat: habits API returns and accepts healthKey"
```

---

### Task 6: Deploy + test end-to-end

**Step 1: Build check**

```bash
npx tsc --noEmit
```

**Step 2: Deploy**

```bash
vercel --prod
```

**Step 3: Test**

1. Visit `/dashboard/habits` — should see 6 habits (workout + 5 health), 7-day view
2. Click expand → 30-day view
3. Trigger Health Auto Export → health habits auto-populate with values
4. Click a dot on workout habit → toggles gray → green → skipped → gray

---

## Summary

| Task | Description | Key Change |
|------|------------|------------|
| 1 | Schema migration | Add `healthKey` to Habit |
| 2 | Seed script | Create 5 health habits, fix workout type |
| 3 | Auto-populate | Health ingest creates HabitLogs |
| 4 | Frontend redesign | 7-day compact view, expandable |
| 5 | API update | Return/accept healthKey |
| 6 | Deploy + test | End-to-end verification |
