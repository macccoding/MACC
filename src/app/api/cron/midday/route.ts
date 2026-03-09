import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/kemi/telegram";
import { generateBriefing } from "@/lib/kemi/briefing";
import { todayJamaica } from "@/lib/kemi/utils";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs: string[] = [];
  const today = todayJamaica();

  // 1. Daily briefing via Claude
  try {
    const briefing = await generateBriefing();
    await sendTelegramMessage(`*Daily Briefing*\n\n${briefing}`);
    jobs.push("briefing");
  } catch (err) {
    console.error("[cron/midday] briefing error:", err);
    sendTelegramMessage("Could not generate briefing today. Check logs.");
  }

  // 2. Overdue task nudge
  try {
    const overdueTasks = await prisma.kemiTask.findMany({
      where: {
        status: { in: ["open", "in_progress"] },
        dueDate: { lt: today },
      },
      orderBy: { dueDate: "asc" },
    });

    if (overdueTasks.length > 0) {
      const lines = overdueTasks.map((t) => {
        const daysOverdue = Math.floor(
          (today.getTime() - t.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
        );

        let prefix: string;
        if (daysOverdue >= 7) {
          prefix = "\u{1f6d1} Decision time \u2014 do it, delegate, or kill it";
        } else if (daysOverdue >= 3) {
          prefix = `\u26a0\ufe0f This has been sitting for ${daysOverdue} days`;
        } else {
          prefix = "\u{1f4cb} Gentle reminder (due yesterday)";
        }
        return `${prefix}: *${t.title}*`;
      });

      await sendTelegramMessage(
        `*Overdue Tasks* (${overdueTasks.length})\n\n${lines.join("\n")}`
      );
    }
    jobs.push("overdue_task_nudge");
  } catch (err) {
    console.error("[cron/midday] overdue task nudge error:", err);
  }

  return NextResponse.json({ ok: true, jobs });
}
