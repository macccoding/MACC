import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const VALID_TYPES = ["daily", "frequency", "quantity", "negative", "timed"];

// --------------- streak helpers ---------------

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** daily / timed: consecutive days with completed=true */
function streakDaily(
  logs: { date: Date; completed: boolean }[]
): number {
  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => fmtDate(new Date(l.date)))
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (completedDates.has(fmtDate(d))) {
      streak++;
    } else if (i === 0) {
      continue; // today not done yet — check yesterday
    } else {
      break;
    }
  }
  return streak;
}

/** quantity: consecutive days where value >= targetValue */
function streakQuantity(
  logs: { date: Date; completed: boolean; value: number }[],
  targetValue: number
): number {
  const qualifyingDates = new Set(
    logs
      .filter((l) => l.value >= targetValue)
      .map((l) => fmtDate(new Date(l.date)))
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (qualifyingDates.has(fmtDate(d))) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/** negative: consecutive days with NO log (no slip = good) */
function streakNegative(
  logs: { date: Date }[]
): number {
  const loggedDates = new Set(
    logs.map((l) => fmtDate(new Date(l.date)))
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (!loggedDates.has(fmtDate(d))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** frequency: consecutive periods where log count >= frequencyPerPeriod */
function streakFrequency(
  logs: { date: Date; completed: boolean }[],
  frequencyPerPeriod: number,
  period: string
): number {
  const completedLogs = logs.filter((l) => l.completed);
  if (completedLogs.length === 0) return 0;

  // Group logs into period buckets
  const buckets = new Map<string, number>();
  for (const log of completedLogs) {
    const key = periodKey(new Date(log.date), period);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk backwards through periods
  for (let i = 0; i < 52; i++) {
    const ref = shiftPeriod(today, period, -i);
    const key = periodKey(ref, period);
    const count = buckets.get(key) || 0;

    if (count >= frequencyPerPeriod) {
      streak++;
    } else if (i === 0) {
      continue; // current period not met yet — check previous
    } else {
      break;
    }
  }
  return streak;
}

function periodKey(d: Date, period: string): string {
  if (period === "month") {
    return `${d.getFullYear()}-M${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (period === "week") {
    // ISO week: Monday-based
    const tmp = new Date(d);
    tmp.setHours(0, 0, 0, 0);
    const day = tmp.getDay() || 7; // Sunday=7
    tmp.setDate(tmp.getDate() + 4 - day); // Thursday of the week
    const yearStart = new Date(tmp.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return `${tmp.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  }
  // day
  return fmtDate(d);
}

function shiftPeriod(base: Date, period: string, offset: number): Date {
  const d = new Date(base);
  if (period === "month") {
    d.setMonth(d.getMonth() + offset);
  } else if (period === "week") {
    d.setDate(d.getDate() + offset * 7);
  } else {
    d.setDate(d.getDate() + offset);
  }
  return d;
}

// --------------- route handlers ---------------

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const showArchived =
    request.nextUrl.searchParams.get("archived") === "true";

  try {
    const habits = await prisma.habit.findMany({
      where: { archived: showArchived ? undefined : false },
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 60,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const habitsWithStreaks = habits.map((habit) => {
      let streak: number;

      switch (habit.type) {
        case "frequency":
          streak = streakFrequency(
            habit.logs,
            habit.frequencyPerPeriod,
            habit.period
          );
          break;
        case "quantity":
          streak = streakQuantity(habit.logs, habit.targetValue);
          break;
        case "negative":
          streak = streakNegative(habit.logs);
          break;
        case "daily":
        case "timed":
        default:
          streak = streakDaily(habit.logs);
          break;
      }

      return { ...habit, streak };
    });

    return NextResponse.json(habitsWithStreaks, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("[habits] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, type, targetValue, frequencyPerPeriod, period, color, icon, sortOrder, healthKey } = body as {
    title?: string;
    type?: string;
    targetValue?: number;
    frequencyPerPeriod?: number;
    period?: string;
    color?: string;
    icon?: string;
    sortOrder?: number;
    healthKey?: string;
  };

  // Validate title
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  // Validate type if provided
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const habit = await prisma.habit.create({
      data: {
        title: title.trim(),
        ...(type ? { type } : {}),
        ...(typeof targetValue === "number" ? { targetValue } : {}),
        ...(typeof frequencyPerPeriod === "number" ? { frequencyPerPeriod } : {}),
        ...(period ? { period } : {}),
        ...(color ? { color } : {}),
        ...(icon ? { icon } : {}),
        ...(typeof sortOrder === "number" ? { sortOrder } : {}),
        ...(healthKey ? { healthKey } : {}),
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (err) {
    console.error("[habits] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
