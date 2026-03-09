import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// --------------- helpers ---------------

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? 6 : day - 1; // shift so Monday = 0
  d.setDate(d.getDate() - diff);
  return d;
}

// --------------- route handlers ---------------

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const weekStart = getWeekStart(new Date());

    const review = await prisma.weeklyReview.findUnique({
      where: { weekOf: weekStart },
    });

    return NextResponse.json(review);
  } catch (err) {
    console.error("[weekly-review] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Fetch all data for the week in parallel
    const [tasks, habitLogs, moodEntries, focusSessions, healthSnapshots, transactions] =
      await Promise.all([
        prisma.kemiTask.findMany({
          where: { updatedAt: { gte: weekStart, lt: weekEnd } },
        }),
        prisma.habitLog.findMany({
          where: { date: { gte: weekStart, lt: weekEnd } },
        }),
        prisma.moodEntry.findMany({
          where: { createdAt: { gte: weekStart, lt: weekEnd } },
        }),
        prisma.focusSession.findMany({
          where: {
            status: "completed",
            startedAt: { gte: weekStart, lt: weekEnd },
          },
        }),
        prisma.healthSnapshot.findMany({
          where: { date: { gte: weekStart, lt: weekEnd } },
        }),
        prisma.transaction.findMany({
          where: { date: { gte: weekStart, lt: weekEnd } },
        }),
      ]);

    // Compute stats
    const tasksCompleted = tasks.filter((t) => t.status === "done").length;
    const tasksCreated = tasks.filter(
      (t) => t.createdAt >= weekStart && t.createdAt < weekEnd
    ).length;
    const habitsLogged = habitLogs.filter((l) => l.completed).length;

    const avgMood =
      moodEntries.length > 0
        ? Math.round(
            (moodEntries.reduce((sum, m) => sum + m.mood, 0) /
              moodEntries.length) *
              10
          ) / 10
        : null;
    const avgEnergy =
      moodEntries.length > 0
        ? Math.round(
            (moodEntries.reduce((sum, m) => sum + m.energy, 0) /
              moodEntries.length) *
              10
          ) / 10
        : null;
    const moodCheckins = moodEntries.length;

    const focusMinutes = focusSessions.reduce(
      (sum, s) => sum + (s.actualMinutes ?? s.durationMinutes),
      0
    );
    const focusSessionCount = focusSessions.length;

    const workouts = healthSnapshots.filter(
      (h) => h.steps && h.steps >= 5000
    ).length;

    const totalSpent = Math.round(
      transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) * 100
    ) / 100;

    const stats = {
      tasksCompleted,
      tasksCreated,
      habitsLogged,
      avgMood,
      avgEnergy,
      moodCheckins,
      focusMinutes,
      focusSessions: focusSessionCount,
      workouts,
      totalSpent,
    };

    // Generate reflection prompts
    const aiPrompts: string[] = [];

    if (tasksCompleted > 0) {
      aiPrompts.push(
        `You completed ${tasksCompleted} task${tasksCompleted > 1 ? "s" : ""} this week. Which one felt most meaningful and why?`
      );
    } else {
      aiPrompts.push(
        "No tasks were completed this week. What got in the way, and what would help next week?"
      );
    }

    if (avgMood !== null) {
      aiPrompts.push(
        avgMood >= 4
          ? `Your average mood was ${avgMood}/5. What contributed most to feeling good this week?`
          : `Your average mood was ${avgMood}/5. What drained your energy, and what could you change?`
      );
    } else {
      aiPrompts.push(
        "You didn't log any mood entries this week. How are you actually feeling right now?"
      );
    }

    if (focusMinutes > 0) {
      aiPrompts.push(
        `You logged ${focusMinutes} minutes of focused work across ${focusSessionCount} session${focusSessionCount > 1 ? "s" : ""}. Was that enough deep work?`
      );
    } else {
      aiPrompts.push(
        "No focus sessions this week. What would help you carve out uninterrupted time?"
      );
    }

    if (habitsLogged > 0) {
      aiPrompts.push(
        `You logged ${habitsLogged} habit completion${habitsLogged > 1 ? "s" : ""}. Which habits are feeling automatic, and which still need effort?`
      );
    } else {
      aiPrompts.push(
        "No habits were logged this week. Are your current habits still the right ones?"
      );
    }

    aiPrompts.push(
      "What is one thing you want to do differently next week?"
    );

    // Upsert the review
    const review = await prisma.weeklyReview.upsert({
      where: { weekOf: weekStart },
      create: {
        weekOf: weekStart,
        stats,
        aiPrompts,
        status: "draft",
      },
      update: {
        stats,
        aiPrompts,
        status: "draft",
      },
    });

    return NextResponse.json(review);
  } catch (err) {
    console.error("[weekly-review] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
