"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
};

function parseData(data: Record<string, unknown> | null | undefined): ParsedData {
  return {
    distance: typeof data?.distance === "number" ? data.distance : null,
    exerciseMinutes: typeof data?.exerciseMinutes === "number" ? data.exerciseMinutes : null,
    standHours: typeof data?.standHours === "number" ? data.standHours : null,
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

type MetricDef = {
  key: string;
  label: string;
  format: (v: number | null | undefined) => string;
  color: string;
  barColor: string;
  getValue: (s: HealthSnapshot) => number | null;
};

export default function HealthPage() {
  const [snapshots, setSnapshots] = useState<HealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    steps: "",
    calories: "",
    heartRate: "",
    sleep: "",
  });

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        date: new Date().toISOString(),
      };
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
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save health data:", err);
    } finally {
      setSaving(false);
    }
  }

  // Today's snapshot
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = snapshots.find((s) => s.date.slice(0, 10) === todayStr);
  const todayData = parseData(today?.data);

  // Last synced: most recent snapshot's createdAt
  const lastSynced = snapshots.length > 0 ? snapshots[0] : null;

  // Last 7 days for mini charts (most recent 7, reversed to chronological)
  const last7 = snapshots.slice(0, 7).reverse();

  const metrics: MetricDef[] = [
    {
      key: "steps",
      label: "Steps",
      format: fmt,
      color: "text-vermillion",
      barColor: "bg-vermillion",
      getValue: (s) => s.steps,
    },
    {
      key: "calories",
      label: "Calories",
      format: fmt,
      color: "text-ink-black",
      barColor: "bg-ink-black/30",
      getValue: (s) => s.calories,
    },
    {
      key: "heartRate",
      label: "Heart Rate",
      format: (v) => (v != null ? `${v} bpm` : "--"),
      color: "text-ink-black",
      barColor: "bg-ink-black/30",
      getValue: (s) => s.heartRate,
    },
    {
      key: "sleep",
      label: "Sleep",
      format: fmtSleep,
      color: "text-gold-seal",
      barColor: "bg-gold-seal",
      getValue: (s) => s.sleep,
    },
    {
      key: "exerciseMinutes",
      label: "Exercise",
      format: fmtMinutes,
      color: "text-vermillion",
      barColor: "bg-vermillion/60",
      getValue: (s) => parseData(s.data).exerciseMinutes,
    },
    {
      key: "distance",
      label: "Distance",
      format: fmtDistance,
      color: "text-ink-black",
      barColor: "bg-ink-black/20",
      getValue: (s) => parseData(s.data).distance,
    },
    {
      key: "standHours",
      label: "Stand Hours",
      format: fmtHours,
      color: "text-gold-seal",
      barColor: "bg-gold-seal/60",
      getValue: (s) => parseData(s.data).standHours,
    },
  ];

  // Split metrics into primary (top cards) and all (for charts)
  const primaryMetrics = metrics.slice(0, 4);
  const extraMetrics = metrics.slice(4);

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
            No health data yet. Log your first day or connect Health Auto
            Export.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-4 bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Log today
          </button>
        </motion.div>
      ) : (
        <>
          {/* Last Synced Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.4, ease }}
            className="flex items-center gap-2"
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                today ? "bg-green-500" : "bg-sumi-gray/40"
              }`}
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

          {/* Today's Metrics — Primary stat cards */}
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
                <span
                  className={`text-2xl md:text-3xl font-light ${m.color}`}
                >
                  {m.format(m.getValue(today as HealthSnapshot))}
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

          {/* Extra Metrics — Exercise, Distance, Stand Hours */}
          {(todayData.exerciseMinutes != null || todayData.distance != null || todayData.standHours != null) && (
            <motion.div
              className="grid grid-cols-3 gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease }}
            >
              {extraMetrics.map((m) => (
                <div
                  key={m.key}
                  className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1"
                >
                  <span
                    className={`text-xl md:text-2xl font-light ${m.color}`}
                  >
                    {m.format(m.getValue(today as HealthSnapshot))}
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
              {metrics.map((m) => {
                const values = last7.map(
                  (s) => m.getValue(s)
                );
                const nums = values.filter((v): v is number => v != null);
                // Skip chart row entirely if no data at all for this metric
                if (nums.length === 0) return null;
                const min = Math.min(...nums);
                const max = Math.max(...nums);
                const range = max - min || 1;

                return (
                  <div
                    key={m.key}
                    className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
                  >
                    <span
                      className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-3"
                      style={{ fontSize: "var(--text-micro)" }}
                    >
                      {m.label}
                    </span>
                    <div className="flex items-end gap-1.5 h-12">
                      {values.map((v, i) => {
                        const pct =
                          v != null
                            ? Math.max(
                                0.1,
                                (v - min) / range
                              )
                            : 0;
                        return (
                          <div
                            key={i}
                            className="flex-1 flex items-end"
                          >
                            <div
                              className={`w-full rounded-sm transition-all duration-300 ${
                                v != null
                                  ? m.barColor
                                  : "bg-sumi-gray/20"
                              }`}
                              style={{
                                height:
                                  v != null
                                    ? `${Math.round(pct * 100)}%`
                                    : "10%",
                              }}
                            />
                          </div>
                        );
                      })}
                      {/* Pad to 7 if fewer than 7 days */}
                      {Array.from({
                        length: Math.max(0, 7 - values.length),
                      }).map((_, i) => (
                        <div key={`pad-${i}`} className="flex-1 flex items-end">
                          <div
                            className="w-full rounded-sm bg-sumi-gray/20"
                            style={{ height: "10%" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}

      {/* Log Today Button + Manual Entry Form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease }}
      >
        {!formOpen && snapshots.length > 0 && (
          <button
            onClick={() => setFormOpen(true)}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Log today
          </button>
        )}

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
                  {[
                    { key: "steps", label: "Steps", placeholder: "e.g. 8000" },
                    {
                      key: "calories",
                      label: "Calories",
                      placeholder: "e.g. 2200",
                    },
                    {
                      key: "heartRate",
                      label: "Heart Rate (bpm)",
                      placeholder: "e.g. 72",
                    },
                    {
                      key: "sleep",
                      label: "Sleep (hours)",
                      placeholder: "e.g. 7.5",
                    },
                  ].map((field) => (
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
                        value={form[field.key as keyof typeof form]}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
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
      </motion.div>
    </div>
  );
}
