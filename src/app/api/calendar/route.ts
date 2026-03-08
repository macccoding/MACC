import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type AgendaItem = {
  time: string | null;
  type: "birthday" | "reachout" | "goal" | "habit" | "health";
  title: string;
  module: string;
  done?: boolean;
};

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  // Parse date or default to today
  const targetDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const dateStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dateEnd = new Date(`${dateStr}T23:59:59.999Z`);

  try {
    const items: AgendaItem[] = [];

    // 1. Goals with deadline on this date
    const goals = await prisma.goal.findMany({
      where: {
        deadline: { gte: dateStart, lte: dateEnd },
        status: "active",
      },
    });
    for (const goal of goals) {
      items.push({
        time: null,
        type: "goal",
        title: goal.title,
        module: "goals",
      });
    }

    // 2. HabitLogs for this date (with habit title)
    const habitLogs = await prisma.habitLog.findMany({
      where: { date: dateStart },
      include: { habit: true },
    });
    for (const log of habitLogs) {
      items.push({
        time: null,
        type: "habit",
        title: `${log.completed ? "Completed" : "Skipped"}: ${log.habit.title}`,
        module: "habits",
        done: log.completed,
      });
    }

    // 3. HealthSnapshot for this date
    const healthSnapshot = await prisma.healthSnapshot.findFirst({
      where: { date: dateStart },
    });
    if (healthSnapshot) {
      const parts: string[] = [];
      if (healthSnapshot.steps != null)
        parts.push(`Steps: ${healthSnapshot.steps.toLocaleString()}`);
      if (healthSnapshot.sleep != null)
        parts.push(`Sleep: ${healthSnapshot.sleep}h`);
      if (healthSnapshot.calories != null)
        parts.push(`Calories: ${healthSnapshot.calories.toLocaleString()}`);
      if (healthSnapshot.heartRate != null)
        parts.push(`HR: ${healthSnapshot.heartRate}`);
      items.push({
        time: null,
        type: "health",
        title: parts.length > 0 ? parts.join(" | ") : "Health snapshot recorded",
        module: "health",
      });
    }

    // 4. Contacts with nextReachOut on this date
    const reachouts = await prisma.contact.findMany({
      where: { nextReachOut: dateStart },
    });
    for (const contact of reachouts) {
      items.push({
        time: null,
        type: "reachout",
        title: `Follow up with ${contact.name}`,
        module: "people",
      });
    }

    // 5. Contacts with birthday matching month/day
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const allContactsWithBirthday = await prisma.contact.findMany({
      where: { birthday: { not: null } },
    });
    for (const contact of allContactsWithBirthday) {
      if (contact.birthday) {
        const bday = new Date(contact.birthday);
        if (bday.getUTCMonth() + 1 === month && bday.getUTCDate() === day) {
          items.push({
            time: null,
            type: "birthday",
            title: `${contact.name}'s Birthday`,
            module: "people",
          });
        }
      }
    }

    // Sort: birthdays first, then reachouts, goals, habits, health
    const typeOrder: Record<string, number> = {
      birthday: 0,
      reachout: 1,
      goal: 2,
      habit: 3,
      health: 4,
    };
    items.sort((a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9));

    return NextResponse.json(
      { date: dateStr, items },
      {
        headers: {
          "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("[calendar] Agenda error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
