import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/kemi/telegram";
import { startOfWeek } from "@/lib/kemi/utils";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs: string[] = [];
  const weekStart = startOfWeek();
  const now = new Date();
  const sections: string[] = [];

  // 1. Weekly project pulse — goals + completed tasks
  try {
    const [completedTasks, activeGoals] = await Promise.all([
      prisma.kemiTask.findMany({
        where: {
          completedAt: { gte: weekStart },
        },
        select: { title: true, category: true },
      }),
      prisma.goal.findMany({
        where: { status: "active" },
        select: { title: true },
      }),
    ]);

    const tasksByCategory: Record<string, string[]> = {};
    for (const t of completedTasks) {
      const cat = t.category || "General";
      if (!tasksByCategory[cat]) tasksByCategory[cat] = [];
      tasksByCategory[cat].push(t.title);
    }

    let projectPulse = `*Tasks Completed This Week:* ${completedTasks.length}`;
    if (completedTasks.length > 0) {
      const catLines = Object.entries(tasksByCategory)
        .map(
          ([cat, tasks]) =>
            `\n_${cat}_: ${tasks.map((t) => `\u2705 ${t}`).join(", ")}`
        )
        .join("");
      projectPulse += catLines;
    }
    if (activeGoals.length > 0) {
      projectPulse += `\n\n*Active Goals:* ${activeGoals.map((g) => g.title).join(", ")}`;
    }

    sections.push(projectPulse);
    jobs.push("project_pulse");
  } catch (err) {
    console.error("[cron/weekly] project pulse error:", err);
  }

  // 2. Weekly expense summary
  try {
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: weekStart } },
      select: { name: true, amount: true, category: true },
    });

    const totalSpent = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    const byCategory: Record<string, number> = {};
    for (const t of transactions) {
      const cat = t.category || "Uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.amount);
    }

    const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
    const catLines = sorted
      .slice(0, 8)
      .map(([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`)
      .join("\n");

    sections.push(
      `*Weekly Spending:* $${totalSpent.toFixed(2)} (${transactions.length} txns)\n${catLines}`
    );
    jobs.push("expense_summary");
  } catch (err) {
    console.error("[cron/weekly] expense summary error:", err);
  }

  // 3. Strategy review — active strategic goals
  try {
    const strategicGoals = await prisma.strategicGoal.findMany({
      where: { status: "active" },
      orderBy: { progress: "desc" },
    });

    if (strategicGoals.length > 0) {
      const lines = strategicGoals.map((g) => {
        const bar = progressBar(g.progress);
        return `${bar} ${g.title} (${Math.round(g.progress)}%)`;
      });
      sections.push(`*Strategic Goals*\n${lines.join("\n")}`);
    }
    jobs.push("strategy_review");
  } catch (err) {
    console.error("[cron/weekly] strategy review error:", err);
  }

  // Send combined review
  if (sections.length > 0) {
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    await sendTelegramMessage(
      `*Weekly Review \u2014 ${dayName}*\n\n${sections.join("\n\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n")}`
    );
  }

  return NextResponse.json({ ok: true, jobs });
}

function progressBar(pct: number): string {
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  return "\u2588".repeat(filled) + "\u2591".repeat(empty);
}
