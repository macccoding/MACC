import { prisma } from "@/lib/prisma";

export interface ContextBlock {
  label: string;
  content: string;
}

const KEYWORD_TRIGGERS: {
  keywords: string[];
  fetch: () => Promise<ContextBlock | null>;
}[] = [
  {
    keywords: ["habit", "habits", "routine", "streak"],
    fetch: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const habits = await prisma.habit.findMany({
        include: { logs: { where: { date: today }, take: 1 } },
        orderBy: { createdAt: "asc" },
      });
      if (habits.length === 0) return null;
      const lines = habits.map(
        (h) =>
          `- ${h.title}: ${h.logs.length > 0 && h.logs[0].completed ? "Done" : "Not done"}`
      );
      const done = habits.filter(
        (h) => h.logs.length > 0 && h.logs[0].completed
      ).length;
      return {
        label: "Today's Habits",
        content: `${done}/${habits.length} completed today:\n${lines.join("\n")}`,
      };
    },
  },
  {
    keywords: ["health", "sleep", "steps", "exercise", "heart"],
    fetch: async () => {
      const snapshot = await prisma.healthSnapshot.findFirst({
        orderBy: { date: "desc" },
      });
      if (!snapshot) return null;
      const parts: string[] = [];
      if (snapshot.steps != null) parts.push(`Steps: ${snapshot.steps.toLocaleString()}`);
      if (snapshot.sleep != null) parts.push(`Sleep: ${snapshot.sleep}h`);
      if (snapshot.heartRate != null) parts.push(`Heart rate: ${snapshot.heartRate} bpm`);
      if (snapshot.calories != null) parts.push(`Calories: ${snapshot.calories}`);
      return {
        label: "Latest Health",
        content: `${snapshot.date.toISOString().split("T")[0]}: ${parts.join(", ")}`,
      };
    },
  },
  {
    keywords: ["portfolio", "invest", "stock", "crypto", "holdings"],
    fetch: async () => {
      const investments = await prisma.investment.findMany({
        orderBy: { symbol: "asc" },
      });
      if (investments.length === 0) return null;
      let totalValue = 0;
      let totalCost = 0;
      const lines = investments.map((inv) => {
        const value =
          inv.currentPrice && inv.quantity
            ? inv.currentPrice * inv.quantity
            : 0;
        const cost = inv.costBasis ?? 0;
        totalValue += value;
        totalCost += cost;
        return `- ${inv.symbol}: $${value.toFixed(0)} (${inv.currentPrice ? ((inv.currentPrice - (inv.entryPrice ?? 0)) / (inv.entryPrice ?? 1) * 100).toFixed(1) : "?"}%)`;
      });
      return {
        label: "Portfolio Summary",
        content: `Total value: $${totalValue.toFixed(0)} | Cost basis: $${totalCost.toFixed(0)} | P/L: $${(totalValue - totalCost).toFixed(0)}\n${lines.join("\n")}`,
      };
    },
  },
  {
    keywords: ["finance", "money", "spend", "budget", "net worth", "balance"],
    fetch: async () => {
      const snapshot = await prisma.financialSnapshot.findFirst({
        orderBy: { date: "desc" },
      });
      if (!snapshot) return null;
      return {
        label: "Latest Financial Snapshot",
        content: `Date: ${snapshot.date.toISOString().split("T")[0]}\nData: ${JSON.stringify(snapshot.data).slice(0, 500)}`,
      };
    },
  },
  {
    keywords: ["goal", "goals", "objective", "target"],
    fetch: async () => {
      const goals = await prisma.goal.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
      });
      if (goals.length === 0) return null;
      const lines = goals.map(
        (g) =>
          `- ${g.title}${g.deadline ? ` (due ${g.deadline.toISOString().split("T")[0]})` : ""}`
      );
      return {
        label: "Active Goals",
        content: `${goals.length} active goals:\n${lines.join("\n")}`,
      };
    },
  },
];

/**
 * Scan the user message for keyword triggers and fetch relevant live data
 * to inject into the system prompt as context blocks.
 */
export async function getRelevantContext(
  message: string
): Promise<ContextBlock[]> {
  const lower = message.toLowerCase();
  const matchedFetchers = KEYWORD_TRIGGERS.filter((trigger) =>
    trigger.keywords.some((kw) => lower.includes(kw))
  );

  if (matchedFetchers.length === 0) return [];

  const results = await Promise.all(
    matchedFetchers.map((t) => t.fetch().catch(() => null))
  );

  return results.filter((r): r is ContextBlock => r !== null);
}
