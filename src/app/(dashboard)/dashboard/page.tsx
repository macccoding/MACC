"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MODULES } from "@/components/dashboard/Sidebar";

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

// Prioritized order for mobile homescreen
const MOBILE_MODULES = [
  "Finances",
  "Habits",
  "Journal",
  "Goals",
  "Health",
  "Email",
  "Learning",
  "Investments",
  "Travel",
  "Creative",
  "Reading",
  "People",
  "Blueprint",
];

export default function DashboardHome() {
  const [brief, setBrief] = useState<DashboardBrief | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/brief")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBrief(data))
      .catch(() => setBrief(null));
  }, []);

  const cards = buildCards(brief);

  // Build mobile tiles from MODULES (skip Home)
  const mobileTiles = MOBILE_MODULES.map((label) =>
    MODULES.find((m) => m.label === label)
  ).filter(Boolean) as typeof MODULES;

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
        <p className="text-sumi-gray-light text-sm mt-1 hidden md:block">
          Here&apos;s your day at a glance.
        </p>
      </motion.div>

      {/* Mobile: App homescreen grid */}
      <div className="md:hidden grid grid-cols-3 gap-4">
        {mobileTiles.map((mod, i) => (
          <motion.div
            key={mod.href}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.05 + i * 0.03,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link
              href={mod.href}
              className="flex flex-col items-center gap-2 py-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-parchment-warm/60 border border-sumi-gray/15 flex items-center justify-center group-active:scale-95 transition-transform duration-150">
                <span className="text-xl font-serif text-ink-black/70 group-hover:text-vermillion transition-colors">
                  {mod.icon}
                </span>
              </div>
              <span className="text-[11px] text-sumi-gray-light tracking-wide text-center">
                {mod.label}
              </span>
            </Link>
          </motion.div>
        ))}

        {/* Kemi special tile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.05 + mobileTiles.length * 0.03,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <button
            onClick={() => {
              // Trigger Kemi chat open via custom event
              window.dispatchEvent(new CustomEvent("open-kemi"));
            }}
            className="flex flex-col items-center gap-2 py-3 w-full group"
          >
            <div className="w-14 h-14 rounded-2xl bg-vermillion/8 border border-vermillion/20 flex items-center justify-center group-active:scale-95 transition-transform duration-150">
              <span className="text-xl font-serif text-vermillion">K</span>
            </div>
            <span className="text-[11px] text-vermillion/70 tracking-wide text-center">
              Kemi
            </span>
          </button>
        </motion.div>
      </div>

      {/* Desktop: Brief cards */}
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-3">
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
