"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoodCheckIn } from "@/components/dashboard/MoodCheckIn";

/* ─── Types ─────────────────────────────────────────────────────── */

type HealthSnapshot = {
  id: string;
  date: string;
  steps: number | null;
  calories: number | null;
  heartRate: number | null;
  sleep: number | null;
  data: Record<string, unknown>;
  createdAt?: string;
};

type ParsedData = {
  distance: number | null;
  exerciseMinutes: number | null;
  standHours: number | null;
  weight: number | null;
  bodyFat: number | null;
  bmi: number | null;
  sleepQuality: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  caloriesConsumed: number | null;
};

type TabKey = "overview" | "sleep" | "nutrition" | "body" | "mood";

type MetricDef = {
  key: string;
  label: string;
  format: (v: number | null | undefined) => string;
  color: string;
  barColor: string;
  getValue: (s: HealthSnapshot) => number | null;
};

/* ─── Helpers ───────────────────────────────────────────────────── */

function parseData(data: Record<string, unknown> | null | undefined): ParsedData {
  return {
    distance: typeof data?.distance === "number" ? data.distance : null,
    exerciseMinutes: typeof data?.exerciseMinutes === "number" ? data.exerciseMinutes : null,
    standHours: typeof data?.standHours === "number" ? data.standHours : null,
    weight: typeof data?.weight === "number" ? data.weight : null,
    bodyFat: typeof data?.bodyFat === "number" ? data.bodyFat : null,
    bmi: typeof data?.bmi === "number" ? data.bmi : null,
    sleepQuality: typeof data?.sleepQuality === "number" ? data.sleepQuality : null,
    protein: typeof data?.protein === "number" ? data.protein : null,
    carbs: typeof data?.carbs === "number" ? data.carbs : null,
    fat: typeof data?.fat === "number" ? data.fat : null,
    caloriesConsumed: typeof data?.caloriesConsumed === "number" ? data.caloriesConsumed : null,
  };
}

const ease = [0.22, 1, 0.36, 1] as const;

function fmt(n: number | null | undefined): string {
  if (n == null) return "--";
  return n.toLocaleString();
}

function fmtSleep(hours: number | null | undefined): string {
  if (hours == null) return "--";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function fmtDistance(km: number | null | undefined): string {
  if (km == null) return "--";
  return `${km.toFixed(1)} km`;
}

function fmtMinutes(mins: number | null | undefined): string {
  if (mins == null) return "--";
  return `${Math.round(mins)} min`;
}

function fmtHours(hrs: number | null | undefined): string {
  if (hrs == null) return "--";
  return `${Math.round(hrs)} hr`;
}

function fmtWeight(lbs: number | null | undefined): string {
  if (lbs == null) return "--";
  return `${lbs.toFixed(1)} lbs`;
}

function fmtPercent(pct: number | null | undefined): string {
  if (pct == null) return "--";
  return `${pct.toFixed(1)}%`;
}

function fmtDecimal(n: number | null | undefined): string {
  if (n == null) return "--";
  return n.toFixed(1);
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function computeDailyScore(snapshot: HealthSnapshot | undefined): number | null {
  if (!snapshot) return null;
  const parsed = parseData(snapshot.data);
  const components: number[] = [];
  if (snapshot.steps != null) components.push(Math.min(snapshot.steps / 10000, 1));
  if (snapshot.sleep != null) components.push(Math.min(snapshot.sleep / 8, 1));
  if (parsed.exerciseMinutes != null) components.push(Math.min(parsed.exerciseMinutes / 30, 1));
  if (components.length === 0) return null;
  return Math.round((components.reduce((a, b) => a + b, 0) / components.length) * 100);
}

/* ─── Constants ─────────────────────────────────────────────────── */

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "sleep", label: "Sleep" },
  { key: "nutrition", label: "Nutrition" },
  { key: "body", label: "Body" },
  { key: "mood", label: "Mood" },
];

