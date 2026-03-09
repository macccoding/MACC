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
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // 1. Exercise reminder
  sendTelegramMessage(
    "\u{1f3cb}\ufe0f Morning! Time to move. What's the workout today?"
  );
  jobs.push("exercise_reminder");

  // 2. Birthday check — today + next 3 days
  try {
    const contacts = await prisma.contact.findMany({
      where: { birthday: { not: null } },
      select: { name: true, birthday: true },
    });

    const upcoming = contacts.filter((c) => {
      if (!c.birthday) return false;
      const bMonth = c.birthday.getMonth() + 1;
      const bDay = c.birthday.getDate();
      for (let offset = 0; offset <= 3; offset++) {
        const check = new Date(today);
        check.setDate(check.getDate() + offset);
        if (bMonth === check.getMonth() + 1 && bDay === check.getDate()) {
          return true;
        }
      }
      return false;
    });

    if (upcoming.length > 0) {
      const lines = upcoming.map((c) => {
        const bDay = c.birthday!;
        const bMonth = bDay.getMonth() + 1;
        const bDate = bDay.getDate();
        const isToday = bMonth === month && bDate === day;
        return `${isToday ? "\u{1f382}" : "\u{1f4c5}"} ${c.name} — ${isToday ? "TODAY!" : `${bMonth}/${bDate}`}`;
      });
      sendTelegramMessage(
        `*Upcoming Birthdays*\n${lines.join("\n")}`
      );
    }
    jobs.push("birthday_check");
  } catch (err) {
    console.error("[cron/morning] birthday check error:", err);
  }

  // 3. Daily reachout check
  try {
    const overdue = await prisma.contact.findMany({
      where: {
        nextReachOut: { not: null, lte: today },
      },
      select: { name: true, nextReachOut: true, relationship: true },
      orderBy: { nextReachOut: "asc" },
    });

    if (overdue.length > 0) {
      const lines = overdue.map((c) => {
        const daysOverdue = Math.floor(
          (today.getTime() - c.nextReachOut!.getTime()) / (1000 * 60 * 60 * 24)
        );
        const urgency = daysOverdue > 7 ? "\u{1f534}" : daysOverdue > 3 ? "\u{1f7e1}" : "\u{1f7e2}";
        return `${urgency} ${c.name}${c.relationship ? ` (${c.relationship})` : ""} — ${daysOverdue === 0 ? "due today" : `${daysOverdue}d overdue`}`;
      });
      sendTelegramMessage(
        `*Reachout Reminders* (${overdue.length})\n${lines.join("\n")}`
      );
    }
    jobs.push("reachout_check");
  } catch (err) {
    console.error("[cron/morning] reachout check error:", err);
  }

  return NextResponse.json({ ok: true, jobs });
}
