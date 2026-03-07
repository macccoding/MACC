"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface DashboardBrief {
  goals: { active: number; titles: string[] };
  habits: { total: number; completedToday: number };
  captures: { unprocessed: number };
  finances: Record<string, unknown> | null;
}

interface DashboardCard {
  title: string;
  content: string;
  accent: boolean;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function buildCards(brief: DashboardBrief | null): DashboardCard[] {
  if (!brief) {
    return [
      { title: "Loading", content: "Fetching your data...", accent: false },
    ];
  }

  const cards: DashboardCard[] = [];

  // Goals card
  const goalLine =
    brief.goals.active > 0
      ? `${brief.goals.active} active — ${brief.goals.titles[0] || ""}${brief.goals.titles.length > 1 ? ` +${brief.goals.titles.length - 1} more` : ""}`
      : "No active goals";
  cards.push({ title: "Goals", content: goalLine, accent: brief.goals.active > 0 });

  // Habits card
  const habitLine =
    brief.habits.total > 0
      ? `${brief.habits.completedToday}/${brief.habits.total} completed today`
      : "No habits tracked";
  cards.push({
    title: "Habits",
    content: habitLine,
    accent: brief.habits.completedToday === brief.habits.total && brief.habits.total > 0,
  });

  // Captures card
  const captureCount = brief.captures.unprocessed;
  cards.push({
    title: "Captures",
    content:
      captureCount > 0
        ? `${captureCount} unprocessed capture${captureCount !== 1 ? "s" : ""}`
        : "Inbox zero",
    accent: captureCount > 0,
  });

  // Finances card
  if (brief.finances && typeof brief.finances === "object") {
    const fin = brief.finances as Record<string, unknown>;
    const parts: string[] = [];
    if (fin.debt !== undefined) parts.push(`Debt: $${Number(fin.debt).toLocaleString()}`);
    if (fin.savings !== undefined) parts.push(`Savings: $${Number(fin.savings).toLocaleString()}`);
    if (fin.netWorth !== undefined) parts.push(`Net worth: $${Number(fin.netWorth).toLocaleString()}`);
    cards.push({
      title: "Finances",
      content: parts.length > 0 ? parts.join(" · ") : "Latest snapshot recorded",
      accent: false,
    });
  } else {
    cards.push({
      title: "Finances",
      content: "No snapshot yet",
      accent: false,
    });
  }

  return cards;
}

export default function DashboardHome() {
  const [brief, setBrief] = useState<DashboardBrief | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/brief")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBrief(data))
      .catch(() => setBrief(null));
  }, []);

  const cards = buildCards(brief);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          {getGreeting()}, <span className="text-vermillion">Mike</span>
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Here&apos;s your day at a glance.
        </p>
      </motion.div>

      {/* Brief cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/20 transition-colors duration-300"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.06,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p
              className={`font-mono tracking-[0.12em] uppercase mb-2.5 ${
                card.accent ? "text-vermillion/50" : "text-sumi-gray-light"
              }`}
              style={{ fontSize: "var(--text-micro)" }}
            >
              {card.title}
            </p>
            <p className="text-ink-black/80 text-sm leading-relaxed">
              {card.content}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