const primaryMetrics: MetricDef[] = [
  { key: "steps", label: "Steps", format: fmt, color: "text-vermillion", barColor: "bg-vermillion", getValue: (s) => s.steps },
  { key: "calories", label: "Calories", format: fmt, color: "text-ink-black", barColor: "bg-ink-black/30", getValue: (s) => s.calories },
  { key: "heartRate", label: "Heart Rate", format: (v) => (v != null ? `${v} bpm` : "--"), color: "text-ink-black", barColor: "bg-ink-black/30", getValue: (s) => s.heartRate },
  { key: "sleep", label: "Sleep", format: fmtSleep, color: "text-gold-seal", barColor: "bg-gold-seal", getValue: (s) => s.sleep },
];

const activityMetrics: MetricDef[] = [
  { key: "exerciseMinutes", label: "Exercise", format: fmtMinutes, color: "text-vermillion", barColor: "bg-vermillion/60", getValue: (s) => parseData(s.data).exerciseMinutes },
  { key: "distance", label: "Distance", format: fmtDistance, color: "text-ink-black", barColor: "bg-ink-black/20", getValue: (s) => parseData(s.data).distance },
  { key: "standHours", label: "Stand Hours", format: fmtHours, color: "text-gold-seal", barColor: "bg-gold-seal/60", getValue: (s) => parseData(s.data).standHours },
];

const bodyMetrics: MetricDef[] = [
  { key: "weight", label: "Weight", format: fmtWeight, color: "text-vermillion", barColor: "bg-vermillion/50", getValue: (s) => parseData(s.data).weight },
  { key: "bodyFat", label: "Body Fat", format: fmtPercent, color: "text-ink-black", barColor: "bg-ink-black/20", getValue: (s) => parseData(s.data).bodyFat },
  { key: "bmi", label: "BMI", format: fmtDecimal, color: "text-gold-seal", barColor: "bg-gold-seal/40", getValue: (s) => parseData(s.data).bmi },
];

const allMetrics: MetricDef[] = [...primaryMetrics, ...activityMetrics, ...bodyMetrics];

/* ─── Mini Chart Component ──────────────────────────────────────── */

