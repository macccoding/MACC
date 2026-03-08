"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─────────────────────────────────────────────────────── */

type Allocation = {
  id: string;
  category: string;
  amount: number;
  percentage: number | null;
  effectiveFrom: string;
};

type SpendingRow = {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
};

type Runway = {
  daysLeft: number;
  totalRemaining: number;
  dailyAllowable: number;
};

type BudgetOverview = {
  allocations: Allocation[];
  spending: SpendingRow[];
  runway: Runway;
  totalAllocated: number;
  totalSpent: number;
};

type ScoreBreakdown = {
  adherence: number;
  savings: number;
  consistency: number;
};

type ScoreData = {
  score: number;
  breakdown: ScoreBreakdown;
};

type TabKey = "overview" | "setup";

type SetupRow = {
  category: string;
  percentage: number;
};

/* ─── Constants ─────────────────────────────────────────────────── */

const ease = [0.22, 1, 0.36, 1] as const;

const DEFAULT_CATEGORIES: SetupRow[] = [
  { category: "Housing", percentage: 30 },
  { category: "Food", percentage: 15 },
  { category: "Transport", percentage: 10 },
  { category: "Entertainment", percentage: 10 },
  { category: "Savings", percentage: 20 },
  { category: "Other", percentage: 15 },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "setup", label: "Setup" },
];

/* ─── Helpers ───────────────────────────────────────────────────── */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-vermillion";
  if (score >= 40) return "text-gold-seal";
  return "text-red-400";
}

function scoreStroke(score: number): string {
  if (score >= 70) return "stroke-vermillion";
  if (score >= 40) return "stroke-gold-seal";
  return "stroke-red-400";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Budget Master";
  if (score >= 40) return "Budget Conscious";
  return "Budget Rookie";
}

