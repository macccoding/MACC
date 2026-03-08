import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

// In-memory cache with 4-hour TTL
let cachedBriefing: { text: string; generatedAt: number } | null = null;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Generate Mike's daily briefing by fetching all data sources
 * and sending to Claude Sonnet for summarization.
 */
export async function generateBriefing(): Promise<string> {
  // Check cache
  if (
    cachedBriefing &&
    Date.now() - cachedBriefing.generatedAt < CACHE_TTL_MS
  ) {
    return cachedBriefing.text;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch all data sources in parallel
  const [
    habits,
    goals,
    healthSnapshots,
    financialSnapshot,
    investments,
    emails,
    captures,
    journal,
  ] = await Promise.all([
    prisma.habit.findMany({
      include: { logs: { where: { date: today }, take: 1 } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.goal.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.healthSnapshot.findMany({
      where: { date: { gte: sevenDaysAgo } },
      orderBy: { date: "desc" },
      take: 3,
    }),
    prisma.financialSnapshot.findFirst({
      orderBy: { date: "desc" },
    }),
    prisma.investment.findMany({
      orderBy: { symbol: "asc" },
    }),
    prisma.emailCache.findMany({
      where: { isRead: false },
      orderBy: { date: "desc" },
      take: 10,
      select: { subject: true, sender: true, category: true, date: true },
    }),
    prisma.capture.findMany({
      where: { processed: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.journal.findFirst({
      orderBy: { date: "desc" },
    }),
  ]);

  // Build data context
  const habitsDone = habits.filter(
    (h) => h.logs.length > 0 && h.logs[0].completed
  ).length;
  const habitsSummary = `Habits: ${habitsDone}/${habits.length} done today`;

  const goalsSummary = `Active goals: ${goals.length}${goals.length > 0 ? " — " + goals.map((g) => g.title).join(", ") : ""}`;

  let healthSummary = "Health: No recent data";
  if (healthSnapshots.length > 0) {
    const latest = healthSnapshots[0];
    const parts: string[] = [];
    if (latest.steps != null) parts.push(`${latest.steps.toLocaleString()} steps`);
    if (latest.sleep != null) parts.push(`${latest.sleep}h sleep`);
    if (latest.heartRate != null) parts.push(`${latest.heartRate} bpm`);
    healthSummary = `Health (${latest.date.toISOString().split("T")[0]}): ${parts.join(", ")}`;
  }

  let portfolioSummary = "Portfolio: No data";
  if (investments.length > 0) {
    let totalValue = 0;
    let totalCost = 0;
    for (const inv of investments) {
      if (inv.currentPrice && inv.quantity) totalValue += inv.currentPrice * inv.quantity;
      if (inv.costBasis) totalCost += inv.costBasis;
    }
    const pnl = totalValue - totalCost;
    portfolioSummary = `Portfolio: ${investments.length} positions, $${totalValue.toFixed(0)} value, ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)} P/L`;
  }

  let financeSummary = "Finances: No snapshot available";
  if (financialSnapshot) {
    financeSummary = `Finances (${financialSnapshot.date.toISOString().split("T")[0]}): ${JSON.stringify(financialSnapshot.data).slice(0, 300)}`;
  }

  const emailSummary = `Unread emails: ${emails.length}${emails.length > 0 ? " — " + emails.slice(0, 3).map((e) => `"${e.subject}" from ${e.sender}`).join("; ") : ""}`;

  const capturesSummary = `Unprocessed captures: ${captures.length}${captures.length > 0 ? " — " + captures.slice(0, 3).map((c) => c.content.slice(0, 50)).join("; ") : ""}`;

  const journalSummary = journal
    ? `Last journal (${journal.date.toISOString().split("T")[0]}): ${journal.content.slice(0, 200)}`
    : "Journal: No recent entries";

  const dataContext = [
    habitsSummary,
    goalsSummary,
    healthSummary,
    portfolioSummary,
    financeSummary,
    emailSummary,
    capturesSummary,
    journalSummary,
  ].join("\n");

  // Generate briefing via Claude Sonnet
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    system:
      "You are Kemi, Mike Chen's AI executive assistant. Generate Mike's daily briefing. Be concise and direct — no fluff. Lead with the most important thing. Use 3-5 bullet points. Speak in your natural voice (sharp, warm Jamaican professional).",
    messages: [
      {
        role: "user",
        content: `Here is Mike's current data. Generate a briefing:\n\n${dataContext}`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  const briefingText = textBlock?.text ?? "Couldn't generate briefing right now.";

  // Cache result
  cachedBriefing = { text: briefingText, generatedAt: Date.now() };

  return briefingText;
}
