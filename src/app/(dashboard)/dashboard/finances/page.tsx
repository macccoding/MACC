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

type RecurringTransaction = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string | null;
  frequency: string;
  nextDate: string | null;
  active: boolean;
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

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
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

const FREQUENCIES = ["weekly", "monthly", "yearly"] as const;

function frequencyLabel(freq: string): string {
  switch (freq) {
    case "weekly":
      return "/wk";
    case "yearly":
      return "/yr";
    default:
      return "/mo";
  }
}

function monthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":
      return amount * 4.33;
    case "yearly":
      return amount / 12;
    default:
      return amount;
  }
}

/* ─── Modal Backdrop ─────────────────────────────────────────── */
function ModalBackdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="bg-parchment border border-sumi-gray/20 rounded-2xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ─── Quick-Add Transaction Modal ────────────────────────────── */
function QuickAddModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/finances/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amount: parseFloat(amount), category, date }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save transaction:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <h2
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Add Transaction
        </h2>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
            placeholder="Coffee, Groceries..."
          />
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Amount (negative = expense)
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
            placeholder="-4.50"
          />
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
            placeholder="Food, Transport..."
          />
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 font-mono tracking-[0.12em] uppercase text-sumi-gray hover:text-ink-black transition-colors rounded-xl"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name || !amount}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vermillion/25 transition-colors"
            style={{ fontSize: "var(--text-micro)" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

/* ─── Add/Edit Subscription Modal ────────────────────────────── */
function SubscriptionModal({
  item,
  onClose,
  onSaved,
}: {
  item?: RecurringTransaction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item?.amount?.toString() ?? "");
  const [frequency, setFrequency] = useState(item?.frequency ?? "monthly");
  const [category, setCategory] = useState(item?.category ?? "");
  const [nextDate, setNextDate] = useState(toInputDate(item?.nextDate ?? null));
  const [saving, setSaving] = useState(false);

  const isEdit = !!item;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/finances/recurring/${item.id}`
        : "/api/finances/recurring";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount),
          frequency,
          category: category || null,
          nextDate: nextDate || null,
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error("Failed to save subscription:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <h2
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          {isEdit ? "Edit Subscription" : "Add Subscription"}
        </h2>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
            placeholder="Netflix, Spotify..."
          />
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
            placeholder="14.99"
          />
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
            placeholder="Entertainment, SaaS..."
          />
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Next Billing Date
          </label>
          <input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-sm text-ink-black focus:outline-none focus:border-vermillion/40 transition-colors"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 font-mono tracking-[0.12em] uppercase text-sumi-gray hover:text-ink-black transition-colors rounded-xl"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name || !amount}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vermillion/25 transition-colors"
            style={{ fontSize: "var(--text-micro)" }}
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function FinancesPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<RecurringTransaction | undefined>(
    undefined
  );

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

  const fetchRecurring = useCallback(async () => {
    try {
      const res = await fetch("/api/finances/recurring");
      if (res.ok) {
        const data = await res.json();
        setRecurring(data);
      }
    } catch (err) {
      console.error("Failed to fetch recurring:", err);
    }
  }, []);

  const toggleRecurringActive = useCallback(
    async (item: RecurringTransaction) => {
      try {
        const res = await fetch(`/api/finances/recurring/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !item.active }),
        });
        if (res.ok) {
          setRecurring((prev) =>
            prev.map((r) =>
              r.id === item.id ? { ...r, active: !r.active } : r
            )
          );
        }
      } catch (err) {
        console.error("Failed to toggle recurring:", err);
      }
    },
    []
  );

  const deleteRecurring = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/finances/recurring/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setRecurring((prev) => prev.filter((r) => r.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete recurring:", err);
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
        await Promise.all([
          fetchSnapshots(),
          fetchTransactions(categoryFilter),
          fetchRecurring(),
        ]);
      }
    } catch (err) {
      setSyncError("Network error during sync");
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }, [fetchSnapshots, fetchTransactions, fetchRecurring, categoryFilter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSnapshots(), fetchTransactions(), fetchRecurring()]);
      setLoading(false);
    };
    load();
  }, [fetchSnapshots, fetchTransactions, fetchRecurring]);

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

  // Recurring totals
  const activeRecurring = recurring.filter((r) => r.active);
  const monthlyTotal = activeRecurring.reduce(
    (sum, r) => sum + monthlyEquivalent(r.amount, r.frequency),
    0
  );

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

            {/* Subscriptions & Recurring */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5, ease: EASE }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="font-mono uppercase tracking-[0.12em] text-sumi-gray-light"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  Subscriptions &amp; Recurring
                </h2>
                <button
                  onClick={() => {
                    setEditingSub(undefined);
                    setShowSubModal(true);
                  }}
                  className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 transition-colors"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  Add Subscription
                </button>
              </div>

              {/* Monthly Total */}
              {activeRecurring.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.4, ease: EASE }}
                  className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 mb-3"
                >
                  <p
                    className="font-mono uppercase tracking-[0.12em] text-sumi-gray-light mb-1"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    Monthly Total
                  </p>
                  <p className="text-lg font-serif text-vermillion/50">
                    {formatCurrencyPrecise(monthlyTotal)}
                  </p>
                </motion.div>
              )}

              {/* Recurring Items */}
              {recurring.length === 0 ? (
                <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-8 text-center text-sumi-gray-light text-sm">
                  No subscriptions yet. Add your first recurring expense.
                </div>
              ) : (
                <div className="space-y-2">
                  {recurring.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.7 + i * 0.03,
                        duration: 0.4,
                        ease: EASE,
                      }}
                      className={`bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-3 hover:border-sumi-gray/40 transition-colors duration-300 group ${
                        !item.active ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm text-ink-black truncate">
                            {item.name}
                          </span>
                          {item.category && (
                            <span
                              className="font-mono uppercase tracking-[0.12em] text-sumi-gray-light bg-sumi-gray/5 px-2 py-0.5 rounded-md hidden sm:inline-block"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              {item.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-sm text-vermillion font-medium">
                            {formatCurrencyPrecise(item.amount)}
                            <span className="text-sumi-gray-light font-normal">
                              {frequencyLabel(item.frequency)}
                            </span>
                          </span>

                          {/* Hover actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {/* Active toggle */}
                            <button
                              onClick={() => toggleRecurringActive(item)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                item.active
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-sumi-gray-light hover:bg-sumi-gray/10"
                              }`}
                              title={item.active ? "Pause" : "Activate"}
                            >
                              {item.active ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                              ) : (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect x="6" y="4" width="4" height="16" />
                                  <rect x="14" y="4" width="4" height="16" />
                                </svg>
                              )}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingSub(item);
                                setShowSubModal(true);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sumi-gray-light hover:text-ink-black hover:bg-sumi-gray/10 transition-colors"
                              title="Edit"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete "${item.name}"?`
                                  )
                                ) {
                                  deleteRecurring(item.id);
                                }
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sumi-gray-light hover:text-vermillion hover:bg-vermillion/10 transition-colors"
                              title="Delete"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      {item.nextDate && (
                        <p
                          className="font-mono text-sumi-gray-light mt-1"
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          Next: {formatDate(item.nextDate)}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Snapshot History */}
            {history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
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
                          delay: 0.75 + i * 0.04,
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

      {/* Quick-Add FAB */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4, ease: EASE }}
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-vermillion text-white rounded-full shadow-lg flex items-center justify-center hover:bg-vermillion/90 active:scale-95 transition-all duration-200"
        title="Quick add transaction"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {showQuickAdd && (
          <QuickAddModal
            key="quick-add"
            onClose={() => setShowQuickAdd(false)}
            onSaved={() => fetchTransactions(categoryFilter)}
          />
        )}
        {showSubModal && (
          <SubscriptionModal
            key="sub-modal"
            item={editingSub}
            onClose={() => {
              setShowSubModal(false);
              setEditingSub(undefined);
            }}
            onSaved={fetchRecurring}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
