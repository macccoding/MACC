import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// --------------- helpers ---------------

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// --------------- route handlers ---------------

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const weekStart = getWeekStart(new Date());

    const insights = await prisma.insight.findMany({
      where: { weekOf: weekStart, dismissed: false },
      orderBy: { score: "desc" },
      take: 10,
    });

    return NextResponse.json(insights);
  } catch (err) {
    console.error("[insights] GET error:", err);
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
    const now = new Date();
    const weekStart = getWeekStart(now);

    // 30-day lookback
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 7-day and 14-day boundaries for trend comparison
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Fetch 30 days of data in parallel
    const [moodEntries, focusSessions, healthSnapshots, tasks] =
      await Promise.all([
        prisma.moodEntry.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.focusSession.findMany({
          where: {
            status: "completed",
            startedAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.healthSnapshot.findMany({
          where: { date: { gte: thirtyDaysAgo } },
        }),
        prisma.kemiTask.findMany({
          where: { updatedAt: { gte: thirtyDaysAgo } },
        }),
      ]);

    const insights: {
      type: string;
      title: string;
      body: string;
      modules: string[];
      score: number;
      weekOf: Date;
    }[] = [];

    // --- Insight 1: Mood trend (last 7 vs previous 7 days) ---
    const recentMoods = moodEntries
      .filter((m) => m.createdAt >= sevenDaysAgo)
      .map((m) => m.mood);
    const prevMoods = moodEntries
      .filter(
        (m) => m.createdAt >= fourteenDaysAgo && m.createdAt < sevenDaysAgo
      )
      .map((m) => m.mood);

    const recentAvg = avg(recentMoods);
    const prevAvg = avg(prevMoods);

    if (recentAvg !== null && prevAvg !== null) {
      const delta = Math.round((recentAvg - prevAvg) * 10) / 10;
      if (Math.abs(delta) >= 0.3) {
        const trending = delta > 0 ? "up" : "down";
        insights.push({
          type: "trend",
          title: `Mood trending ${trending}`,
          body:
            trending === "up"
              ? `Your average mood rose from ${prevAvg} to ${recentAvg} over the last 7 days. Keep doing what's working.`
              : `Your average mood dropped from ${prevAvg} to ${recentAvg} over the last 7 days. Consider what changed.`,
          modules: ["mood"],
          score: Math.min(Math.abs(delta) / 2, 1),
          weekOf: weekStart,
        });
      }
    }

    // --- Insight 2: Focus productivity ---
    const totalFocusMinutes = focusSessions.reduce(
      (sum, s) => sum + (s.actualMinutes ?? s.durationMinutes),
      0
    );
    const focusWeeks = Math.max(
      1,
      Math.ceil(
        (now.getTime() - thirtyDaysAgo.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
    );
    const avgWeeklyFocus = Math.round(totalFocusMinutes / focusWeeks);

    if (focusSessions.length > 0) {
      const hours = Math.round(avgWeeklyFocus / 60 * 10) / 10;
      insights.push({
        type: "stat",
        title: "Focus summary",
        body: `You average ${hours} hours of focused work per week (${avgWeeklyFocus} min across ${focusSessions.length} sessions in 30 days).`,
        modules: ["focus"],
        score: 0.5,
        weekOf: weekStart,
      });
    }

    // --- Insight 3: Exercise/mood correlation ---
    const activeDays = new Set(
      healthSnapshots
        .filter((h) => h.steps && h.steps >= 5000)
        .map((h) => new Date(h.date).toISOString().slice(0, 10))
    );

    if (activeDays.size > 0 && moodEntries.length > 0) {
      const moodOnActiveDays = moodEntries
        .filter((m) =>
          activeDays.has(m.createdAt.toISOString().slice(0, 10))
        )
        .map((m) => m.mood);
      const moodOnRestDays = moodEntries
        .filter(
          (m) =>
            !activeDays.has(m.createdAt.toISOString().slice(0, 10))
        )
        .map((m) => m.mood);

      const activeMoodAvg = avg(moodOnActiveDays);
      const restMoodAvg = avg(moodOnRestDays);

      if (activeMoodAvg !== null && restMoodAvg !== null) {
        const diff = Math.round((activeMoodAvg - restMoodAvg) * 10) / 10;
        if (diff > 0) {
          insights.push({
            type: "correlation",
            title: "Exercise boosts your mood",
            body: `On active days your mood averages ${activeMoodAvg} vs ${restMoodAvg} on rest days (+${diff}). Movement helps.`,
            modules: ["health", "mood"],
            score: Math.min(diff / 2, 1),
            weekOf: weekStart,
          });
        }
      }
    }

    // --- Insight 4: Task completion rate ---
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const totalTasks = tasks.length;

    if (totalTasks > 0) {
      const rate = Math.round((completedTasks / totalTasks) * 100);
      insights.push({
        type: "stat",
        title: "Task completion rate",
        body:
          rate >= 70
            ? `You completed ${completedTasks} of ${totalTasks} tasks (${rate}%) in the last 30 days. Strong execution.`
            : `You completed ${completedTasks} of ${totalTasks} tasks (${rate}%) in the last 30 days. Consider trimming your backlog or breaking tasks smaller.`,
        modules: ["tasks"],
        score: rate >= 70 ? 0.4 : 0.7,
        weekOf: weekStart,
      });
    }

    // Delete old insights for this week, insert new ones
    await prisma.$transaction([
      prisma.insight.deleteMany({ where: { weekOf: weekStart } }),
      ...insights.map((insight) => prisma.insight.create({ data: insight })),
    ]);

    return NextResponse.json(insights);
  } catch (err) {
    console.error("[insights] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
