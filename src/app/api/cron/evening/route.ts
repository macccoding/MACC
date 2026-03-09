import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/kemi/telegram";
import { todayJamaica } from "@/lib/kemi/utils";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs: string[] = [];
  const today = todayJamaica();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Evening digest — today's completed tasks, actions, spending
  try {
    const [completedTasks, actions, transactions] = await Promise.all([
      prisma.kemiTask.findMany({
        where: {
          completedAt: { gte: today, lt: tomorrow },
        },
        select: { title: true },
      }),
      prisma.actionLog.findMany({
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
        select: { actionType: true, description: true },
      }),
      prisma.transaction.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
        },
        select: { name: true, amount: true, category: true },
      }),
    ]);

    const totalSpent = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    const parts: string[] = [];

    if (completedTasks.length > 0) {
      parts.push(
        `*Tasks Completed* (${completedTasks.length})\n${completedTasks.map((t) => `\u2705 ${t.title}`).join("\n")}`
      );
    } else {
      parts.push("No tasks completed today.");
    }

    if (actions.length > 0) {
      parts.push(`*Actions Logged:* ${actions.length}`);
    }

    if (transactions.length > 0) {
      parts.push(
        `*Spending:* $${totalSpent.toFixed(2)} across ${transactions.length} transactions`
      );
    }

    await sendTelegramMessage(`*Evening Digest*\n\n${parts.join("\n\n")}`);
    jobs.push("evening_digest");
  } catch (err) {
    console.error("[cron/evening] digest error:", err);
  }

  // 2. Budget score — compute and store
  try {
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      select: { amount: true, category: true },
    });

    const allocations = await prisma.budgetAllocation.findMany({
      orderBy: { effectiveFrom: "desc" },
    });

    // Group spending by category
    const spendByCategory: Record<string, number> = {};
    for (const t of transactions) {
      const cat = t.category || "uncategorized";
      spendByCategory[cat] = (spendByCategory[cat] || 0) + Math.abs(t.amount);
    }

    // Simple score: 100 minus penalty for overspending categories
    // Daily budget = monthly allocation / 30
    let score = 100;
    const breakdown: Record<string, { spent: number; dailyBudget: number }> = {};

    for (const alloc of allocations) {
      const dailyBudget = alloc.amount / 30;
      const spent = spendByCategory[alloc.category] || 0;
      breakdown[alloc.category] = { spent, dailyBudget };
      if (spent > dailyBudget && dailyBudget > 0) {
        const overPercent = ((spent - dailyBudget) / dailyBudget) * 100;
        score -= Math.min(overPercent * 0.5, 30); // max -30 per category
      }
    }

    score = Math.max(0, Math.round(score));

    await prisma.budgetScore.upsert({
      where: { date: today },
      create: { date: today, score, breakdown },
      update: { score, breakdown },
    });

    jobs.push("budget_score");
  } catch (err) {
    console.error("[cron/evening] budget score error:", err);
  }

  // 3. Habit check — nudge incomplete habits
  try {
    const habits = await prisma.habit.findMany({
      where: { archived: false },
      include: {
        logs: {
          where: { date: today },
          take: 1,
        },
      },
    });

    const incomplete = habits.filter(
      (h) => h.logs.length === 0 || !h.logs[0].completed
    );

    if (incomplete.length > 0) {
      const lines = incomplete.map((h) => `\u25fb\ufe0f ${h.title}`);
      await sendTelegramMessage(
        `*Habits Not Done Yet* (${incomplete.length}/${habits.length})\n\n${lines.join("\n")}\n\nStill time to knock these out!`
      );
    }
    jobs.push("habit_check");
  } catch (err) {
    console.error("[cron/evening] habit check error:", err);
  }

  return NextResponse.json({ ok: true, jobs });
}
