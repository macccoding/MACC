import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [goals, habits, captures, financials] = await Promise.all([
    prisma.goal.findMany({ where: { status: "active" }, take: 5 }),
    prisma.habit.findMany({
      include: { logs: { where: { date: today }, take: 1 } },
    }),
    prisma.capture.count({ where: { processed: false } }),
    prisma.financialSnapshot.findFirst({ orderBy: { date: "desc" } }),
  ]);

  const habitsCompleted = habits.filter((h) => h.logs.length > 0).length;

  return NextResponse.json({
    goals: { active: goals.length, titles: goals.slice(0, 3).map((g) => g.title) },
    habits: { total: habits.length, completedToday: habitsCompleted },
    captures: { unprocessed: captures },
    finances: financials?.data || null,
  });
}
