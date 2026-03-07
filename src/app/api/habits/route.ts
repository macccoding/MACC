import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const habits = await prisma.habit.findMany({
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Calculate streaks for each habit
    const habitsWithStreaks = habits.map((habit) => {
      const completedDates = new Set(
        habit.logs
          .filter((log) => log.completed)
          .map((log) => {
            const d = new Date(log.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          })
      );

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;

        if (completedDates.has(dateStr)) {
          streak++;
        } else if (i === 0) {
          // Today not completed yet — don't break, check yesterday
          continue;
        } else {
          break;
        }
      }

      return {
        ...habit,
        streak,
      };
    });

    return NextResponse.json(habitsWithStreaks);
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

  let title: string;
  let frequency: string | undefined;

  try {
    const body = await request.json();
    title = body.title;
    frequency = body.frequency;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate title
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  try {
    const habit = await prisma.habit.create({
      data: {
        title: title.trim(),
        ...(frequency ? { frequency } : {}),
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
