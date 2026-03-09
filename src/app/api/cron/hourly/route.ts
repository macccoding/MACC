import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/kemi/telegram";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs: string[] = [];

  // Email triage — sync unread from Gmail, alert on urgent
  try {
    const { getUnreadEmails } = await import("@/lib/kemi/google/gmail");

    const emails = await getUnreadEmails("business", 20);

    if (emails.length > 0) {
      // Cache new emails
      for (const email of emails) {
        if (!email.id) continue;
        await prisma.emailCache.upsert({
          where: { gmailId: email.id },
          create: {
            gmailId: email.id,
            subject: email.subject,
            sender: email.from,
            snippet: email.snippet,
            date: email.date ? new Date(email.date) : new Date(),
            isRead: false,
          },
          update: {},
        });
      }

      // Check for urgent-looking emails:
      // - from known contacts
      // - subject contains urgent keywords
      const knownContacts = await prisma.contact.findMany({
        where: { email: { not: null } },
        select: { email: true },
      });
      const knownEmails = new Set(
        knownContacts.map((c) => c.email!.toLowerCase())
      );

      const urgentKeywords = [
        "urgent",
        "asap",
        "important",
        "action required",
        "deadline",
        "immediately",
      ];

      const urgent = emails.filter((e) => {
        const fromLower = e.from.toLowerCase();
        const subjLower = e.subject.toLowerCase();
        const isFromKnown = [...knownEmails].some((k) =>
          fromLower.includes(k)
        );
        const hasUrgentKeyword = urgentKeywords.some(
          (kw) => subjLower.includes(kw) || e.snippet.toLowerCase().includes(kw)
        );
        return isFromKnown || hasUrgentKeyword;
      });

      if (urgent.length > 0) {
        const lines = urgent.slice(0, 5).map(
          (e) => `\u{1f4e7} *${e.subject}*\nFrom: ${e.from}`
        );
        await sendTelegramMessage(
          `*Urgent Emails* (${urgent.length})\n\n${lines.join("\n\n")}`
        );
      }
    }

    jobs.push("email_triage");
  } catch (err) {
    // Gmail may not be configured — that's OK
    console.error("[cron/hourly] email triage error:", err);
    jobs.push("email_triage_skipped");
  }

  return NextResponse.json({ ok: true, jobs });
}
