"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SnapshotData = {
  netWorth?: number;
  debt?: number;
  savings?: number;
  monthlyBurn?: number;
  income?: number;
};

type Snapshot = {
  id: string;
  date: string;
  data: SnapshotData;
  createdAt: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type MetricDef = {
  key: keyof SnapshotData;
  label: string;
  accent?: boolean;
};

const METRICS: MetricDef[] = [
  { key: "netWorth", label: "Net Worth", accent: true },
  { key: "debt", label: "Kill", accent: true },
  { key: "savings", label: "Live" },
  { key: "monthlyBurn", label: "Build", accent: true },
  { key: "income", label: "Income", accent: true },
];

export default function FinancesPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finances?days=30");
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const latest: SnapshotData = snapshots.length > 0 ? snapshots[0].data : {};
  const history = snapshots.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Financial Pulse
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          $15K debt &rarr; $0. Track the kill.
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-parchment-dim text-sm py-12 text-center"
          >
            Loading...
          </motion.div>
        ) : snapshots.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-parchment-dim text-sm py-12 text-center"
          >
            No financial data yet.
          </motion.div>
        ) : (
          <motion.div
            key="metrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {METRICS.map((m, i) => (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.06,
                    duration: 0.5,
                    ease: EASE,
                  }}
                  className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl p-4 hover:border-sumi-gray-dark/25 transition-colors duration-300"
                >
                  <p
                    className="font-mono uppercase tracking-[0.12em] text-parchment-dim mb-1"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {m.label}
                  </p>
                  <p
                    className={`text-lg font-serif ${
                      m.accent ? "text-vermillion/50" : "text-parchment"
                    }`}
                  >
                    {formatCurrency(latest[m.key])}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Snapshot History */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
            >
              <h2
                className="font-mono uppercase tracking-[0.12em] text-parchment-dim mb-4"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Recent Snapshots
              </h2>
              <div className="space-y-2">
                {history.map((snap, i) => {
                  const d = snap.data;
                  return (
                    <motion.div
                      key={snap.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.55 + i * 0.04,
                        duration: 0.4,
                        ease: EASE,
                      }}
                      className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:border-sumi-gray-dark/25 transition-colors duration-300"
                    >
                      <span
                        className="font-mono text-parchment-muted shrink-0"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {formatDate(snap.date)}
                      </span>
                      <div className="flex items-center gap-4 text-sm overflow-x-auto">
                        {d.netWorth !== undefined && (
                          <span className="text-parchment-dim whitespace-nowrap">
                            <span className="text-parchment-muted">NW</span>{" "}
                            {formatCurrency(d.netWorth)}
                          </span>
                        )}
                        {d.debt !== undefined && (
                          <span className="text-parchment-dim whitespace-nowrap">
                            <span className="text-parchment-muted">Debt</span>{" "}
                            {formatCurrency(d.debt)}
                          </span>
                        )}
                        {d.savings !== undefined && (
                          <span className="text-parchment-dim whitespace-nowrap">
                            <span className="text-parchment-muted">Save</span>{" "}
                            {formatCurrency(d.savings)}
                          </span>
                        )}
                        {d.income !== undefined && (
                          <span className="text-parchment-dim whitespace-nowrap">
                            <span className="text-parchment-muted">Inc</span>{" "}
                            {formatCurrency(d.income)}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
