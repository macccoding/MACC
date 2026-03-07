"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TravelItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  budget: number | null;
  createdAt: string;
};

type Filter = "planning" | "booked" | "completed";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "Planning", value: "planning" },
  { label: "Booked", value: "booked" },
  { label: "Completed", value: "completed" },
];

const CATEGORIES = [
  { label: "Trip", value: "trip" },
  { label: "Destination", value: "destination" },
  { label: "Experience", value: "experience" },
];

const CATEGORY_COLORS: Record<string, string> = {
  trip: "text-blue-400 bg-blue-400/10",
  destination: "text-amber-400 bg-amber-400/10",
  experience: "text-green-400 bg-green-400/10",
};

const STATUS_CYCLE: Record<string, string> = {
  planning: "booked",
  booked: "completed",
  completed: "planning",
};

function formatBudget(budget: number | null) {
  if (budget === null || budget === undefined) return null;
  return "$" + budget.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function TravelPage() {
  const [items, setItems] = useState<TravelItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("trip");
  const [newBudget, setNewBudget] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("planning");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/travel?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch travel items:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          ...(newBudget ? { budget: parseFloat(newBudget) } : {}),
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewBudget("");
        setNewCategory("trip");
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to add travel item:", err);
    }
  }

  async function cycleStatus(id: string, currentStatus: string) {
    const nextStatus = STATUS_CYCLE[currentStatus] || "planning";
    try {
      const res = await fetch(`/api/travel/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error("Failed to update travel item:", err);
    }
  }

  async function deleteItem(id: string) {
    try {
      const res = await fetch(`/api/travel/${id}`, { method: "DELETE" });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error("Failed to delete travel item:", err);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Travel
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          Places to go, things to experience.
        </p>
      </motion.div>

      {/* Add Form */}
      <motion.form
        onSubmit={addItem}
        className="flex gap-3 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New travel item..."
          className="flex-1 min-w-[200px] bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-2.5 text-parchment placeholder:text-parchment-dim/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-2.5 text-parchment focus:outline-none focus:border-vermillion/30 transition-colors duration-300 appearance-none cursor-pointer"
          style={{ fontSize: "var(--text-body)" }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={newBudget}
          onChange={(e) => setNewBudget(e.target.value)}
          placeholder="Budget"
          min="0"
          step="any"
          className="w-28 bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-2.5 text-parchment placeholder:text-parchment-dim/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Add
        </button>
      </motion.form>

      {/* Filter Tabs */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`font-mono tracking-[0.12em] uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${
              filter === f.value
                ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
                : "bg-ink-dark/20 border-sumi-gray-dark/12 text-parchment-dim hover:border-sumi-gray-dark/25 hover:text-parchment-muted"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Travel Items List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-parchment-dim text-sm py-8 text-center"
            >
              Loading...
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-parchment-dim text-sm py-8 text-center"
            >
              No {filter} travel items yet.
            </motion.div>
          ) : (
            items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl p-4 hover:border-sumi-gray-dark/25 transition-colors duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3
                        className={`text-parchment font-light leading-snug ${
                          item.status === "completed"
                            ? "line-through opacity-50"
                            : ""
                        }`}
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {item.title}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase shrink-0 ${
                          CATEGORY_COLORS[item.category] || CATEGORY_COLORS.trip
                        }`}
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {item.category}
                      </span>
                    </div>
                    {item.budget !== null && (
                      <p
                        className="font-mono tracking-[0.08em] text-parchment-muted mt-2"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {formatBudget(item.budget)}
                      </p>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                    <button
                      onClick={() => cycleStatus(item.id, item.status)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-parchment-dim transition-colors duration-200 ${
                        item.status === "planning"
                          ? "hover:text-blue-400 hover:bg-blue-400/10"
                          : item.status === "booked"
                            ? "hover:text-green-400 hover:bg-green-400/10"
                            : "hover:text-vermillion hover:bg-vermillion/10"
                      }`}
                      title={
                        item.status === "planning"
                          ? "Mark Booked"
                          : item.status === "booked"
                            ? "Mark Completed"
                            : "Back to Planning"
                      }
                    >
                      {item.status === "completed" ? "\u21A9" : "\u2713"}
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-parchment-dim hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                      title="Delete"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
