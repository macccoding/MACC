"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

const NATIONALS_DATE = new Date("2026-11-01T00:00:00");

const inputClass =
  "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] placeholder:text-[var(--parchment-dim)] focus:border-[var(--vermillion)] focus:outline-none";

type Phase = {
  id: string;
  name: string;
  startMonth: string;
  endMonth: string;
  focusAreas: unknown;
  targets: unknown;
  reviewNotes?: string | null;
};

function daysRemaining(): number {
  return Math.max(0, Math.floor((NATIONALS_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function isActive(phase: Phase): boolean {
  const now = new Date();
  const start = new Date(phase.startMonth);
  const end = new Date(phase.endMonth);
  return now >= start && now <= end;
}

function isPast(phase: Phase): boolean {
  const end = new Date(phase.endMonth);
  return new Date() > end;
}

function formatMonthRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sm = s.toLocaleDateString("en-US", { month: "long" });
  const em = e.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return `${sm} — ${em}`;
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === "string");
  return [];
}

export default function PlanPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/tt/periods");
        if (res.ok) setPhases(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  function openReview(phase: Phase) {
    setReviewingId(phase.id);
    setReviewText(phase.reviewNotes ?? "");
  }

  function cancelReview() {
    setReviewingId(null);
    setReviewText("");
  }

  async function saveReview(id: string) {
    setSavingId(id);
    try {
      const res = await fetch("/api/tt/periods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reviewNotes: reviewText.trim() || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhases((prev) => prev.map((p) => (p.id === id ? updated : p)));
        setReviewingId(null);
        setReviewText("");
      }
    } catch { /* ignore */ }
    setSavingId(null);
  }

  const days = daysRemaining();

  return (
    <div className="max-w-2xl space-y-6">
      <motion.div
        className="flex items-end justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...ease] }}
      >
        <div>
          <h1 className="font-mono text-2xl font-light" style={{ color: "var(--parchment)" }}>
            道 — Road to Nationals
          </h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-light tabular-nums" style={{ color: "var(--vermillion-glow)" }}>
            {days}
          </p>
          <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
            days remaining
          </p>
        </div>
      </motion.div>

      {loading ? (
        <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>Loading...</p>
      ) : phases.length === 0 ? (
        <p className="font-mono text-sm py-8 text-center" style={{ color: "var(--parchment-dim)" }}>
          No phases defined yet.
        </p>
      ) : (
        <div className="space-y-4">
          {phases.map((phase, i) => {
            const active = isActive(phase);
            const past = isPast(phase);
            const focusAreas = toStringArray(phase.focusAreas);
            const targets = toStringArray(phase.targets);
            const showReview = past || active;
            const isReviewing = reviewingId === phase.id;

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.4, ease: [...ease] }}
                className="rounded-lg border p-4 space-y-3"
                style={{
                  backgroundColor: "var(--ink-dark)",
                  borderColor: active ? "var(--vermillion)" : "var(--ink-mid)",
                  opacity: past && !active ? 0.6 : 1,
                }}
              >
                {/* Phase header */}
                <div className="flex items-start gap-3">
                  {active && (
                    <div
                      className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--vermillion)" }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-base font-medium" style={{ color: "var(--parchment)" }}>
                      {phase.name}
                    </p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: "var(--parchment-dim)" }}>
                      {formatMonthRange(phase.startMonth, phase.endMonth)}
                    </p>
                  </div>
                </div>

                {/* Focus area tags */}
                {focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map((f) => (
                      <span
                        key={f}
                        className="rounded-full px-2.5 py-0.5 font-mono text-xs"
                        style={{
                          backgroundColor: active ? "var(--vermillion-wash)" : "var(--ink-deep)",
                          color: active ? "var(--vermillion-glow)" : "var(--parchment-muted)",
                          border: `1px solid ${active ? "var(--vermillion)" : "var(--ink-mid)"}`,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Targets */}
                {targets.length > 0 && (
                  <ul className="space-y-1">
                    {targets.map((t, ti) => (
                      <li key={ti} className="flex items-start gap-2">
                        <span className="font-mono text-xs mt-0.5" style={{ color: "var(--parchment-dim)" }}>·</span>
                        <span className="font-mono text-sm" style={{ color: "var(--parchment)" }}>{t}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Review section */}
                {showReview && (
                  <div className="pt-1 border-t" style={{ borderColor: "var(--ink-mid)" }}>
                    <AnimatePresence mode="wait">
                      {isReviewing ? (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25, ease: [...ease] }}
                          className="space-y-2"
                        >
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                            placeholder="Phase review notes..."
                            className={inputClass + " resize-none"}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={cancelReview}
                              className="rounded-md border px-3 py-1.5 font-mono text-xs"
                              style={{ borderColor: "var(--ink-mid)", color: "var(--parchment-dim)" }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveReview(phase.id)}
                              disabled={savingId === phase.id}
                              className="rounded-md border px-4 py-1.5 font-mono text-xs disabled:opacity-40"
                              style={{ backgroundColor: "var(--vermillion-wash)", borderColor: "var(--vermillion)", color: "var(--vermillion-glow)" }}
                            >
                              {savingId === phase.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </motion.div>
                      ) : phase.reviewNotes ? (
                        <motion.div
                          key="notes"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2"
                        >
                          <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>Review</p>
                          <p
                            className="font-mono text-sm leading-relaxed whitespace-pre-wrap"
                            style={{ color: "var(--parchment)" }}
                          >
                            {phase.reviewNotes}
                          </p>
                          <button
                            onClick={() => openReview(phase)}
                            className="font-mono text-xs"
                            style={{ color: "var(--parchment-dim)" }}
                          >
                            Edit review
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="add"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => openReview(phase)}
                          className="font-mono text-xs"
                          style={{ color: "var(--parchment-dim)" }}
                        >
                          + Add phase review
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
