"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────

type ReadingLog = {
  id: string;
  date: string;
  minutesRead: number | null;
  pagesRead: number | null;
  note: string | null;
};

type ReadingItem = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  type: string;
  format: string | null;
  status: string;
  progress: number;
  startedAt: string | null;
  finishedAt: string | null;
  rating: number | null;
  takeaway: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  logs: ReadingLog[];
};

type Filter = "to_read" | "reading" | "completed";

// ─── Constants ────────────────────────────────────────────────────

const FILTERS: { label: string; value: Filter }[] = [
  { label: "To Read", value: "to_read" },
  { label: "Reading", value: "reading" },
  { label: "Completed", value: "completed" },
];

const TYPES = ["book", "article", "paper", "podcast"] as const;
const FORMATS = ["physical", "ebook", "audiobook"] as const;

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

const FORMAT_LABELS: Record<string, string> = {
  physical: "Physical",
  ebook: "E-book",
  audiobook: "Audiobook",
};

const FORMAT_COLORS: Record<string, string> = {
  physical: "text-emerald-400 bg-emerald-400/10",
  ebook: "text-cyan-400 bg-cyan-400/10",
  audiobook: "text-orange-400 bg-orange-400/10",
};

const FILTER_LABELS: Record<string, string> = {
  to_read: "to-read",
  reading: "reading",
  completed: "completed",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Utilities ────────────────────────────────────────────────────

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── StarRating Component ─────────────────────────────────────────

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

// ─── Reading Heatmap (90 days) ────────────────────────────────────

function ReadingHeatmap({ items }: { items: ReadingItem[] }) {
  const { dayMap, maxMinutes } = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      for (const log of item.logs) {
        const key = log.date.slice(0, 10);
        map.set(key, (map.get(key) || 0) + (log.minutesRead || 0));
      }
    }
    let max = 0;
    for (const v of map.values()) {
      if (v > max) max = v;
    }
    return { dayMap: map, maxMinutes: max || 1 };
  }, [items]);

  // Build 90-day grid: 13 weeks x 7 days
  const today = new Date();
  const days: { date: Date; key: string }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = getDaysAgo(i);
    days.push({ date: d, key: toDateKey(d) });
  }

  // Arrange into columns (weeks). Each column is Sun-Sat.
  // Pad start so first column starts on Sunday
  const startDow = days[0].date.getDay(); // 0=Sun
  const padded: (typeof days[0] | null)[] = [
    ...Array(startDow).fill(null),
    ...days,
  ];
  const weeks: (typeof padded)[] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  // Pad last week
  const last = weeks[weeks.length - 1];
  while (last.length < 7) last.push(null);

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, colIdx) => {
    for (const day of week) {
      if (day) {
        const m = day.date.getMonth();
        if (m !== lastMonth) {
          lastMonth = m;
          monthLabels.push({
            label: day.date.toLocaleString("en", { month: "short" }),
            col: colIdx,
          });
        }
        break;
      }
    }
  });

  function getColor(minutes: number): string {
    if (minutes === 0) return "bg-sumi-gray/10";
    const ratio = minutes / maxMinutes;
    if (ratio < 0.25) return "bg-vermillion/20";
    if (ratio < 0.5) return "bg-vermillion/40";
    if (ratio < 0.75) return "bg-vermillion/60";
    return "bg-vermillion/80";
  }

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 ml-0">
        {monthLabels.map((ml, i) => (
          <span
            key={i}
            className="font-mono text-sumi-gray-light tracking-[0.08em] uppercase"
            style={{
              fontSize: "var(--text-micro)",
              marginLeft: i === 0 ? `${ml.col * 15}px` : undefined,
              width: i < monthLabels.length - 1
                ? `${(monthLabels[i + 1].col - ml.col) * 15}px`
                : undefined,
            }}
          >
            {ml.label}
          </span>
        ))}
      </div>
      {/* Grid */}
      <div className="flex gap-[3px]">
        {weeks.map((week, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-[3px]">
            {week.map((day, rowIdx) => {
              if (!day) {
                return (
                  <div
                    key={rowIdx}
                    className="w-[12px] h-[12px] rounded-[2px]"
                  />
                );
              }
              const minutes = dayMap.get(day.key) || 0;
              return (
                <div
                  key={rowIdx}
                  className={`w-[12px] h-[12px] rounded-[2px] transition-colors duration-200 ${getColor(minutes)}`}
                  title={`${day.key}: ${minutes} min`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reading Stats Row ────────────────────────────────────────────

function ReadingStats({ items }: { items: ReadingItem[] }) {
  const stats = useMemo(() => {
    // Collect all log dates
    const allDates = new Set<string>();
    let totalMinutesMonth = 0;
    let daysThisMonth = 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthDays = new Set<string>();
    for (const item of items) {
      for (const log of item.logs) {
        const key = log.date.slice(0, 10);
        allDates.add(key);
        const logDate = new Date(log.date);
        if (logDate.getMonth() === thisMonth && logDate.getFullYear() === thisYear) {
          totalMinutesMonth += log.minutesRead || 0;
          monthDays.add(key);
        }
      }
    }
    daysThisMonth = monthDays.size;

    // Calculate streak (consecutive days ending today or yesterday)
    let streak = 0;
    const sorted = Array.from(allDates).sort().reverse();
    if (sorted.length > 0) {
      const todayKey = toDateKey(now);
      const yesterdayKey = toDateKey(getDaysAgo(1));
      // Start from today or yesterday
      let checkDate: Date | null = null;
      if (sorted[0] === todayKey) {
        checkDate = now;
      } else if (sorted[0] === yesterdayKey) {
        checkDate = getDaysAgo(1);
      }
      if (checkDate) {
        const dateSet = new Set(sorted);
        for (let i = 0; i < 365; i++) {
          const d = new Date(checkDate);
          d.setDate(d.getDate() - i);
          if (dateSet.has(toDateKey(d))) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return { streak, daysThisMonth, totalMinutesMonth };
  }, [items]);

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Streak", value: `${stats.streak}d` },
        { label: "Days This Month", value: String(stats.daysThisMonth) },
        { label: "Minutes This Month", value: String(stats.totalMinutesMonth) },
      ].map((s) => (
        <div
          key={s.label}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-3 text-center"
        >
          <div
            className="text-ink-black font-light text-lg"
          >
            {s.value}
          </div>
          <div
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mt-0.5"
            style={{ fontSize: "var(--text-micro)" }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Completion Modal ─────────────────────────────────────────────

function CompletionModal({
  item,
  onSave,
  onCancel,
}: {
  item: ReadingItem;
  onSave: (rating: number, takeaway: string) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState<number>(item.rating || 0);
  const [takeaway, setTakeaway] = useState(item.takeaway || "");

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-parchment-warm border border-sumi-gray/20 rounded-xl p-6 w-full max-w-md space-y-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ ease }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Finished!
        </h3>
        <p className="text-sumi-gray-light text-sm">
          Rate &ldquo;{truncate(item.title, 40)}&rdquo; and add a one-line takeaway.
        </p>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Rating
          </label>
          <StarRating rating={rating} interactive onRate={setRating} />
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Takeaway
          </label>
          <input
            type="text"
            value={takeaway}
            onChange={(e) => setTakeaway(e.target.value)}
            placeholder="One-line takeaway..."
            className="w-full bg-parchment-warm/60 border border-sumi-gray/20 rounded-lg px-3 py-2 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
            style={{ fontSize: "var(--text-body)" }}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sumi-gray-light hover:text-ink-black transition-colors duration-200 font-mono tracking-[0.12em] uppercase"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Skip
          </button>
          <button
            onClick={() => onSave(rating, takeaway)}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Log Session Modal ────────────────────────────────────────────

function LogSessionModal({
  item,
  onSave,
  onCancel,
}: {
  item: ReadingItem;
  onSave: (minutes: number, pages: number, note: string) => void;
  onCancel: () => void;
}) {
  const [minutes, setMinutes] = useState(30);
  const [pages, setPages] = useState(0);
  const [note, setNote] = useState("");

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-parchment-warm border border-sumi-gray/20 rounded-xl p-6 w-full max-w-md space-y-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ ease }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Log Session
        </h3>
        <p className="text-sumi-gray-light text-sm">
          {truncate(item.title, 50)}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Minutes
            </label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              min={0}
              className="w-full bg-parchment-warm/60 border border-sumi-gray/20 rounded-lg px-3 py-2 text-ink-black focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
              style={{ fontSize: "var(--text-body)" }}
            />
          </div>
          <div>
            <label
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Pages
            </label>
            <input
              type="number"
              value={pages}
              onChange={(e) => setPages(Number(e.target.value))}
              min={0}
              className="w-full bg-parchment-warm/60 border border-sumi-gray/20 rounded-lg px-3 py-2 text-ink-black focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
              style={{ fontSize: "var(--text-body)" }}
            />
          </div>
        </div>
        <div>
          <label
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-1"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you read about?"
            className="w-full bg-parchment-warm/60 border border-sumi-gray/20 rounded-lg px-3 py-2 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
            style={{ fontSize: "var(--text-body)" }}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sumi-gray-light hover:text-ink-black transition-colors duration-200 font-mono tracking-[0.12em] uppercase"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(minutes, pages, note)}
            disabled={minutes <= 0 && pages <= 0}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Log
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Progress Slider Modal ────────────────────────────────────────

function ProgressSlider({
  item,
  onSave,
  onCancel,
}: {
  item: ReadingItem;
  onSave: (progress: number) => void;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(item.progress);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-parchment-warm border border-sumi-gray/20 rounded-xl p-6 w-full max-w-md space-y-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ ease }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Update Progress
        </h3>
        <p className="text-sumi-gray-light text-sm">
          {truncate(item.title, 50)}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Progress
            </span>
            <span className="text-ink-black font-mono text-sm">
              {Math.round(progress)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-vermillion"
          />
          <div className="h-2 bg-sumi-gray/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-vermillion/60 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sumi-gray-light hover:text-ink-black transition-colors duration-200 font-mono tracking-[0.12em] uppercase"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(progress)}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function ReadingPage() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [allItems, setAllItems] = useState<ReadingItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newType, setNewType] = useState<string>("book");
  const [newFormat, setNewFormat] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("reading");
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // Modal state
  const [completionItem, setCompletionItem] = useState<ReadingItem | null>(null);
  const [logSessionItem, setLogSessionItem] = useState<ReadingItem | null>(null);
  const [progressItem, setProgressItem] = useState<ReadingItem | null>(null);

  // Fetch all items (for heatmap/stats) once
  const fetchAllItems = useCallback(async () => {
    try {
      const res = await fetch("/api/reading");
      if (res.ok) {
        const data = await res.json();
        setAllItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch all reading items:", err);
    }
  }, []);

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

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

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
          ...(newAuthor.trim() ? { author: newAuthor.trim() } : {}),
          ...(newFormat ? { format: newFormat } : {}),
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewAuthor("");
        setNewFormat("");
        fetchItems();
        fetchAllItems();
      }
    } catch (err) {
      console.error("Failed to add reading item:", err);
    }
  }

  async function cycleStatus(id: string, currentStatus: string) {
    const item = items.find((i) => i.id === id);
    const nextStatus =
      currentStatus === "to_read"
        ? "reading"
        : currentStatus === "reading"
          ? "completed"
          : "to_read";

    // If marking as completed, show completion modal
    if (nextStatus === "completed" && item) {
      setCompletionItem({ ...item, status: nextStatus });
      return;
    }

    try {
      const res = await fetch(`/api/reading/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchItems();
        fetchAllItems();
      }
    } catch (err) {
      console.error("Failed to update reading item:", err);
    }
  }

  async function handleCompleteWithRating(rating: number, takeaway: string) {
    if (!completionItem) return;
    try {
      const res = await fetch(`/api/reading/${completionItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          progress: 100,
          ...(rating > 0 ? { rating } : {}),
          ...(takeaway.trim() ? { takeaway: takeaway.trim() } : {}),
        }),
      });
      if (res.ok) {
        setCompletionItem(null);
        fetchItems();
        fetchAllItems();
      }
    } catch (err) {
      console.error("Failed to complete item:", err);
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
        fetchAllItems();
      }
    } catch (err) {
      console.error("Failed to delete reading item:", err);
    }
  }

  async function handleLogSession(minutes: number, pages: number, note: string) {
    if (!logSessionItem) return;
    try {
      const res = await fetch(`/api/reading/${logSessionItem.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutesRead: minutes > 0 ? minutes : null,
          pagesRead: pages > 0 ? pages : null,
          note: note.trim() || null,
        }),
      });
      if (res.ok) {
        setLogSessionItem(null);
        fetchItems();
        fetchAllItems();
      }
    } catch (err) {
      console.error("Failed to log session:", err);
    }
  }

  async function handleProgressSave(progress: number) {
    if (!progressItem) return;
    try {
      const res = await fetch(`/api/reading/${progressItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      });
      if (res.ok) {
        setProgressItem(null);
        fetchItems();
        fetchAllItems();
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
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
        transition={{ duration: 0.5, ease }}
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

      {/* Reading Heatmap */}
      <motion.div
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease }}
      >
        <h2
          className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-3"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Reading Activity (90 days)
        </h2>
        <ReadingHeatmap items={allItems} />
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease }}
      >
        <ReadingStats items={allItems} />
      </motion.div>

      {/* Add Form */}
      <motion.form
        onSubmit={addItem}
        className="space-y-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
      >
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a title..."
            className="flex-1 min-w-[200px] bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
            style={{ fontSize: "var(--text-body)" }}
          />
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Author..."
            className="w-full sm:w-[180px] bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
            style={{ fontSize: "var(--text-body)" }}
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="w-full sm:w-auto bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black focus:outline-none focus:border-vermillion/30 transition-colors duration-300 appearance-none cursor-pointer"
            style={{ fontSize: "var(--text-body)" }}
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-neutral-900">
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={newFormat}
            onChange={(e) => setNewFormat(e.target.value)}
            className="w-full sm:w-auto bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black focus:outline-none focus:border-vermillion/30 transition-colors duration-300 appearance-none cursor-pointer"
            style={{ fontSize: "var(--text-body)" }}
          >
            <option value="" className="bg-neutral-900">
              Format...
            </option>
            {FORMATS.map((f) => (
              <option key={f} value={f} className="bg-neutral-900">
                {FORMAT_LABELS[f]}
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
        </div>
      </motion.form>

      {/* Filter Tabs */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease }}
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
              const isReading = item.status === "reading";

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
                    ease,
                  }}
                  className="group bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/20 transition-colors duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title + Type Badge + Format Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {item.format && (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase shrink-0 ${
                              FORMAT_COLORS[item.format] || "text-sumi-gray-light bg-sumi-gray/10"
                            }`}
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {FORMAT_LABELS[item.format] || item.format}
                          </span>
                        )}
                      </div>

                      {/* Author */}
                      {item.author && (
                        <p
                          className="text-sumi-gray-light mt-0.5"
                          style={{ fontSize: "var(--text-body)" }}
                        >
                          by {item.author}
                        </p>
                      )}

                      {/* Progress bar for currently-reading items */}
                      {isReading && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-sumi-gray/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-vermillion/60 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.6, ease }}
                            />
                          </div>
                          <button
                            onClick={() => setProgressItem(item)}
                            className="text-sumi-gray-light hover:text-vermillion font-mono text-xs transition-colors duration-200 shrink-0"
                          >
                            {Math.round(item.progress)}%
                          </button>
                        </div>
                      )}

                      {/* Takeaway for completed items */}
                      {isCompleted && item.takeaway && (
                        <p
                          className="text-sumi-gray-light mt-1 italic"
                          style={{ fontSize: "var(--text-body)" }}
                        >
                          &ldquo;{item.takeaway}&rdquo;
                        </p>
                      )}

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

                      {/* Action buttons row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <button
                          onClick={() => toggleNotes(item)}
                          className="text-vermillion/70 hover:text-vermillion font-mono tracking-[0.08em] uppercase transition-colors duration-200"
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {isNotesOpen
                            ? "Hide notes"
                            : item.notes
                              ? "Edit notes"
                              : "Add notes"}
                        </button>
                        {isReading && (
                          <>
                            <button
                              onClick={() => setProgressItem(item)}
                              className="text-vermillion/70 hover:text-vermillion font-mono tracking-[0.08em] uppercase transition-colors duration-200"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              Update Progress
                            </button>
                            <button
                              onClick={() => setLogSessionItem(item)}
                              className="text-vermillion/70 hover:text-vermillion font-mono tracking-[0.08em] uppercase transition-colors duration-200"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              Log Session
                            </button>
                          </>
                        )}
                      </div>

                      {/* Expandable Notes Textarea */}
                      <AnimatePresence initial={false}>
                        {isNotesOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.3,
                              ease,
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
                    <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
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

      {/* Modals */}
      <AnimatePresence>
        {completionItem && (
          <CompletionModal
            key="completion"
            item={completionItem}
            onSave={handleCompleteWithRating}
            onCancel={() => {
              // Skip = complete without rating
              handleCompleteWithRating(0, "");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {logSessionItem && (
          <LogSessionModal
            key="log-session"
            item={logSessionItem}
            onSave={handleLogSession}
            onCancel={() => setLogSessionItem(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {progressItem && (
          <ProgressSlider
            key="progress"
            item={progressItem}
            onSave={handleProgressSave}
            onCancel={() => setProgressItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
