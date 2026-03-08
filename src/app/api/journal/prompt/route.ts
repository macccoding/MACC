import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const GENERIC_PROMPTS = [
  "What's one thing you're grateful for today?",
  "What challenged you today and how did you handle it?",
  "What would you tell your future self about today?",
  "What's something you learned recently?",
  "If you could redo one thing today, what would it be?",
  "What's on your mind right now?",
  "Describe your day in three words.",
  "What's a small win you had today?",
  "What are you looking forward to tomorrow?",
  "How did you take care of yourself today?",
];

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    // Check today's health data
    const health = await prisma.healthSnapshot.findUnique({
      where: { date: todayDate },
    });

    if (health) {
      const parts: string[] = [];
      if (health.steps) parts.push(`${health.steps.toLocaleString()} steps`);
      if (health.sleep) parts.push(`${health.sleep}h sleep`);

      if (parts.length > 0) {
        return NextResponse.json({
          prompt: `You got ${parts.join(" and ")}. How's your body feeling?`,
        });
      }
    }

    // Check completed habits today
    const habitsCompleted = await prisma.habitLog.count({
      where: { date: todayDate, completed: true },
    });

    if (habitsCompleted > 0) {
      return NextResponse.json({
        prompt: `You completed ${habitsCompleted} habit${habitsCompleted === 1 ? "" : "s"} today. What kept you consistent?`,
      });
    }

    // Check active goals
    const activeGoals = await prisma.goal.count({
      where: { status: "active" },
    });

    if (activeGoals > 0) {
      return NextResponse.json({
        prompt: `You have ${activeGoals} active goal${activeGoals === 1 ? "" : "s"}. Which one got your attention today?`,
      });
    }

    // Fallback: random generic prompt
    const idx = Math.floor(Math.random() * GENERIC_PROMPTS.length);
    return NextResponse.json({ prompt: GENERIC_PROMPTS[idx] });
  } catch (err) {
    console.error("[journal/prompt] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
