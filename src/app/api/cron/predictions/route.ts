import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/kemi/telegram";
import { todayJamaica } from "@/lib/kemi/utils";

const anthropic = new Anthropic();

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs: string[] = [];
  const today = todayJamaica();
  const threeDaysOut = new Date(today);
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Gather context for proactive suggestions
    const [overdueTasks, upcomingTasks, habits, budgetScore] =
      await Promise.all([
        // Overdue tasks
        prisma.kemiTask.findMany({
          where: {
            status: { in: ["open", "in_progress"] },
            dueDate: { lt: today },
          },
          select: { title: true, dueDate: true, priority: true },
          take: 10,
        }),
        // Upcoming deadlines (next 3 days)
        prisma.kemiTask.findMany({
          where: {
            status: { in: ["open", "in_progress"] },
            dueDate: { gte: today, lte: threeDaysOut },
          },
          select: { title: true, dueDate: true, priority: true },
          take: 10,
        }),
        // Today's habits
        prisma.habit.findMany({
          where: { archived: false },
          include: {
            logs: { where: { date: today }, take: 1 },
          },
        }),
        // Latest budget score
        prisma.budgetScore.findFirst({
          orderBy: { date: "desc" },
          select: { score: true, date: true },
        }),
      ]);

    const incompleteHabits = habits.filter(
      (h) => h.logs.length === 0 || !h.logs[0].completed
    );

    // Only proceed if there are actionable items
    const hasItems =
      overdueTasks.length > 0 ||
      upcomingTasks.length > 0 ||
      incompleteHabits.length > 0 ||
      (budgetScore && budgetScore.score < 70);

    if (!hasItems) {
      jobs.push("predictions_skipped_no_items");
      return NextResponse.json({ ok: true, jobs });
    }

    // Build context
    const contextParts: string[] = [];

    if (overdueTasks.length > 0) {
      contextParts.push(
        `Overdue tasks:\n${overdueTasks.map((t) => `- "${t.title}" (due ${t.dueDate?.toISOString().split("T")[0]}, priority: ${t.priority})`).join("\n")}`
      );
    }

    if (upcomingTasks.length > 0) {
      contextParts.push(
        `Upcoming deadlines (next 3 days):\n${upcomingTasks.map((t) => `- "${t.title}" (due ${t.dueDate?.toISOString().split("T")[0]}, priority: ${t.priority})`).join("\n")}`
      );
    }

    if (incompleteHabits.length > 0) {
      contextParts.push(
        `Habits not done today:\n${incompleteHabits.map((h) => `- ${h.title}`).join("\n")}`
      );
    }

    if (budgetScore && budgetScore.score < 70) {
      contextParts.push(
        `Budget score: ${budgetScore.score}/100 (needs attention)`
      );
    }

    const context = contextParts.join("\n\n");

    // Generate suggestions via Haiku
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system:
        "You are Kemi, Mike's proactive AI assistant. Generate 1-3 brief, actionable suggestions based on his current status. Be direct, specific, and helpful. No fluff. Use a warm Jamaican-professional tone. Format as bullet points.",
      messages: [
        {
          role: "user",
          content: `Current status:\n\n${context}\n\nGive me 1-3 proactive suggestions.`,
        },
      ],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );

    if (textBlock?.text) {
      await sendTelegramMessage(
        `*Proactive Suggestions*\n\n${textBlock.text}`
      );
    }

    jobs.push("predictions");
  } catch (err) {
    console.error("[cron/predictions] error:", err);
    jobs.push("predictions_error");
  }

  return NextResponse.json({ ok: true, jobs });
}
