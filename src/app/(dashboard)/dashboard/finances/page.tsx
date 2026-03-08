"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SnapshotData = {
  netWorth?: number;
  debt?: number;
  savings?: number;
  monthlyBurn?: number;
  income?: number;
  expenses?: number;
  byCategory?: Record<string, number>;
  transactionCount?: number;
};

type Snapshot = {
  id: string;
  date: string;
  data: SnapshotData;
  createdAt: string;
};

type Transaction = {
  id: string;
  externalId: string;
  date: string;
  name: string;
  amount: number;
  category: string;
  account: string;
  reviewed: boolean;
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

function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await fetch("/api/finances?days=30");
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
    }
  }, []);

  const fetchTransactions = useCallback(
    async (category?: string | null) => {
      try {
        const params = new URLSearchParams({ days: "30" });
        if (category) params.set("category", category);
        const res = await fetch(`/api/finances/transactions?${params}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      }
    },
    []
  );

  const syncFinances = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/finances/sync", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setSyncError(data.error);
      } else {
        setLastSynced(new Date().toLocaleTimeString());
        // Refresh data after sync
        await Promise.all([fetchSnapshots(), fetchTransactions(categoryFilter)]);
      }
    } catch (err) {
      setSyncError("Network error during sync");
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }, [fetchSnapshots, fetchTransactions, categoryFilter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSnapshots(), fetchTransactions()]);
      setLoading(false);
    };
    load();
  }, [fetchSnapshots, fetchTransactions]);

  useEffect(() => {
    fetchTransactions(categoryFilter);
  }, [categoryFilter, fetchTransactions]);

  const latest: SnapshotData = snapshots.length > 0 ? snapshots[0].data : {};
  const history = snapshots.slice(0, 10);

  // Derive unique categories from transactions
  const categories = Array.from(
    new Set(transactions.map((t) => t.category).filter(Boolean))
  ).sort();

  // Spending by category from snapshot data
  const byCategory = latest.byCategory ?? {};
  const maxCategorySpend = Math.max(...Object.values(byCategory), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1
            className="text-ink-black font-light"
            style={{ fontSize: "var(--text-heading)" }}
          >
            Financial Pulse
          </h1>
          <p className="text-sumi-gray-light text-sm mt-1">
            $15K debt &rarr; $0. Track the kill.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastSynced && (
            <span
              className="text-sumi-gray-light font-mono"
              style={{ fontSize: "var(--text-micro)" }}
            >
              synced {lastSynced}
            </span>
          )}
          <button
            onClick={syncFinances}
            disabled={syncing}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-lg px-3 py-1.5 font-mono uppercase tracking-[0.12em] text-sumi-gray hover:text-ink-black hover:border-sumi-gray/40 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: "var(--text-micro)" }}
          >
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </motion.div>

      {/* Sync Error */}
      <AnimatePresence>
        {syncError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-vermillion/10 border border-vermillion/30 rounded-xl px-4 py-3 text-sm text-vermillion"
          >
            {syncError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sumi-gray-light text-sm py-12 text-center"
          >
            Loading...
          </motion.div>
        ) : snapshots.length === 0 && transactions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sumi-gray-light text-sm py-12 text-center"
          >
            No financial data yet. Hit Sync to pull from Copilot Money.
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Metrics Cards */}
            {snapshots.length > 0 && (
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
                    className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/40 transition-colors duration-300"
                  >
                    <p
                      className="font-mono uppercase tracking-[0.12em] text-sumi-gray-light mb-1"
                      style={{ fontSize: "var(--text-micro)" }}
                    >
                      {m.label}
                    </p>
                    <p
                      className={`text-lg font-serif ${
                        m.accent ? "text-vermillion/50" : "text-ink-black"
                      }`}
                    >
                      {formatCurrency(latest[m.key] as number | undefined)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Spending by Category */}
            {Object.keys(byCategory).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
              >
                <h2
                  className="font-mono uppercase tracking-[0.12em] text-sumi-gray-light mb-4"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  Spending by Category
                </h2>
                <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 space-y-3">
                  {Object.entries(byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amount], i) => (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.45 + i * 0.04,
                          duration: 0.4,
                          ease: EASE,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-sumi-gray capitalize">
                            {cat}
                          </span>
                          <span
                            className="font-mono text-sumi-gray-light"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-sumi-gray/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-vermillion/40 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(amount / maxCategorySpend) * 100}%`,
                            }}
                            transition={{
                              delay: 0.5 + i * 0.04,
                              duration: 0.6,
                              ease: EASE,
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Transactions */}
            {transactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
              >
                <h2
                  className="font-mono uppercase tracking-[0.12em] text-sumi-gray-light mb-4"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  Transactions
                </h2>

                {/* Category Filter Pills */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setCategoryFilter(null)}
                      className={`font-mono uppercase tracking-[0.12em] px-3 py-1 rounded-full border transition-colors duration-300 ${
                        categoryFilter === null
                          ? "bg-ink-black text-parchment border-ink-black"
                          : "bg-parchment-warm/40 border-sumi-gray/20 text-sumi-gray hover:border-sumi-gray/40"
                      }`}
                      style={{ fontSize: "var(--text-micro)" }}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() =>
                          setCategoryFilter(categoryFilter === cat ? null : cat)
                        }
                        className={`font-mono uppercase tracking-[0.12em] px-3 py-1 rounded-full border transition-colors duration-300 ${
                          categoryFilter === cat
                            ? "bg-ink-black text-parchment border-ink-black"
                            : "bg-parchment-warm/40 border-sumi-gray/20 text-sumi-gray hover:border-sumi-gray/40"
                        }`}
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Transaction Rows */}
                <div className="space-y-2">
                  {transactions.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.55 + i * 0.02,
                        duration: 0.4,
                        ease: EASE,
                      }}
                      className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-sumi-gray/40 transition-colors duration-300"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="font-mono text-sumi-gray-light shrink-0"
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {formatDateShort(tx.date)}
                        </span>
                        <span className="text-sm text-ink-black truncate">
                          {tx.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {tx.category && (
                          <span
                            className="font-mono uppercase tracking-[0.12em] text-sumi-gray-light bg-sumi-gray/5 px-2 py-0.5 rounded-md hidden sm:inline-block"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {tx.category}
                          </span>
                        )}
                        {tx.account && (
                          <span
                            className="font-mono text-sumi-gray-light hidden md:inline-block"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {tx.account}
                          </span>
                        )}
                        <span
                          className={`font-mono text-sm font-medium ${
                            tx.amount > 0
                              ? "text-emerald-600"
                              : "text-vermillion"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {formatCurrencyPrecise(tx.amount)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Snapshot History */}
            {history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5, ease: EASE }}
              >
                <h2
                  className="font-mono uppercase tracking-[0.12em] text-sumi-gray-light mb-4"
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
                          delay: 0.65 + i * 0.04,
                          duration: 0.4,
                          ease: EASE,
                        }}
                        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:border-sumi-gray/40 transition-colors duration-300"
                      >
                        <span
                          className="font-mono text-sumi-gray shrink-0"
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {formatDate(snap.date)}
                        </span>
                        <div className="flex items-center gap-4 text-sm overflow-x-auto">
                          {d.netWorth !== undefined && (
                            <span className="text-sumi-gray-light whitespace-nowrap">
                              <span className="text-sumi-gray">NW</span>{" "}
                              {formatCurrency(d.netWorth)}
                            </span>
                          )}
                          {d.debt !== undefined && (
                            <span className="text-sumi-gray-light whitespace-nowrap">
                              <span className="text-sumi-gray">Debt</span>{" "}
                              {formatCurrency(d.debt)}
                            </span>
                          )}
                          {d.savings !== undefined && (
                            <span className="text-sumi-gray-light whitespace-nowrap">
                              <span className="text-sumi-gray">Save</span>{" "}
                              {formatCurrency(d.savings)}
                            </span>
                          )}
                          {d.income !== undefined && (
                            <span className="text-sumi-gray-light whitespace-nowrap">
                              <span className="text-sumi-gray">Inc</span>{" "}
                              {formatCurrency(d.income)}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
