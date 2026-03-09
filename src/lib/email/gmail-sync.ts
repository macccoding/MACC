import { getGmailClient } from "./gmail-client";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

type SyncResult = {
  synced: number;
  newEmails: number;
  error?: string;
};

async function categorizeEmail(
  subject: string,
  sender: string,
  snippet: string
): Promise<{ category: string; summary: string }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Categorize this email and write a 1-sentence summary.

Subject: ${subject}
From: ${sender}
Preview: ${snippet}

Categories: important, action_needed, fyi, newsletter, receipt, spam

Respond as JSON only: {"category": "...", "summary": "..."}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    return {
      category: parsed.category || "fyi",
      summary: parsed.summary || "",
    };
  } catch {
    return { category: "fyi", summary: "" };
  }
}

function decodeHeader(
  headers: Array<{ name: string; value: string }>,
  name: string
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

export async function syncGmail(): Promise<SyncResult> {
  const gmail = getGmailClient();
  let newEmails = 0;

  try {
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: "newer_than:2d",
      maxResults: 50,
    });

    const messageIds = listRes.data.messages ?? [];

    for (const msg of messageIds) {
      if (!msg.id) continue;

      const existing = await prisma.emailCache.findUnique({
        where: { gmailId: msg.id },
      });

      if (existing) {
        const fullMsg = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "metadata",
          metadataHeaders: [],
        });
        const labels = fullMsg.data.labelIds ?? [];
        await prisma.emailCache.update({
          where: { gmailId: msg.id },
          data: {
            isRead: !labels.includes("UNREAD"),
            isStarred: labels.includes("STARRED"),
            labels,
          },
        });
        continue;
      }

      const fullMsg = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = (fullMsg.data.payload?.headers ?? []) as { name: string; value: string }[];
      const subject = decodeHeader(headers, "Subject");
      const sender = decodeHeader(headers, "From");
      const dateStr = decodeHeader(headers, "Date");
      const snippet = fullMsg.data.snippet ?? "";
      const labels = fullMsg.data.labelIds ?? [];

      let body = "";
      const payload = fullMsg.data.payload;
      if (payload?.body?.data) {
        body = Buffer.from(payload.body.data, "base64url").toString("utf-8");
      } else if (payload?.parts) {
        const textPart = payload.parts.find(
          (p) => p.mimeType === "text/plain"
        );
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64url").toString("utf-8");
        }
      }

      const { category, summary } = await categorizeEmail(
        subject,
        sender,
        snippet
      );

      await prisma.emailCache.create({
        data: {
          gmailId: msg.id,
          subject,
          sender,
          snippet,
          date: dateStr ? new Date(dateStr) : new Date(),
          isRead: !labels.includes("UNREAD"),
          isStarred: labels.includes("STARRED"),
          labels,
          body: body.slice(0, 5000),
          category,
          summary,
        },
      });
      newEmails++;
    }

    return { synced: messageIds.length, newEmails };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { synced: 0, newEmails: 0, error: message };
  }
}

export async function generateDigest(): Promise<string> {
  const recent = await prisma.emailCache.findMany({
    where: { date: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
    orderBy: { date: "desc" },
    take: 30,
  });

  if (recent.length === 0) return "No recent emails to summarize.";

  const unread = recent.filter((e) => !e.isRead);
  const actionNeeded = recent.filter((e) => e.category === "action_needed");

  const emailList = recent
    .slice(0, 20)
    .map(
      (e) =>
        `- [${e.category}] ${e.sender}: "${e.subject}" — ${e.summary || e.snippet.slice(0, 80)}`
    )
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Summarize Mike's email inbox. ${unread.length} unread, ${actionNeeded.length} need action.

Recent emails:
${emailList}

Write a brief digest (3-5 bullets). Lead with what needs attention. Be direct, not verbose.`,
        },
      ],
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "Could not generate digest.";
  } catch {
    return "Digest generation failed. Check API key.";
  }
}
