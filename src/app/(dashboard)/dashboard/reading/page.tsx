"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ReadingItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  rating: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type Filter = "to_read" | "reading" | "completed";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "To Read", value: "to_read" },
  { label: "Reading", value: "reading" },
  { label: "Completed", value: "completed" },
];

const TYPES = ["book", "article", "paper", "podcast"] as const;

const TYPE_COLORS: Record<string, string> = {
  book: "text-amber-400 bg-amber-400/10",
  article: "text-blue-400 bg-blue-400/10",
  paper: "text-green-400 bg-green-400/10",
  podcast: "text-purple-400 bg-purple-400/10",
};

const TYPE_LABELS: Record<string, string> = {
  book: "Book",
  article: "Article",
  paper: "Paper",
  podcast: "Podcast",
};

const STATUS_CYCLE: Record<string, string> = {
  to_read: "reading",
  reading: "completed",
  completed: "to_read",
};

const FILTER_LABELS: Record<string, string> = {
  to_read: "to-read",
  reading: "reading",
  completed: "completed",
};

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

function StarRating({
  rating,
  interactive,
  onRate,
}: {
  rating: number | null;
  interactive: boolean;
  onRate?: (value: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? rating ?? 0;

  return (
    <span
      className="inline-flex gap-0.5"
      onMouseLeave={() => interactive && setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          className={`text-base leading-none transition-colors duration-150 ${
            interactive
              ? "cursor-pointer hover:scale-110"
              : "cursor-default"
          } ${star <= display ? "text-amber-400" : "text-sumi-gray-light/30"}`}
        >
          {star <= display ? "\u2605" : "\u2606"}
        </button>
      ))}
    </span>
  );
}

export default function ReadingPage() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<string>("book");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("to_read");
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reading?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch reading items:", err);
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
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to add reading item:", err);
    }
  }

  async function cycleStatus(id: string, currentStatus: string) {
    const nextStatus = STATUS_CYCLE[currentStatus] || "to_read";
    try {
      const res = await fetch(`/api/reading/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error("Failed to update reading item:", err);
    }
  }

  async function setRating(id: string, rating: number) {
    try {
      const res = await fetch(`/api/reading/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, rating } : item))
        );
      }
    } catch (err) {
      console.error("Failed to set rating:", err);
    }
  }

  async function saveNotes(id: string) {
    const notes = editingNotes[id];
    if (notes === undefined) return;

    try {
      const res = await fetch(`/api/reading/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, notes } : item))
        );
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  }

  async function deleteItem(id: string) {
    try {
      const res = await fetch(`/api/reading/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (notesOpenId === id) setNotesOpenId(null);
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to delete reading item:", err);
    }
  }

  function toggleNotes(item: ReadingItem) {
    if (notesOpenId === item.id) {
      setNotesOpenId(null);
    } else {
      setNotesOpenId(item.id);
      setEditingNotes((prev) => ({ ...prev, [item.id]: item.notes }));
    }
  }

  const filterLabel = FILTER_LABELS[filter] || filter;

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
          Reading
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Books, articles, and media to consume.
        </p>
      </motion.div>

      {/* Add Form */}
      <motion.form
        onSubmit={addItem}
        className="flex gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a title..."
          className="flex-1 min-w-[200px] bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black focus:outline-none focus:border-vermillion/30 transition-colors duration-300 appearance-none cursor-pointer"
          style={{ fontSize: "var(--text-body)" }}
        >
          {TYPES.map((t) => (
            <option key={t} value={t} className="bg-neutral-900">
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
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
                : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray-light hover:border-sumi-gray/20 hover:text-sumi-gray"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Reading Cards */}
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
          ) : items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              No {filterLabel} items yet.
            </motion.div>
          ) : (
            items.map((item, i) => {
              const isNotesOpen = notesOpenId === item.id;
              const isCompleted = item.status === "completed";

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
                  className="group bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/20 transition-colors duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title + Type Badge */}
                      <div className="flex items-center gap-2.5">
                        <h3
                          className={`text-ink-black font-light leading-snug ${
                            isCompleted ? "line-through opacity-50" : ""
                          }`}
                          style={{ fontSize: "var(--text-body)" }}
                        >
                          {item.title}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase shrink-0 ${
                            TYPE_COLORS[item.type] || TYPE_COLORS.book
                          }`}
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </div>

                      {/* Rating Stars */}
                      {(isCompleted || item.rating) && (
                        <div className="mt-2">
                          <StarRating
                            rating={item.rating}
                            interactive={isCompleted}
                            onRate={(value) => setRating(item.id, value)}
                          />
                        </div>
                      )}

                      {/* Notes preview */}
                      {item.notes && !isNotesOpen && (
                        <p
                          className="text-sumi-gray-light mt-2 leading-relaxed"
                          style={{ fontSize: "var(--text-body)" }}
                        >
                          {truncate(item.notes, 100)}
                        </p>
                      )}

                      {/* Notes expand button */}
                      <button
                        onClick={() => toggleNotes(item)}
                        className="text-vermillion/70 hover:text-vermillion font-mono tracking-[0.08em] uppercase mt-2 transition-colors duration-200"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {isNotesOpen ? "Hide notes" : item.notes ? "Edit notes" : "Add notes"}
                      </button>

                      {/* Expandable Notes Textarea */}
                      <AnimatePresence initial={false}>
                        {isNotesOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.3,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="overflow-hidden"
                          >
                            <textarea
                              value={editingNotes[item.id] ?? item.notes}
                              onChange={(e) =>
                                setEditingNotes((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              onBlur={() => saveNotes(item.id)}
                              placeholder="Write notes..."
                              rows={3}
                              className="w-full mt-2 bg-parchment-warm/60 border border-sumi-gray/20 rounded-lg px-3 py-2 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300 resize-none"
                              style={{ fontSize: "var(--text-body)" }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      <button
                        onClick={() => cycleStatus(item.id, item.status)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light transition-colors duration-200 ${
                          item.status === "to_read"
                            ? "hover:text-blue-400 hover:bg-blue-400/10"
                            : item.status === "reading"
                              ? "hover:text-green-400 hover:bg-green-400/10"
                              : "hover:text-amber-400 hover:bg-amber-400/10"
                        }`}
                        title={
                          item.status === "to_read"
                            ? "Start Reading"
                            : item.status === "reading"
                              ? "Mark Completed"
                              : "Back to To Read"
                        }
                      >
                        {item.status === "completed" ? "\u21A9" : "\u2713"}
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
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
