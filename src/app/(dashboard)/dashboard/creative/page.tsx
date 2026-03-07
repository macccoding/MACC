"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CreativeProject = {
  id: string;
  title: string;
  status: string;
  description: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

type Filter = "in_progress" | "idea" | "completed";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "In Progress", value: "in_progress" },
  { label: "Ideas", value: "idea" },
  { label: "Completed", value: "completed" },
];

const STATUS_COLORS: Record<string, string> = {
  in_progress: "text-vermillion bg-vermillion/10",
  idea: "text-amber-400 bg-amber-400/10",
  completed: "text-green-400 bg-green-400/10",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "In Progress",
  idea: "Idea",
  completed: "Completed",
};

const STATUS_CYCLE: Record<string, string> = {
  idea: "in_progress",
  in_progress: "completed",
  completed: "idea",
};

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CreativePage() {
  const [items, setItems] = useState<CreativeProject[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("in_progress");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/creative?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch creative projects:", err);
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
      const res = await fetch("/api/creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          ...(newDescription.trim()
            ? { description: newDescription.trim() }
            : {}),
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDescription("");
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to add creative project:", err);
    }
  }

  async function cycleStatus(id: string, currentStatus: string) {
    const nextStatus = STATUS_CYCLE[currentStatus] || "in_progress";
    try {
      const res = await fetch(`/api/creative/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error("Failed to update creative project:", err);
    }
  }

  async function deleteItem(id: string) {
    try {
      const res = await fetch(`/api/creative/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (expandedId === id) setExpandedId(null);
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to delete creative project:", err);
    }
  }

  const filterLabel =
    filter === "in_progress"
      ? "in-progress"
      : filter === "idea"
        ? "idea"
        : "completed";

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
          Creative
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          Projects, ideas, and works in progress.
        </p>
      </motion.div>

      {/* Add Form */}
      <motion.form
        onSubmit={addItem}
        className="space-y-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New project title..."
            className="flex-1 min-w-[200px] bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-2.5 text-parchment placeholder:text-parchment-dim/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
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
        </div>
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-2.5 text-parchment placeholder:text-parchment-dim/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300 resize-none"
          style={{ fontSize: "var(--text-body)" }}
        />
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

      {/* Project Cards */}
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
              No {filterLabel} projects yet.
            </motion.div>
          ) : (
            items.map((item, i) => {
              const isExpanded = expandedId === item.id;
              const hasLongDescription = item.description.length > 100;

              return (
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
                            STATUS_COLORS[item.status] ||
                            STATUS_COLORS.in_progress
                          }`}
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <div className="mt-2">
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.p
                              key={isExpanded ? "full" : "truncated"}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="text-parchment-dim leading-relaxed"
                              style={{ fontSize: "var(--text-body)" }}
                            >
                              {isExpanded
                                ? item.description
                                : truncate(item.description, 100)}
                            </motion.p>
                          </AnimatePresence>
                          {hasLongDescription && (
                            <button
                              onClick={() =>
                                setExpandedId(isExpanded ? null : item.id)
                              }
                              className="text-vermillion/70 hover:text-vermillion font-mono tracking-[0.08em] uppercase mt-1 transition-colors duration-200"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Created date */}
                      <p
                        className="font-mono tracking-[0.08em] text-parchment-muted mt-2"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      <button
                        onClick={() => cycleStatus(item.id, item.status)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-parchment-dim transition-colors duration-200 ${
                          item.status === "idea"
                            ? "hover:text-vermillion hover:bg-vermillion/10"
                            : item.status === "in_progress"
                              ? "hover:text-green-400 hover:bg-green-400/10"
                              : "hover:text-amber-400 hover:bg-amber-400/10"
                        }`}
                        title={
                          item.status === "idea"
                            ? "Start Project"
                            : item.status === "in_progress"
                              ? "Mark Completed"
                              : "Back to Idea"
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
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
