"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type InvestmentNote = {
  id: string;
  content: string;
  createdAt: string;
};

type Investment = {
  id: string;
  symbol: string;
  thesis: string;
  entryPrice: number | null;
  currentPrice: number | null;
  quantity: number | null;
  assetType: string;
  costBasis: number | null;
  lastSyncedAt: string | null;
  createdAt: string;
  notes: InvestmentNote[];
};

const ASSET_TYPES = ["stock", "etf", "crypto"] as const;
const ASSET_TYPE_COLORS: Record<string, string> = {
  stock: "text-blue-400 bg-blue-400/10",
  etf: "text-green-400 bg-green-400/10",
  crypto: "text-amber-400 bg-amber-400/10",
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [newEntryPrice, setNewEntryPrice] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newAssetType, setNewAssetType] = useState<string>("stock");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/investments");
      if (res.ok) {
        const data = await res.json();
        setInvestments(data);
      }
    } catch (err) {
      console.error("Failed to fetch investments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  async function syncPrices() {
    setSyncing(true);
    try {
      const res = await fetch("/api/investments/sync", { method: "POST" });
      if (res.ok) fetchInvestments();
    } catch (err) {
      console.error("Failed to sync prices:", err);
    } finally {
      setSyncing(false);
    }
  }

  async function addInvestment(e: React.FormEvent) {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: newSymbol.trim(),
          ...(newEntryPrice ? { entryPrice: parseFloat(newEntryPrice) } : {}),
          ...(newQuantity ? { quantity: parseFloat(newQuantity) } : {}),
          assetType: newAssetType,
        }),
      });
      if (res.ok) {
        setNewSymbol("");
        setNewEntryPrice("");
        setNewQuantity("");
        setNewAssetType("stock");
        fetchInvestments();
      }
    } catch (err) {
      console.error("Failed to add investment:", err);
    }
  }

  async function deleteInvestment(id: string) {
    try {
      const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
      if (res.ok) fetchInvestments();
    } catch (err) {
      console.error("Failed to delete investment:", err);
    }
  }

  async function addNote(investmentId: string) {
    const content = noteInputs[investmentId]?.trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/investments/${investmentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setNoteInputs((prev) => ({ ...prev, [investmentId]: "" }));
        fetchInvestments();
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  }

  function toggleNotes(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function calcPnL(entry: number | null, current: number | null) {
    if (entry === null || current === null || entry === 0) return null;
    return ((current - entry) / entry) * 100;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Portfolio summary calculations
  const totalValue = investments.reduce((sum, inv) => {
    const qty = inv.quantity ?? 1;
    const price = inv.currentPrice ?? 0;
    return sum + price * qty;
  }, 0);

  const totalCost = investments.reduce((sum, inv) => {
    const qty = inv.quantity ?? 1;
    const cost = inv.costBasis ?? (inv.entryPrice ? inv.entryPrice * qty : 0);
    return sum + cost;
  }, 0);

  const totalPnL = totalCost > 0 ? totalValue - totalCost : 0;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const lastSynced = investments
    .filter((inv) => inv.lastSyncedAt)
    .map((inv) => new Date(inv.lastSyncedAt!).getTime())
    .sort((a, b) => b - a)[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Investments
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Track your portfolio thesis and positions.
        </p>
      </motion.div>

      {/* Portfolio Summary */}
      {!loading && investments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.05,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Value */}
            <div>
              <span
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Total Value
              </span>
              <span className="text-ink-black text-xl font-light mt-0.5 block">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Total Cost */}
            <div>
              <span
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Total Cost
              </span>
              <span className="text-ink-black text-xl font-light mt-0.5 block">
                ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* P&L */}
            <div>
              <span
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block"
                style={{ fontSize: "var(--text-micro)" }}
              >
                P&L
              </span>
              <span
                className={`text-xl font-light mt-0.5 block ${
                  totalPnL >= 0 ? "text-green-500" : "text-red-400"
                }`}
              >
                {totalPnL >= 0 ? "+" : ""}
                ${Math.abs(totalPnL).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm ml-1.5">
                  ({totalPnLPct >= 0 ? "+" : ""}
                  {totalPnLPct.toFixed(1)}%)
                </span>
              </span>
            </div>

            {/* Sync */}
            <div className="flex flex-col justify-between">
              <span
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Last Synced
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {lastSynced ? (
                  <span className="text-sumi-gray text-sm">
                    {formatDate(new Date(lastSynced).toISOString())}{" "}
                    {formatTime(new Date(lastSynced).toISOString())}
                  </span>
                ) : (
                  <span className="text-sumi-gray-light text-sm">Never</span>
                )}
                <button
                  onClick={syncPrices}
                  disabled={syncing}
                  className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-lg px-3 py-1 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  {syncing ? "Syncing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Investment Form */}
      <motion.form
        onSubmit={addInvestment}
        className="flex gap-3 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol..."
          className="flex-1 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black font-mono tracking-wider uppercase placeholder:text-sumi-gray-light/50 placeholder:normal-case focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <input
          type="number"
          step="0.01"
          value={newEntryPrice}
          onChange={(e) => setNewEntryPrice(e.target.value)}
          placeholder="Entry price..."
          className="w-full sm:w-36 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <input
          type="number"
          step="0.01"
          value={newQuantity}
          onChange={(e) => setNewQuantity(e.target.value)}
          placeholder="Quantity..."
          className="w-full sm:w-28 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <select
          value={newAssetType}
          onChange={(e) => setNewAssetType(e.target.value)}
          className="w-full sm:w-28 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black font-mono tracking-wider uppercase focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        >
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!newSymbol.trim()}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Add
        </button>
      </motion.form>

      {/* Investments List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              Loading...
            </motion.div>
          ) : investments.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              No investments tracked yet.
            </motion.div>
          ) : (
            investments.map((inv, i) => {
              const pnl = calcPnL(inv.entryPrice, inv.currentPrice);
              const notesOpen = expandedNotes.has(inv.id);
              const qty = inv.quantity ?? 1;
              const currentValue =
                inv.currentPrice !== null ? inv.currentPrice * qty : null;

              return (
                <motion.div
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  transition={{
                    delay: i * 0.04,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/20 transition-colors duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Symbol + Asset Type Badge */}
                      <div className="flex items-center gap-2">
                        <h3 className="text-ink-black font-mono text-lg tracking-wider">
                          {inv.symbol}
                        </h3>
                        <span
                          className={`font-mono tracking-[0.12em] uppercase rounded-md px-1.5 py-0.5 ${
                            ASSET_TYPE_COLORS[inv.assetType] ||
                            "text-sumi-gray bg-sumi-gray/10"
                          }`}
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {inv.assetType}
                        </span>
                      </div>

                      {/* Thesis */}
                      {inv.thesis && (
                        <p className="text-sumi-gray-light text-sm mt-1 leading-relaxed">
                          {inv.thesis}
                        </p>
                      )}

                      {/* Quantity & Current Value */}
                      <div className="flex items-center gap-4 mt-1.5">
                        {inv.quantity !== null && (
                          <span
                            className="font-mono tracking-[0.08em] text-sumi-gray"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {inv.quantity} shares
                          </span>
                        )}
                        {currentValue !== null && (
                          <span
                            className="font-mono tracking-[0.08em] text-ink-black"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Value $
                            {currentValue.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </div>

                      {/* Prices & P&L */}
                      <div className="flex items-center gap-4 mt-1.5">
                        {inv.entryPrice !== null && (
                          <span
                            className="font-mono tracking-[0.08em] text-sumi-gray"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Entry ${inv.entryPrice.toFixed(2)}
                          </span>
                        )}
                        {inv.currentPrice !== null && (
                          <span
                            className="font-mono tracking-[0.08em] text-sumi-gray"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Current ${inv.currentPrice.toFixed(2)}
                          </span>
                        )}
                        {pnl !== null && (
                          <span
                            className={`font-mono tracking-[0.08em] ${
                              pnl >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {pnl >= 0 ? "+" : ""}
                            {pnl.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      <button
                        onClick={() => deleteInvestment(inv.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="mt-3 pt-3 border-t border-sumi-gray/20">
                    <button
                      onClick={() => toggleNotes(inv.id)}
                      className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light hover:text-sumi-gray transition-colors duration-200"
                      style={{ fontSize: "var(--text-micro)" }}
                    >
                      Notes ({inv.notes.length}){" "}
                      {notesOpen ? "\u25B4" : "\u25BE"}
                    </button>

                    <AnimatePresence>
                      {notesOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="overflow-hidden"
                        >
                          {/* Existing Notes */}
                          {inv.notes.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {inv.notes.map((note) => (
                                <div
                                  key={note.id}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span
                                    className="text-sumi-gray font-mono shrink-0"
                                    style={{ fontSize: "var(--text-micro)" }}
                                  >
                                    {formatDate(note.createdAt)}
                                  </span>
                                  <span className="text-sumi-gray-light leading-relaxed">
                                    {note.content}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Note Input */}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={noteInputs[inv.id] || ""}
                              onChange={(e) =>
                                setNoteInputs((prev) => ({
                                  ...prev,
                                  [inv.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addNote(inv.id);
                                }
                              }}
                              placeholder="Add a note..."
                              className="flex-1 bg-parchment-warm/30 border border-sumi-gray/20 rounded-lg px-3 py-1.5 text-ink-black text-sm placeholder:text-sumi-gray-light/40 focus:outline-none focus:border-vermillion/20 transition-colors duration-300"
                            />
                            <button
                              onClick={() => addNote(inv.id)}
                              disabled={!noteInputs[inv.id]?.trim()}
                              className="bg-vermillion/10 border border-vermillion/15 text-vermillion rounded-lg px-3 py-1.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/20 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              Add
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