function barFillColor(percentUsed: number): string {
  if (percentUsed > 100) return "bg-red-400";
  if (percentUsed >= 80) return "bg-gold-seal";
  return "bg-vermillion/60";
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function BudgetPage() {
  /* --- Data state --- */
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingScore, setRefreshingScore] = useState(false);

  /* --- Tab state --- */
  const [tab, setTab] = useState<TabKey>("overview");

  /* --- Setup state --- */
  const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
  const [rows, setRows] = useState<SetupRow[]>(DEFAULT_CATEGORIES);
  const [saving, setSaving] = useState(false);

  /* ── Fetch overview ── */
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/budget");
      if (res.ok) {
        const data: BudgetOverview = await res.json();
        setOverview(data);
        return data;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  /* ── Fetch score ── */
  const fetchScore = useCallback(async () => {
    try {
      const res = await fetch("/api/budget/score");
      if (res.ok) {
        const data: ScoreData = await res.json();
        setScoreData(data);
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Refresh score (POST) ── */
  async function refreshScore() {
    setRefreshingScore(true);
    try {
      const res = await fetch("/api/budget/score", { method: "POST" });
      if (res.ok) {
        const data: ScoreData = await res.json();
        setScoreData(data);
      }
    } catch {
      /* ignore */
    } finally {
      setRefreshingScore(false);
    }
  }

  /* ── Init ── */
  useEffect(() => {
    async function init() {
      setLoading(true);
      const [data] = await Promise.all([fetchOverview(), fetchScore()]);
      // Auto-show Setup if no allocations
      if (!data || data.allocations.length === 0) {
        setTab("setup");
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Setup: update row ── */
  function updateRow(index: number, field: "category" | "percentage", value: string | number) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, [field]: field === "percentage" ? Number(value) : value }
          : r
      )
    );
  }

  /* ── Setup: add row ── */
  function addRow() {
    setRows((prev) => [...prev, { category: "", percentage: 0 }]);
  }

  /* ── Setup: remove row ── */
  function removeRow(index: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  /* ── Setup: save allocations ── */
  async function saveAllocations() {
    const valid = rows.filter((r) => r.category.trim());
    if (valid.length === 0) return;
    setSaving(true);
    try {
      const allocations = valid.map((r) => ({
        category: r.category.trim(),
        amount: Math.round((monthlyIncome * r.percentage) / 100),
        percentage: r.percentage,
      }));
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      if (res.ok) {
        setTab("overview");
        await Promise.all([fetchOverview(), fetchScore()]);
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  /* ── Insight cards data ── */
  function getInsights(): { text: string; border: string }[] {
    if (!overview) return [];
    const insights: { text: string; border: string }[] = [];

    // Over-budget categories
    for (const s of overview.spending) {
      if (s.percentUsed > 100) {
        const overBy = Math.round(s.spent - s.allocated);
        insights.push({
          text: `Over on ${s.category} by ${formatCurrency(overBy)}`,
          border: "border-vermillion/40",
        });
      }
    }

    // Under budget
    if (
      overview.totalAllocated > 0 &&
      overview.totalSpent < overview.totalAllocated * 0.8
    ) {
      const pctUnder = Math.round(
        ((overview.totalAllocated - overview.totalSpent) / overview.totalAllocated) * 100
      );
      insights.push({
        text: `On track \u2014 ${pctUnder}% under budget`,
        border: "border-emerald-400/40",
      });
    }

    // Top spend
    if (overview.spending.length > 0) {
      const top = [...overview.spending].sort((a, b) => b.spent - a.spent)[0];
      if (top.spent > 0) {
        insights.push({
          text: `Top spend: ${top.category} at ${formatCurrency(top.spent)}`,
          border: "border-gold-seal/40",
        });
      }
    }

    return insights;
  }

  /* ── Score ring SVG props ── */
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const score = scoreData?.score ?? 0;
  const dashOffset = circumference - (score / 100) * circumference;

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Budget
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Allocate. Track. Master your money.
        </p>
      </motion.div>

      {/* ── Tab Switcher ── */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full font-mono tracking-[0.04em] transition-all duration-300 ${
              tab === t.key
                ? "bg-vermillion/15 border border-vermillion/30 text-vermillion"
                : "border border-sumi-gray/20 text-sumi-gray-light hover:border-sumi-gray/30"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sumi-gray-light text-sm py-12 text-center"
        >
          Loading...
        </motion.div>
      ) : tab === "overview" ? (
        <>
          {/* ── Health Score Ring ── */}
          <motion.div
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-6 flex flex-col items-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
          >
            <div className="relative">
              <svg
                width={2 * (radius + strokeWidth)}
                height={2 * (radius + strokeWidth)}
                viewBox={`0 0 ${2 * (radius + strokeWidth)} ${2 * (radius + strokeWidth)}`}
              >
                {/* Background track */}
                <circle
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  fill="none"
                  className="stroke-sumi-gray/20"
                  strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <motion.circle
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  fill="none"
                  className={scoreStroke(score)}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1, ease }}
                  transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
                />
              </svg>
              {/* Center score number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-light ${scoreColor(score)}`}>
                  {score}
                </span>
              </div>
            </div>

            {/* Level label */}
            <span
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mt-2"
              style={{ fontSize: "var(--text-micro)" }}
            >
              {scoreLabel(score)}
            </span>

            {/* Breakdown pills */}
            {scoreData?.breakdown && (
              <div className="flex gap-2 mt-3 flex-wrap justify-center">
                {(
                  [
                    ["Adherence", scoreData.breakdown.adherence],
                    ["Savings", scoreData.breakdown.savings],
                    ["Consistency", scoreData.breakdown.consistency],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <span
                    key={label}
                    className="bg-sumi-gray/10 text-sumi-gray rounded-full px-3 py-1 font-mono"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {label}: {val}
                  </span>
                ))}
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={refreshScore}
              disabled={refreshingScore}
              className="mt-4 bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-50"
              style={{ fontSize: "var(--text-micro)" }}
            >
              {refreshingScore ? "Refreshing..." : "Refresh Score"}
            </button>
          </motion.div>

          {/* ── Runway Card ── */}
          {overview && (
            <motion.div
              className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-6 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease }}
            >
              <span
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Monthly Runway
              </span>
              <p className="text-4xl font-light text-ink-black mt-2">
                {overview.runway.daysLeft}
                <span className="text-lg text-sumi-gray-light ml-1">days</span>
              </p>
              <p className="text-sumi-gray-light text-sm mt-1">
                {formatCurrency(overview.runway.dailyAllowable)}/day remaining
              </p>
            </motion.div>
          )}

          {/* ── Allocation Bars ── */}
          {overview && overview.spending.length > 0 && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease }}
            >
              <h2
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Allocations
              </h2>
              {overview.spending.map((s, i) => {
                const pct = Math.min(s.percentUsed, 100);
                return (
                  <motion.div
                    key={s.category}
                    className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.25 + i * 0.04,
                      duration: 0.4,
                      ease,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-ink-black capitalize">
                        {s.category}
                      </span>
                      <span
                        className="font-mono text-sumi-gray-light"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {formatCurrency(s.spent)} / {formatCurrency(s.allocated)}
                      </span>
                    </div>
                    <div className="h-2 bg-sumi-gray/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barFillColor(s.percentUsed)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          delay: 0.3 + i * 0.04,
                          duration: 0.6,
                          ease,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── Insight Cards ── */}
          {overview && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease }}
            >
              {getInsights().map((insight, i) => (
                <motion.div
                  key={i}
                  className={`bg-parchment-warm/40 border ${insight.border} rounded-xl p-4`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.4 + i * 0.06,
                    duration: 0.4,
                    ease,
                  }}
                >
                  <p className="text-sm text-ink-black">{insight.text}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {overview && overview.allocations.length === 0 && (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease }}
            >
              <p className="text-sumi-gray-light text-sm">
                No allocations yet. Switch to Setup to create your budget.
              </p>
            </motion.div>
          )}
        </>
      ) : (
        /* ── Setup Tab ── */
        <motion.div
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 space-y-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
        >
          {/* Monthly income */}
          <div>
            <label
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-2"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Monthly Income
            </label>
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) =>
                setMonthlyIncome(Math.max(0, Number(e.target.value)))
              }
              className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
              style={{ fontSize: "var(--text-body)" }}
              min={0}
              step={100}
            />
          </div>

          {/* Category rows */}
          <div className="space-y-4">
            <span
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Categories
            </span>

            {rows.map((row, i) => {
              const computed = Math.round(
                (monthlyIncome * row.percentage) / 100
              );
              return (
                <motion.div
                  key={i}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3, ease }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) =>
                        updateRow(i, "category", e.target.value)
                      }
                      placeholder="Category name"
                      className="flex-1 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
                      style={{ fontSize: "var(--text-body)" }}
                    />
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="text-sumi-gray-light hover:text-vermillion transition-colors shrink-0 font-mono tracking-[0.08em]"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={row.percentage}
                      onChange={(e) =>
                        updateRow(i, "percentage", Number(e.target.value))
                      }
                      className="flex-1 accent-vermillion"
                    />
                    <span
                      className="font-mono text-sumi-gray w-12 text-right shrink-0"
                      style={{ fontSize: "var(--text-micro)" }}
                    >
                      {row.percentage}%
                    </span>
                    <span
                      className="font-mono text-ink-black w-20 text-right shrink-0"
                      style={{ fontSize: "var(--text-small)" }}
                    >
                      {formatCurrency(computed)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Add Category */}
          <button
            onClick={addRow}
            className="border border-sumi-gray/20 text-sumi-gray-light rounded-xl px-4 py-2 font-mono tracking-[0.08em] hover:border-sumi-gray/30 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            + Add Category
          </button>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={saveAllocations}
              disabled={saving || rows.every((r) => !r.category.trim())}
              className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-50"
              style={{ fontSize: "var(--text-micro)" }}
            >
              {saving ? "Saving..." : "Save Allocations"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