function MiniChart({ metric, snapshots }: { metric: MetricDef; snapshots: HealthSnapshot[] }) {
  const values = snapshots.map((s) => metric.getValue(s));
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;

  return (
    <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4">
      <span
        className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-3"
        style={{ fontSize: "var(--text-micro)" }}
      >
        {metric.label}
      </span>
      <div className="flex items-end gap-1.5 h-12">
        {values.map((v, i) => {
          const pct = v != null ? Math.max(0.1, (v - min) / range) : 0;
          return (
            <div key={i} className="flex-1 flex items-end">
              <div
                className={`w-full rounded-sm transition-all duration-300 ${v != null ? metric.barColor : "bg-sumi-gray/20"}`}
                style={{ height: v != null ? `${Math.round(pct * 100)}%` : "10%" }}
              />
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, 7 - values.length) }).map((_, i) => (
          <div key={`pad-${i}`} className="flex-1 flex items-end">
            <div className="w-full rounded-sm bg-sumi-gray/20" style={{ height: "10%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Manual Entry Form Component ───────────────────────────────── */

function ManualEntryForm({
  formOpen,
  setFormOpen,
  onSaved,
  focusField,
}: {
  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
  onSaved: () => void;
  focusField?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ steps: "", calories: "", heartRate: "", sleep: "" });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = { date: new Date().toISOString() };
      if (form.steps) body.steps = parseInt(form.steps, 10);
      if (form.calories) body.calories = parseInt(form.calories, 10);
      if (form.heartRate) body.heartRate = parseInt(form.heartRate, 10);
      if (form.sleep) body.sleep = parseFloat(form.sleep);
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setForm({ steps: "", calories: "", heartRate: "", sleep: "" });
        setFormOpen(false);
        onSaved();
      }
    } catch (err) {
      console.error("Failed to save health data:", err);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: "steps", label: "Steps", placeholder: "e.g. 8000" },
    { key: "calories", label: "Calories", placeholder: "e.g. 2200" },
    { key: "heartRate", label: "Heart Rate (bpm)", placeholder: "e.g. 72" },
    { key: "sleep", label: "Sleep (hours)", placeholder: "e.g. 7.5" },
  ];

  return (
    <AnimatePresence>
      {formOpen && (
        <motion.form
          onSubmit={handleSave}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease }}
          className="overflow-hidden"
        >
          <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5 space-y-4 mt-3">
            <div className="flex items-center justify-between">
              <span
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Manual Entry
              </span>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-sumi-gray-light hover:text-ink-black transition-colors duration-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label
                    className="font-mono tracking-[0.08em] text-sumi-gray block"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="number"
                    step={field.key === "sleep" ? "0.1" : "1"}
                    autoFocus={focusField === field.key}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-parchment-warm/60 border border-sumi-gray/20 rounded-lg px-3 py-2 text-ink-black placeholder:text-sumi-gray-light/40 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
                    style={{ fontSize: "var(--text-body)" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontSize: "var(--text-micro)" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="bg-parchment-warm/20 border border-sumi-gray/20 text-sumi-gray-light rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:border-sumi-gray/20 hover:text-sumi-gray transition-all duration-300"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

/* ─── Overview Tab ──────────────────────────────────────────────── */

function OverviewTab({
  today,
  todayData,
  lastSynced,
  last7,
  formOpen,
  setFormOpen,
  fetchData,
  hasData,
}: {
  today: HealthSnapshot | undefined;
  todayData: ParsedData;
  lastSynced: HealthSnapshot | null;
  last7: HealthSnapshot[];
  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
  fetchData: () => void;
  hasData: boolean;
}) {
  const dailyScore = computeDailyScore(today);

  return (
    <div className="space-y-6">
      {/* Last Synced Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.4, ease }}
        className="flex items-center gap-2"
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${today ? "bg-green-500" : "bg-sumi-gray/40"}`}
        />
        <span
          className="font-mono tracking-[0.08em] text-sumi-gray-light"
          style={{ fontSize: "var(--text-micro)" }}
        >
          {today
            ? `Last synced ${lastSynced?.createdAt ? relativeTime(lastSynced.createdAt) : "today"}`
            : "Waiting for Health Auto Export..."}
        </span>
      </motion.div>

      {/* Daily Score */}
      {dailyScore != null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease }}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-sumi-gray/15" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5"
                strokeDasharray={`${(dailyScore / 100) * 97.4} 97.4`}
                strokeLinecap="round"
                className={dailyScore >= 70 ? "stroke-vermillion" : dailyScore >= 40 ? "stroke-gold-seal" : "stroke-red-400"}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-light text-ink-black">
              {dailyScore}
            </span>
          </div>
          <div>
            <p className="text-ink-black font-light text-lg">{dailyScore}% Daily Score</p>
            <p className="text-sumi-gray-light text-xs mt-0.5">
              Based on steps, sleep &amp; exercise targets
            </p>
          </div>
        </motion.div>
      )}

      {/* Primary Stat Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
      >
        {primaryMetrics.map((m) => (
          <div
            key={m.key}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1"
          >
            <span className={`text-2xl md:text-3xl font-light ${m.color}`}>
              {m.format(today ? m.getValue(today) : null)}
            </span>
            <span
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
              style={{ fontSize: "var(--text-micro)" }}
            >
              {m.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Activity Metrics */}
      {(todayData.exerciseMinutes != null || todayData.distance != null || todayData.standHours != null) && (
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease }}
        >
          {activityMetrics.map((m) => (
            <div
              key={m.key}
              className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1"
            >
              <span className={`text-xl md:text-2xl font-light ${m.color}`}>
                {m.format(today ? m.getValue(today) : null)}
              </span>
              <span
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                style={{ fontSize: "var(--text-micro)" }}
              >
                {m.label}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* 7-Day Mini Charts */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease }}
      >
        <h2
          className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
          style={{ fontSize: "var(--text-micro)" }}
        >
          7-Day Trend
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allMetrics.map((m) => (
            <MiniChart key={m.key} metric={m} snapshots={last7} />
          ))}
        </div>
      </motion.div>

      {/* Log Today + Manual Entry */}
      <div>
        {!formOpen && hasData && (
          <button
            onClick={() => setFormOpen(true)}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Log today
          </button>
        )}
        <ManualEntryForm formOpen={formOpen} setFormOpen={setFormOpen} onSaved={fetchData} />
      </div>
    </div>
  );
}

/* ─── Sleep Tab ─────────────────────────────────────────────────── */

function SleepTab({
  last7,
  snapshots,
  fetchData,
}: {
  last7: HealthSnapshot[];
  snapshots: HealthSnapshot[];
  fetchData: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const sleepValues = last7.map((s) => ({ date: s.date, sleep: s.sleep, quality: parseData(s.data).sleepQuality }));
  const validSleep = sleepValues.filter((v) => v.sleep != null).map((v) => v.sleep as number);
  const avgSleep = validSleep.length > 0 ? validSleep.reduce((a, b) => a + b, 0) / validSleep.length : null;
  const bestNight = validSleep.length > 0 ? Math.max(...validSleep) : null;
  const worstNight = validSleep.length > 0 ? Math.min(...validSleep) : null;
  const maxSleep = validSleep.length > 0 ? Math.max(...validSleep, 10) : 10;

  // Check if any snapshot has sleepQuality
  const hasSleepQuality = sleepValues.some((v) => v.quality != null);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
          <span className="text-xl md:text-2xl font-light text-gold-seal">
            {avgSleep != null ? fmtSleep(avgSleep) : "--"}
          </span>
          <span className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>
            Avg Sleep
          </span>
        </div>
        <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
          <span className="text-xl md:text-2xl font-light text-vermillion">
            {bestNight != null ? fmtSleep(bestNight) : "--"}
          </span>
          <span className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>
            Best Night
          </span>
        </div>
        <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
          <span className="text-xl md:text-2xl font-light text-ink-black">
            {worstNight != null ? fmtSleep(worstNight) : "--"}
          </span>
          <span className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>
            Worst Night
          </span>
        </div>
      </motion.div>

      {/* Weekly Sleep Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
      >
        <h3
          className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-4"
          style={{ fontSize: "var(--text-micro)" }}
        >
          This Week
        </h3>
        <div className="space-y-2">
          {sleepValues.map((v, i) => {
            const pct = v.sleep != null ? (v.sleep / maxSleep) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-sumi-gray-light w-10 shrink-0 text-right" style={{ fontSize: "var(--text-micro)" }}>
                  {dayLabel(v.date)}
                </span>
                <div className="flex-1 h-6 bg-sumi-gray/10 rounded-md overflow-hidden">
                  <motion.div
                    className="h-full bg-gold-seal rounded-md"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease }}
                  />
                </div>
                <span className="font-mono text-ink-black w-14 shrink-0 text-right" style={{ fontSize: "var(--text-micro)" }}>
                  {v.sleep != null ? fmtSleep(v.sleep) : "--"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Sleep Quality */}
      {hasSleepQuality && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
        >
          <h3
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-3"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Sleep Quality
          </h3>
          <div className="flex items-center gap-4">
            {sleepValues.filter((v) => v.quality != null).slice(-1).map((v, i) => {
              const q = v.quality as number;
              return (
                <div key={i} className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <span key={star} className={star < q ? "text-gold-seal" : "text-sumi-gray/30"}>
                      &#9733;
                    </span>
                  ))}
                  <span className="ml-2 text-sumi-gray-light text-sm">{q}/5</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Log Sleep Button */}
      <div>
        <button
          onClick={() => setFormOpen(true)}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Log Sleep
        </button>
        <ManualEntryForm formOpen={formOpen} setFormOpen={setFormOpen} onSaved={fetchData} focusField="sleep" />
      </div>
    </div>
  );
}

/* ─── Nutrition Tab ─────────────────────────────────────────────── */

function NutritionTab({ last7, snapshots }: { last7: HealthSnapshot[]; snapshots: HealthSnapshot[] }) {
  const todaySnap = last7.length > 0 ? last7[last7.length - 1] : null;
  const todayParsed = todaySnap ? parseData(todaySnap.data) : null;
  const hasNutrition = todayParsed && (todayParsed.caloriesConsumed != null || todayParsed.protein != null);

  if (!hasNutrition) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-8 text-center space-y-4"
      >
        <p className="text-sumi-gray-light text-sm">
          Connect MacroFactor to see nutrition data
        </p>
        <button
          disabled
          className="bg-parchment-warm/20 border border-sumi-gray/20 text-sumi-gray-light rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase cursor-not-allowed opacity-50"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Coming Soon
        </button>
      </motion.div>
    );
  }

  // Macro progress bars
  const macros = [
    { label: "Protein", value: todayParsed!.protein, target: 150, color: "bg-vermillion", unit: "g" },
    { label: "Carbs", value: todayParsed!.carbs, target: 250, color: "bg-gold-seal", unit: "g" },
    { label: "Fat", value: todayParsed!.fat, target: 65, color: "bg-ink-black/40", unit: "g" },
  ];

  // Calorie trend: consumed vs burned (last 7 days)
  const calorieTrend = last7.map((s) => {
    const p = parseData(s.data);
    return {
      date: s.date,
      consumed: p.caloriesConsumed,
      burned: s.calories,
    };
  });

  return (
    <div className="space-y-6">
      {/* Calorie Summary */}
      {todayParsed!.caloriesConsumed != null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <span className="text-2xl font-light text-vermillion">{fmt(todayParsed!.caloriesConsumed)}</span>
            <span className="text-sumi-gray-light text-sm ml-2">consumed</span>
          </div>
          {todaySnap?.calories != null && (
            <div>
              <span className="text-2xl font-light text-ink-black">{fmt(todaySnap.calories)}</span>
              <span className="text-sumi-gray-light text-sm ml-2">burned</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Macro Bars */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5 space-y-4"
      >
        <h3
          className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Macros
        </h3>
        {macros.map((m) => {
          if (m.value == null) return null;
          const pct = Math.min((m.value / m.target) * 100, 100);
          return (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-ink-black">{m.label}</span>
                <span className="text-sm text-sumi-gray-light">
                  {Math.round(m.value)}{m.unit} / {m.target}{m.unit}
                </span>
              </div>
              <div className="h-3 bg-sumi-gray/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${m.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.15, duration: 0.5, ease }}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Calorie Trend */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
      >
        <h3
          className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-4"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Calorie Trend (7 Days)
        </h3>
        <div className="space-y-2">
          {calorieTrend.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-mono text-sumi-gray-light w-10 shrink-0 text-right" style={{ fontSize: "var(--text-micro)" }}>
                {dayLabel(d.date)}
              </span>
              <div className="flex-1 space-y-1">
                {d.consumed != null && (
                  <div className="h-3 bg-sumi-gray/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-vermillion/60 rounded-full"
                      style={{ width: `${Math.min((d.consumed / 3000) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {d.burned != null && (
                  <div className="h-3 bg-sumi-gray/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ink-black/25 rounded-full"
                      style={{ width: `${Math.min((d.burned / 3000) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="w-24 shrink-0 text-right">
                <span className="font-mono text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>
                  {d.consumed != null ? fmt(d.consumed) : "--"} / {d.burned != null ? fmt(d.burned) : "--"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-sumi-gray-light">
            <span className="w-3 h-3 rounded-full bg-vermillion/60 inline-block" /> Consumed
          </span>
          <span className="flex items-center gap-1.5 text-xs text-sumi-gray-light">
            <span className="w-3 h-3 rounded-full bg-ink-black/25 inline-block" /> Burned
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Body Tab ──────────────────────────────────────────────────── */

function BodyTab({ snapshots }: { snapshots: HealthSnapshot[] }) {
  // Use up to 14 days of data for body trends
  const bodyData = snapshots.map((s) => ({ date: s.date, ...parseData(s.data) }));
  const hasBody = bodyData.some((d) => d.weight != null || d.bodyFat != null || d.bmi != null);
  const latestBody = bodyData.find((d) => d.weight != null || d.bodyFat != null || d.bmi != null);

  if (!hasBody) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-8 text-center space-y-4"
      >
        <p className="text-sumi-gray-light text-sm">
          Connect RingConn to see body composition data
        </p>
        <button
          disabled
          className="bg-parchment-warm/20 border border-sumi-gray/20 text-sumi-gray-light rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase cursor-not-allowed opacity-50"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Coming Soon
        </button>
      </motion.div>
    );
  }

  // Weight trend (last 14 days with data, reversed to chronological)
  const weightPoints = bodyData
    .filter((d) => d.weight != null)
    .reverse()
    .slice(-14);

  const weights = weightPoints.map((d) => d.weight as number);
  const wMin = weights.length > 0 ? Math.min(...weights) - 2 : 0;
  const wMax = weights.length > 0 ? Math.max(...weights) + 2 : 1;
  const wRange = wMax - wMin || 1;

  // Build SVG line path
  const svgW = 280;
  const svgH = 80;
  const linePath = weightPoints
    .map((d, i) => {
      const x = weightPoints.length === 1 ? svgW / 2 : (i / (weightPoints.length - 1)) * svgW;
      const y = svgH - ((d.weight as number) - wMin) / wRange * svgH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="space-y-6">
      {/* Body Stat Cards */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        {bodyMetrics.map((m) => (
          <div
            key={m.key}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1"
          >
            <span className={`text-xl md:text-2xl font-light ${m.color}`}>
              {latestBody ? m.format(m.getValue({ data: latestBody } as unknown as HealthSnapshot)) : "--"}
            </span>
            <span
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
              style={{ fontSize: "var(--text-micro)" }}
            >
              {m.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Weight Trend Line */}
      {weightPoints.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
        >
          <h3
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-4"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Weight Trend (14 Days)
          </h3>
          <div className="relative">
            <svg viewBox={`-8 -8 ${svgW + 16} ${svgH + 16}`} className="w-full" style={{ maxHeight: 120 }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                <line
                  key={frac}
                  x1={0} y1={svgH * (1 - frac)} x2={svgW} y2={svgH * (1 - frac)}
                  stroke="currentColor" strokeWidth="0.5" className="text-sumi-gray/15"
                />
              ))}
              {/* Line */}
              <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2" className="text-vermillion" strokeLinecap="round" strokeLinejoin="round" />
              {/* Dots */}
              {weightPoints.map((d, i) => {
                const x = weightPoints.length === 1 ? svgW / 2 : (i / (weightPoints.length - 1)) * svgW;
                const y = svgH - ((d.weight as number) - wMin) / wRange * svgH;
                return <circle key={i} cx={x} cy={y} r="3" fill="currentColor" className="text-vermillion" />;
              })}
            </svg>
            {/* Labels */}
            <div className="flex justify-between mt-1">
              <span className="font-mono text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>
                {weightPoints.length > 0 ? dayLabel(weightPoints[0].date) : ""}
              </span>
              <span className="font-mono text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>
                {wMin.toFixed(0)} - {wMax.toFixed(0)} lbs
              </span>
              <span className="font-mono text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>
                {weightPoints.length > 1 ? dayLabel(weightPoints[weightPoints.length - 1].date) : ""}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Mood Tab ─────────────────────────────────────────────────── */

/* eslint-disable @typescript-eslint/no-explicit-any */

const MOOD_LABELS = ["", "怒", "憂", "平", "楽", "喜"];
const MOOD_COLORS = ["", "#ef4444", "#f97316", "#a3a3a3", "#22c55e", "#3b82f6"];

function MoodTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mood?days=30")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sumi-gray-light text-sm py-4">Loading mood data...</p>;
  }

  const avgMood = entries.length > 0
    ? entries.reduce((s: number, e: any) => s + e.mood, 0) / entries.length
    : 0;
  const avgEnergy = entries.length > 0
    ? entries.reduce((s: number, e: any) => s + e.energy, 0) / entries.length
    : 0;

  return (
    <div className="space-y-4">
      <MoodCheckIn onComplete={() => {
        fetch("/api/mood?days=30")
          .then((r) => r.json())
          .then(setEntries)
          .catch(() => {});
      }} />

      {entries.length > 0 && (
        <>
          {/* Averages */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 text-center">
              <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px]">Avg Mood (30d)</p>
              <p className="text-2xl font-light text-ink-black mt-1">{avgMood.toFixed(1)}/5</p>
            </div>
            <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 text-center">
              <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px]">Avg Energy (30d)</p>
              <p className="text-2xl font-light text-ink-black mt-1">{avgEnergy.toFixed(1)}/5</p>
            </div>
          </div>

          {/* Dot Chart */}
          <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4">
            <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px] mb-3">
              Mood History
            </p>
            <div className="flex gap-1 items-end h-24">
              {entries.slice(0, 30).reverse().map((e: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: MOOD_COLORS[e.mood] || "#a3a3a3" }}
                    title={`${e.createdAt?.split("T")[0]}: ${MOOD_LABELS[e.mood]} (${e.mood}/5)`}
                  />
                  <div
                    className="w-1.5 rounded-full bg-vermillion/30"
                    style={{ height: `${(e.energy / 5) * 60}px` }}
                    title={`Energy: ${e.energy}/5`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-sumi-gray-light font-mono">30d ago</span>
              <span className="text-[9px] text-sumi-gray-light font-mono">Today</span>
            </div>
          </div>

          {/* Recent entries */}
          <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4">
            <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px] mb-3">
              Recent Entries
            </p>
            <div className="space-y-2">
              {entries.slice(0, 7).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-sumi-gray/10 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{MOOD_LABELS[e.mood]}</span>
                    <div>
                      <p className="text-sm text-ink-black/80">
                        Mood {e.mood}/5 · Energy {e.energy}/5
                      </p>
                      <p className="text-xs text-sumi-gray-light">
                        {new Date(e.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  {e.note && (
                    <p className="text-xs text-sumi-gray-light max-w-[140px] truncate">{e.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function HealthPage() {
  const [snapshots, setSnapshots] = useState<HealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");
  const [formOpen, setFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health?days=14");
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error("Failed to fetch health data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Today's snapshot
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = snapshots.find((s) => s.date.slice(0, 10) === todayStr);
  const todayData = parseData(today?.data);

  // Last synced
  const lastSynced = snapshots.length > 0 ? snapshots[0] : null;

  // Last 7 days for charts (most recent 7, reversed to chronological)
  const last7 = snapshots.slice(0, 7).reverse();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Health
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Body is the vehicle. Maintain it.
        </p>
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sumi-gray-light text-sm py-12 text-center"
        >
          Loading...
        </motion.div>
      ) : snapshots.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-8 text-center"
        >
          <p className="text-sumi-gray-light text-sm">
            No health data yet. Log your first day or connect Health Auto Export.
          </p>
          <button
            onClick={() => {
              setTab("overview");
              setFormOpen(true);
            }}
            className="mt-4 bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Log today
          </button>
        </motion.div>
      ) : (
        <>
          {/* Tab Switcher */}
          <motion.div
            className="flex gap-6 border-b border-sumi-gray/15 pb-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5, ease }}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative pb-3 font-mono tracking-[0.12em] uppercase transition-colors duration-300 ${
                  tab === t.key ? "text-vermillion" : "text-sumi-gray-light hover:text-sumi-gray"
                }`}
                style={{ fontSize: "var(--text-micro)" }}
              >
                {t.label}
                {tab === t.key && (
                  <motion.div
                    layoutId="health-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-vermillion rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
            >
              {tab === "overview" && (
                <OverviewTab
                  today={today}
                  todayData={todayData}
                  lastSynced={lastSynced}
                  last7={last7}
                  formOpen={formOpen}
                  setFormOpen={setFormOpen}
                  fetchData={fetchData}
                  hasData={snapshots.length > 0}
                />
              )}
              {tab === "sleep" && (
                <SleepTab last7={last7} snapshots={snapshots} fetchData={fetchData} />
              )}
              {tab === "nutrition" && (
                <NutritionTab last7={last7} snapshots={snapshots} />
              )}
              {tab === "body" && <BodyTab snapshots={snapshots} />}
              {tab === "mood" && <MoodTab />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
