"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoodCheckIn } from "@/components/dashboard/MoodCheckIn";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface BriefData {
  habits: { completed: number; total: number };
  goals: { active: number; overdue: number };
  health: { steps: number | null; sleep: number | null };
  portfolio: { totalValue: number; positions: number };
  finances: { netWorth: number | null; debt: number | null };
  email: { unread: number; actionNeeded: number };
  captures: { pending: number };
  learning: { trackName: string | null; progress: number | null };
  reading: { currentlyReading: string | null; queued: number };
  journal: { writtenToday: boolean };
  travel: { planning: number };
  people: { overdueReachouts: number };
  creative: { inProgress: number };
  blueprint: { active: number };
}

const MODULES: {
  key: string;
  label: string;
  href: string;
  icon: string;
  render: (d: BriefData) => string;
}[] = [
  {
    key: "habits",
    label: "Habits",
    href: "/dashboard/habits",
    icon: "習",
    render: (d) => `${d.habits.completed}/${d.habits.total} today`,
  },
  {
    key: "goals",
    label: "Goals",
    href: "/dashboard/goals",
    icon: "的",
    render: (d) =>
      `${d.goals.active} active${d.goals.overdue > 0 ? `, ${d.goals.overdue} overdue` : ""}`,
  },
  {
    key: "health",
    label: "Health",
    href: "/dashboard/health",
    icon: "体",
    render: (d) =>
      `${d.health.steps?.toLocaleString() ?? "—"} steps, ${d.health.sleep ?? "—"}h sleep`,
  },
  {
    key: "portfolio",
    label: "Portfolio",
    href: "/dashboard/investments",
    icon: "株",
    render: (d) =>
      `$${d.portfolio.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
  },
  {
    key: "finances",
    label: "Finances",
    href: "/dashboard/finances",
    icon: "金",
    render: (d) =>
      d.finances.netWorth !== null
        ? `NW $${d.finances.netWorth.toLocaleString()}`
        : "No data yet",
  },
  {
    key: "email",
    label: "Email",
    href: "/dashboard/email",
    icon: "信",
    render: (d) =>
      `${d.email.unread} unread${d.email.actionNeeded > 0 ? `, ${d.email.actionNeeded} action` : ""}`,
  },
  {
    key: "captures",
    label: "Captures",
    href: "/dashboard/captures",
    icon: "捕",
    render: (d) => (d.captures.pending > 0 ? `${d.captures.pending} pending` : "All clear"),
  },
  {
    key: "learning",
    label: "Learning",
    href: "/dashboard/learning",
    icon: "学",
    render: (d) =>
      d.learning.trackName
        ? `${d.learning.trackName} — ${Math.round(d.learning.progress ?? 0)}%`
        : "No active tracks",
  },
  {
    key: "reading",
    label: "Reading",
    href: "/dashboard/reading",
    icon: "読",
    render: (d) => d.reading.currentlyReading ?? `${d.reading.queued} queued`,
  },
  {
    key: "journal",
    label: "Journal",
    href: "/dashboard/journal",
    icon: "記",
    render: (d) => (d.journal.writtenToday ? "Written today" : "Not yet"),
  },
  {
    key: "travel",
    label: "Travel",
    href: "/dashboard/travel",
    icon: "旅",
    render: (d) => (d.travel.planning > 0 ? `${d.travel.planning} planning` : "No plans"),
  },
  {
    key: "people",
    label: "People",
    href: "/dashboard/people",
    icon: "人",
    render: (d) =>
      d.people.overdueReachouts > 0
        ? `${d.people.overdueReachouts} overdue`
        : "All caught up",
  },
  {
    key: "creative",
    label: "Creative",
    href: "/dashboard/creative",
    icon: "芸",
    render: (d) =>
      d.creative.inProgress > 0 ? `${d.creative.inProgress} in progress` : "No projects",
  },
  {
    key: "blueprint",
    label: "Blueprint",
    href: "/dashboard/blueprint",
    icon: "図",
    render: (d) => (d.blueprint.active > 0 ? `${d.blueprint.active} active` : "None"),
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [hasMoodToday, setHasMoodToday] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/brief")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBrief(data))
      .catch(() => setBrief(null));

    fetch("/api/kemi/briefing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setBriefing(data?.briefing ?? null);
        setBriefingLoading(false);
      })
      .catch(() => {
        setBriefing(null);
        setBriefingLoading(false);
      });

    // Check mood today
    const today = new Date().toISOString().split("T")[0];
    fetch("/api/mood?days=1")
      .then((r) => r.json())
      .then((entries: any[]) => {
        const todayEntry = entries.find((e: any) => e.createdAt?.startsWith(today));
        setHasMoodToday(!!todayEntry);
      })
      .catch(() => {});

    // Load insights
    fetch("/api/insights")
      .then((r) => r.json())
      .then((data: any[]) => setInsights(data?.slice(0, 3) || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Greeting */}
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

      {/* Kemi Briefing Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-parchment-warm/40 border border-vermillion/20 rounded-xl p-5"
      >
        <button
          onClick={() => setBriefingOpen(!briefingOpen)}
          className="flex items-center gap-2.5 w-full text-left"
        >
          <span className="text-vermillion font-serif text-lg">恵</span>
          <span
            className="font-mono tracking-[0.12em] uppercase text-vermillion/60"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Kemi&apos;s Briefing
          </span>
          <span className="ml-auto text-sumi-gray-light text-xs">
            {briefingOpen ? "▲" : "▼"}
          </span>
        </button>

        {briefingOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3"
          >
            {briefingLoading ? (
              <p className="text-sumi-gray-light text-sm italic">
                Generating your briefing...
              </p>
            ) : briefing ? (
              <p className="text-ink-black/80 text-sm leading-relaxed whitespace-pre-line">
                {briefing}
              </p>
            ) : (
              <p className="text-sumi-gray-light text-sm italic">
                Could not load briefing.
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Mood Check-in (if not done today) */}
      {!hasMoodToday && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <MoodCheckIn compact onComplete={() => setHasMoodToday(true)} />
        </motion.div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2"
        >
          <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px]">
            Insights
          </p>
          {insights.map((insight: any) => (
            <div
              key={insight.id}
              className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-3 flex items-start gap-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-black/80">{insight.title}</p>
                <p className="text-xs text-sumi-gray-light mt-1">{insight.body}</p>
              </div>
              <button
                onClick={() => {
                  setInsights((prev: any[]) => prev.filter((i: any) => i.id !== insight.id));
                  fetch("/api/insights/dismiss", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: insight.id }),
                  });
                }}
                className="text-sumi-gray-light hover:text-ink-black shrink-0 mt-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Module Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {MODULES.map((mod, i) => (
          <motion.div
            key={mod.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2 + i * 0.03,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link
              href={mod.href}
              className="block bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/30 transition-colors duration-300 h-full"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-serif text-ink-black/60">
                  {mod.icon}
                </span>
                <span
                  className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  {mod.label}
                </span>
              </div>
              <p className="text-ink-black/80 text-sm leading-relaxed">
                {brief ? mod.render(brief) : "—"}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
