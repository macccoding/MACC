import { prisma } from "@/lib/prisma";
import { getActionLog } from "./action-log";
import { recall } from "./memory";

export interface ContextBlock {
  label: string;
  content: string;
}

const CHAR_BUDGET = 3500;

function appendWithBudget(
  sections: string[],
  section: string,
  remaining: number,
): number {
  if (remaining <= 0) return remaining;
  const trimmed =
    section.length > remaining
      ? section.slice(0, remaining) + "...[trimmed]"
      : section;
  sections.push(trimmed);
  return remaining - trimmed.length;
}

type KeywordTrigger = {
  keywords: string[];
  match?: (message: string) => boolean;
  fetch: () => Promise<ContextBlock | null>;
};

const KEYWORD_TRIGGERS: KeywordTrigger[] = [
  // ─── 1. Habits (existing) ─────────────────────────────────────
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
          `- ${h.title}: ${h.logs.length > 0 && h.logs[0].completed ? "Done" : "Not done"}`,
      );
      const done = habits.filter(
        (h) => h.logs.length > 0 && h.logs[0].completed,
      ).length;
      return {
        label: "Today's Habits",
        content: `${done}/${habits.length} completed today:\n${lines.join("\n")}`,
      };
    },
  },
  // ─── 2. Health (existing) ─────────────────────────────────────
  {
    keywords: ["health", "sleep", "steps", "exercise", "heart"],
    fetch: async () => {
      const snapshot = await prisma.healthSnapshot.findFirst({
        orderBy: { date: "desc" },
      });
      if (!snapshot) return null;
      const parts: string[] = [];
      if (snapshot.steps != null)
        parts.push(`Steps: ${snapshot.steps.toLocaleString()}`);
      if (snapshot.sleep != null) parts.push(`Sleep: ${snapshot.sleep}h`);
      if (snapshot.heartRate != null)
        parts.push(`Heart rate: ${snapshot.heartRate} bpm`);
      if (snapshot.calories != null)
        parts.push(`Calories: ${snapshot.calories}`);
      return {
        label: "Latest Health",
        content: `${snapshot.date.toISOString().split("T")[0]}: ${parts.join(", ")}`,
      };
    },
  },
  // ─── 3. Portfolio (existing) ──────────────────────────────────
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
        return `- ${inv.symbol}: $${value.toFixed(0)} (${inv.currentPrice ? (((inv.currentPrice - (inv.entryPrice ?? 0)) / (inv.entryPrice ?? 1)) * 100).toFixed(1) : "?"}%)`;
      });
      return {
        label: "Portfolio Summary",
        content: `Total value: $${totalValue.toFixed(0)} | Cost basis: $${totalCost.toFixed(0)} | P/L: $${(totalValue - totalCost).toFixed(0)}\n${lines.join("\n")}`,
      };
    },
  },
  // ─── 4. Finance (existing) ────────────────────────────────────
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
  // ─── 5. Goals (existing) ──────────────────────────────────────
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
          `- ${g.title}${g.deadline ? ` (due ${g.deadline.toISOString().split("T")[0]})` : ""}`,
      );
      return {
        label: "Active Goals",
        content: `${goals.length} active goals:\n${lines.join("\n")}`,
      };
    },
  },
  // ─── 6. Calendar (new) ────────────────────────────────────────
  {
    keywords: [
      "calendar",
      "schedule",
      "meeting",
      "event",
      "time block",
      "gym",
      "deep work",
    ],
    fetch: async () => {
      try {
        const { getTodayEvents } = await import("./google/calendar");
        const events = await getTodayEvents();
        if (events.length === 0) return null;
        const lines = events.map((e) => {
          const time = e.start
            ? new Date(e.start).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "All day";
          return `${time} - ${e.summary}${e.location ? " @ " + e.location : ""}`;
        });
        return {
          label: "Today's Calendar",
          content: `TODAY'S CALENDAR:\n${lines.join("\n")}`,
        };
      } catch {
        return null;
      }
    },
  },
  // ─── 7. Email (new) ───────────────────────────────────────────
  {
    keywords: ["email", "gmail", "inbox", "reply", "thread"],
    fetch: async () => {
      try {
        const { getEmailSummary } = await import("./google/gmail");
        const summary = await getEmailSummary();
        return {
          label: "Email Summary",
          content: `EMAIL: ${summary.unreadCount} unread`,
        };
      } catch {
        return null;
      }
    },
  },
  // ─── 8. Tasks (new) ───────────────────────────────────────────
  {
    keywords: ["task", "todo", "overdue", "deadline", "action item", "remind"],
    fetch: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [overdue, dueToday] = await Promise.all([
        prisma.kemiTask.findMany({
          where: {
            dueDate: { lt: today },
            status: { in: ["open", "in_progress"] },
          },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
        prisma.kemiTask.findMany({
          where: {
            dueDate: { gte: today, lt: tomorrow },
            status: { in: ["open", "in_progress"] },
          },
          orderBy: { sortOrder: "asc" },
          take: 10,
        }),
      ]);

      if (overdue.length === 0 && dueToday.length === 0) return null;

      const parts: string[] = [];
      if (overdue.length > 0) {
        parts.push(
          `Overdue:\n${overdue.map((t) => `- ${t.title} (due ${t.dueDate!.toISOString().split("T")[0]})`).join("\n")}`,
        );
      }
      if (dueToday.length > 0) {
        parts.push(
          `Due today:\n${dueToday.map((t) => `- ${t.title}`).join("\n")}`,
        );
      }
      return {
        label: "Tasks",
        content: `TASKS:\n${parts.join("\n")}`,
      };
    },
  },
  // ─── 9. Actions (new) ─────────────────────────────────────────
  {
    keywords: ["what did you do", "actions", "action log", "audit"],
    fetch: async () => {
      const actions = await getActionLog(24, 15);
      if (actions.length === 0) return null;
      const lines = actions.map((a) => `- ${a.description}`);
      return {
        label: "Recent Actions",
        content: `RECENT ACTIONS (24h):\n${lines.join("\n")}`,
      };
    },
  },
  // ─── 10. Birthdays (new) ──────────────────────────────────────
  {
    keywords: ["birthday", "birthdays"],
    fetch: async () => {
      const now = new Date();
      const contacts = await prisma.contact.findMany({
        where: { birthday: { not: null } },
        select: { name: true, birthday: true },
      });
      if (contacts.length === 0) return null;

      const upcoming = contacts
        .filter((c) => {
          if (!c.birthday) return false;
          const bday = new Date(c.birthday);
          // Check if birthday is within 7 days (handle year wraparound)
          const thisYearBday = new Date(
            now.getFullYear(),
            bday.getMonth(),
            bday.getDate(),
          );
          const diff =
            (thisYearBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= -1 && diff <= 7;
        })
        .map((c) => {
          const bday = new Date(c.birthday!);
          const dateStr = `${bday.getMonth() + 1}/${bday.getDate()}`;
          return `- ${c.name} (${dateStr})`;
        });

      if (upcoming.length === 0) return null;
      return {
        label: "Upcoming Birthdays",
        content: `UPCOMING BIRTHDAYS:\n${upcoming.join("\n")}`,
      };
    },
  },
  // ─── 11. Memory / semantic recall (new) ───────────────────────
  {
    keywords: [
      "remember",
      "earlier",
      "before",
      "last time",
      "previous",
      "you said",
      "i said",
    ],
    match: (message: string) => message.length >= 20,
    fetch: async () => {
      // Placeholder — actual message is injected via getRelevantContext
      return null;
    },
  },
  // ─── 12. Journal (new) ────────────────────────────────────────
  {
    keywords: ["journal", "reflect", "reflection", "capture", "thought", "diary"],
    fetch: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await prisma.journalEntry.count({
        where: { date: { gte: today, lt: tomorrow } },
      });
      return {
        label: "Journal",
        content: `JOURNAL: ${count} ${count === 1 ? "entry" : "entries"} today`,
      };
    },
  },
  // ─── 13. Reading (new) ────────────────────────────────────────
  {
    keywords: ["reading", "book", "books", "pages", "read", "audiobook"],
    fetch: async () => {
      const items = await prisma.readingItem.findMany({
        where: { status: "reading" },
        take: 3,
        orderBy: { updatedAt: "desc" },
      });
      if (items.length === 0) return null;
      const lines = items.map(
        (i) => `- ${i.title} — ${Math.round(i.progress)}%`,
      );
      return {
        label: "Reading",
        content: `READING: Currently reading:\n${lines.join("\n")}`,
      };
    },
  },
  // ─── 14. Budget (new) ─────────────────────────────────────────
  {
    keywords: [
      "allocation",
      "runway",
      "subscription",
      "recurring",
      "bills",
      "budget score",
    ],
    fetch: async () => {
      const score = await prisma.budgetScore.findFirst({
        orderBy: { date: "desc" },
      });
      if (!score) return null;
      return {
        label: "Budget Score",
        content: `BUDGET SCORE: ${score.score}/100`,
      };
    },
  },
  // ─── 15. Spending (new — extends finance) ─────────────────────
  {
    keywords: ["spent", "expense", "cost", "price", "payment"],
    fetch: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const transactions = await prisma.transaction.findMany({
        where: {
          date: { gte: sevenDaysAgo },
          amount: { lt: 0 },
        },
        select: { amount: true },
      });
      if (transactions.length === 0) return null;
      const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        label: "Recent Spending",
        content: `SPENDING (7 days): $${total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      };
    },
  },
  // ─── 16. Mood ─────────────────────────────────────────────────
  {
    keywords: ["mood", "feeling", "energy", "how am i", "emotion"],
    fetch: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const entries = await prisma.moodEntry.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 7,
      });
      if (entries.length === 0) return null;
      const avgMood = entries.reduce((s, e) => s + e.mood, 0) / entries.length;
      const avgEnergy = entries.reduce((s, e) => s + e.energy, 0) / entries.length;
      const lines = entries.map(
        (e) =>
          `${e.createdAt.toISOString().split("T")[0]}: mood ${e.mood}/5, energy ${e.energy}/5${e.note ? ` — ${e.note}` : ""}`,
      );
      return {
        label: "Mood (7 days)",
        content: `MOOD (7 days, avg ${avgMood.toFixed(1)}/5, energy ${avgEnergy.toFixed(1)}/5):\n${lines.join("\n")}`,
      };
    },
  },
  // ─── 17. Focus ───────────────────────────────────────────────────
  {
    keywords: ["focus", "pomodoro", "deep work", "timer", "concentration"],
    fetch: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const sessions = await prisma.focusSession.findMany({
        where: { status: "completed", startedAt: { gte: since } },
      });
      if (sessions.length === 0) return null;
      const totalMin = sessions.reduce((s, f) => s + (f.actualMinutes || 0), 0);
      return {
        label: "Focus (7 days)",
        content: `FOCUS (7 days): ${sessions.length} sessions, ${totalMin} minutes total`,
      };
    },
  },
];

/**
 * Fetch memory recall block for a given message.
 * Separated from KEYWORD_TRIGGERS because it needs the message text.
 */
async function fetchMemoryContext(
  message: string,
): Promise<ContextBlock | null> {
  try {
    const memories = await recall(message, 3, undefined, 0.72);
    if (memories.length === 0) return null;
    const lines = memories.map(
      (m) =>
        `- (${Math.round(m.similarity * 100)}%) ${m.content.slice(0, 140)}`,
    );
    return {
      label: "Relevant Memories",
      content: `RELEVANT MEMORIES:\n${lines.join("\n")}`,
    };
  } catch {
    return null;
  }
}

/**
 * Scan the user message for keyword triggers and fetch relevant live data
 * to inject into the system prompt as context blocks.
 */
export async function getRelevantContext(
  message: string,
): Promise<ContextBlock[]> {
  const lower = message.toLowerCase();

  // Find all matching keyword triggers
  const matchedFetchers = KEYWORD_TRIGGERS.filter((trigger) => {
    // Skip the memory placeholder — handled separately below
    if (trigger.match && trigger.keywords.includes("remember")) return false;
    return trigger.keywords.some((kw) => lower.includes(kw));
  });

  // Check if memory recall should trigger
  const memoryTrigger = KEYWORD_TRIGGERS.find(
    (t) => t.match && t.keywords.includes("remember"),
  );
  const shouldRecallMemory =
    memoryTrigger &&
    (memoryTrigger.match!(message) ||
      memoryTrigger.keywords.some((kw) => lower.includes(kw)));

  // Fetch all in parallel
  const fetches: Promise<ContextBlock | null>[] = matchedFetchers.map((t) =>
    t.fetch().catch(() => null),
  );
  if (shouldRecallMemory) {
    fetches.push(fetchMemoryContext(message));
  }

  if (fetches.length === 0) return [];

  const results = await Promise.all(fetches);
  const blocks = results.filter((r): r is ContextBlock => r !== null);

  // Apply character budget
  if (blocks.length === 0) return [];

  const budgeted: string[] = [];
  let remaining = CHAR_BUDGET;
  for (const block of blocks) {
    const section = `[${block.label}] ${block.content}`;
    remaining = appendWithBudget(budgeted, section, remaining);
    if (remaining <= 0) break;
  }

  // Re-parse budgeted sections back into ContextBlocks
  return budgeted.map((s) => {
    const bracketEnd = s.indexOf("] ");
    if (bracketEnd === -1) return { label: "", content: s };
    return {
      label: s.slice(1, bracketEnd),
      content: s.slice(bracketEnd + 2),
    };
  });
}
