"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────
type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  value: number;
  skipped: boolean;
  note?: string;
};

type Habit = {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  frequencyPerPeriod: number;
  period: string;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  archived: boolean;
  streak: number;
  logs: HabitLog[];
  healthKey: string | null;
};

type HabitFormData = {
  title: string;
  type: string;
  targetValue: number;
  frequencyPerPeriod: number;
  period: string;
  color: string;
  icon: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const HABIT_TYPES = ["daily", "frequency", "quantity", "negative", "timed"] as const;
const TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  frequency: "Frequency",
  quantity: "Quantity",
  negative: "Negative",
  timed: "Timed",
};
const COLOR_OPTIONS = [
  { name: "vermillion", value: "#D03A2C", tw: "bg-vermillion" },
  { name: "gold", value: "#C9A84C", tw: "bg-gold-seal" },
  { name: "green", value: "#22C55E", tw: "bg-green-500" },
  { name: "blue", value: "#3B82F6", tw: "bg-blue-500" },
  { name: "purple", value: "#A855F7", tw: "bg-purple-500" },
];
const DEFAULT_FORM: HabitFormData = {
  title: "",
  type: "daily",
  targetValue: 1,
  frequencyPerPeriod: 3,
  period: "week",
  color: "#D03A2C",
  icon: "",
};

// ─── Helpers ──────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDays(count: number): { dateStr: string; dayLetter: string; dayNum: number }[] {
  const days: { dateStr: string; dayLetter: string; dayNum: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const letters = ["S", "M", "T", "W", "T", "F", "S"];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: fmtDate(d),
      dayLetter: letters[d.getDay()],
      dayNum: d.getDate(),
    });
  }
  return days;
}

function getLogForDate(logs: HabitLog[], dateStr: string): HabitLog | undefined {
  return logs.find((log) => {
    const d = new Date(log.date);
    return fmtDate(d) === dateStr;
  });
}

function getWeekCompletionPercent(habits: Habit[]): number {
  if (habits.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  // Monday-based: Mon=0 ... Sun=6
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(monday.getDate() - mondayOffset);

  const daysElapsed = mondayOffset + 1; // including today
  let totalSlots = 0;
  let completedSlots = 0;

  for (const habit of habits) {
    if (habit.type === "negative") {
      // For negative habits, each day without a log counts as completed
      for (let i = 0; i < daysElapsed; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        const ds = fmtDate(d);
        totalSlots++;
        const log = getLogForDate(habit.logs, ds);
        if (!log) completedSlots++;
      }
    } else {
      for (let i = 0; i < daysElapsed; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        const ds = fmtDate(d);
        totalSlots++;
        const log = getLogForDate(habit.logs, ds);
        if (log && log.completed && !log.skipped) completedSlots++;
      }
    }
  }

  return totalSlots === 0 ? 0 : Math.round((completedSlots / totalSlots) * 100);
}

function isPerfectDay(habits: Habit[]): boolean {
  if (habits.length === 0) return false;
  const todayStr = fmtDate(new Date());

  return habits.every((habit) => {
    const log = getLogForDate(habit.logs, todayStr);
    if (habit.type === "negative") return !log;
    if (habit.type === "quantity") return log && log.value >= habit.targetValue;
    return log && log.completed && !log.skipped;
  });
}

// ─── SVG Progress Ring ────────────────────────────────────────────
function ProgressRing({
  value,
  target,
  color,
  size = 28,
}: {
  value: number;
  target: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / Math.max(target, 1), 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-sumi-gray/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-300"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={8}
        fontFamily="monospace"
      >
        {value}
      </text>
    </svg>
  );
}

// ─── Skipped Dot ──────────────────────────────────────────────────
function SkippedDot() {
  return (
    <div className="w-7 h-7 rounded-full bg-sumi-gray/20 relative flex items-center justify-center">
      <div
        className="absolute w-5 h-[2px] bg-sumi-gray/60 rounded-full"
        style={{ transform: "rotate(-45deg)" }}
      />
    </div>
  );
}

// ─── Quantity Popover ─────────────────────────────────────────────
function QuantityPopover({
  currentValue,
  target,
  onSave,
  onClose,
}: {
  currentValue: number;
  target: number;
  onSave: (v: number) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(currentValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 4 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-sumi-gray/20 rounded-xl p-3 shadow-lg flex flex-col gap-2 items-center"
      style={{ minWidth: 120 }}
    >
      <label
        className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
        style={{ fontSize: "var(--text-micro)" }}
      >
        Value / {target}
      </label>
      <input
        ref={inputRef}
        type="number"
        min={0}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(val);
          if (e.key === "Escape") onClose();
        }}
        className="w-20 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-3 py-1.5 text-ink-black text-center focus:outline-none focus:border-vermillion/30"
        style={{ fontSize: "var(--text-body)" }}
      />
      <button
        onClick={() => onSave(val)}
        className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-4 py-1.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 w-full"
        style={{ fontSize: "var(--text-micro)" }}
      >
        Save
      </button>
    </motion.div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────
function HabitContextMenu({
  onEdit,
  onArchive,
  onClose,
}: {
  onEdit: () => void;
  onArchive: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15, ease: EASE }}
      className="absolute z-50 top-full mt-1 left-0 bg-white border border-sumi-gray/20 rounded-xl shadow-lg overflow-hidden"
      style={{ minWidth: 140 }}
    >
      <button
        onClick={onEdit}
        className="w-full text-left px-4 py-2.5 text-ink-black hover:bg-parchment-warm/40 transition-colors duration-200 font-mono tracking-[0.04em]"
        style={{ fontSize: "var(--text-body)" }}
      >
        Edit
      </button>
      <button
        onClick={onArchive}
        className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors duration-200 font-mono tracking-[0.04em]"
        style={{ fontSize: "var(--text-body)" }}
      >
        Archive
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── Main Page ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<HabitFormData>({ ...DEFAULT_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [quantityPopover, setQuantityPopover] = useState<{
    habitId: string;
    dateStr: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Data fetching ─────────────────────────────────────────────
  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (err) {
      console.error("Failed to fetch habits:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Auto-scroll grid to right on mount
  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [loading]);

  // ─── Dot tap handler ──────────────────────────────────────────
  async function handleDotTap(habit: Habit, dateStr: string) {
    const log = getLogForDate(habit.logs, dateStr);

    if (habit.type === "quantity") {
      setQuantityPopover({ habitId: habit.id, dateStr });
      return;
    }

    if (habit.type === "negative") {
      // Negative: tap toggles slip (log exists = slipped)
      if (log) {
        // Optimistic: remove log
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id
              ? { ...h, logs: h.logs.filter((l) => l.id !== log.id) }
              : h
          )
        );
        // Delete (toggle off)
        await fetch(`/api/habits/${habit.id}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr }),
        });
      } else {
        // Create slip log
        const tempLog: HabitLog = {
          id: `temp-${Date.now()}`,
          habitId: habit.id,
          date: dateStr,
          completed: true,
          value: 1,
          skipped: false,
        };
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id ? { ...h, logs: [...h.logs, tempLog] } : h
          )
        );
        await fetch(`/api/habits/${habit.id}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr }),
        });
      }
      // Refresh to get correct streak
      fetchHabits();
      return;
    }

    // daily / frequency / timed: 3-state cycle
    // empty → done → skipped → empty
    if (!log) {
      // empty → done (create completed log)
      const tempLog: HabitLog = {
        id: `temp-${Date.now()}`,
        habitId: habit.id,
        date: dateStr,
        completed: true,
        value: 1,
        skipped: false,
      };
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, logs: [...h.logs, tempLog] } : h
        )
      );
      await fetch(`/api/habits/${habit.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
    } else if (log.completed && !log.skipped) {
      // done → skipped
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id
            ? {
                ...h,
                logs: h.logs.map((l) =>
                  l.id === log.id
                    ? { ...l, completed: false, skipped: true }
                    : l
                ),
              }
            : h
        )
      );
      await fetch(`/api/habits/${habit.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, skipped: true }),
      });
    } else {
      // skipped → empty (delete)
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id
            ? { ...h, logs: h.logs.filter((l) => l.id !== log.id) }
            : h
        )
      );
      await fetch(`/api/habits/${habit.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
    }
    fetchHabits();
  }

  async function handleQuantitySave(habitId: string, dateStr: string, value: number) {
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const existingLog = getLogForDate(h.logs, dateStr);
        if (existingLog) {
          return {
            ...h,
            logs: h.logs.map((l) =>
              l.id === existingLog.id ? { ...l, value, completed: true } : l
            ),
          };
        }
        return {
          ...h,
          logs: [
            ...h.logs,
            {
              id: `temp-${Date.now()}`,
              habitId,
              date: dateStr,
              completed: true,
              value,
              skipped: false,
            },
          ],
        };
      })
    );
    setQuantityPopover(null);

    await fetch(`/api/habits/${habitId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, value }),
    });
    fetchHabits();
  }

  // ─── Form handlers ────────────────────────────────────────────
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const payload: Record<string, unknown> = {
      title: formData.title.trim(),
      type: formData.type,
      color: formData.color,
    };
    if (formData.icon) payload.icon = formData.icon;
    if (formData.type === "quantity") payload.targetValue = formData.targetValue;
    if (formData.type === "frequency") {
      payload.frequencyPerPeriod = formData.frequencyPerPeriod;
      payload.period = formData.period;
    }

    try {
      if (editingId) {
        await fetch(`/api/habits/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setFormData({ ...DEFAULT_FORM });
      setFormOpen(false);
      setEditingId(null);
      fetchHabits();
    } catch (err) {
      console.error("Failed to save habit:", err);
    }
  }

  async function archiveHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setContextMenuId(null);
    await fetch(`/api/habits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    fetchHabits();
  }

  function startEdit(habit: Habit) {
    setFormData({
      title: habit.title,
      type: habit.type,
      targetValue: habit.targetValue,
      frequencyPerPeriod: habit.frequencyPerPeriod,
      period: habit.period,
      color: habit.color || "#D03A2C",
      icon: habit.icon || "",
    });
    setEditingId(habit.id);
    setFormOpen(true);
    setContextMenuId(null);
  }

  // ─── Long press ────────────────────────────────────────────────
  function handlePointerDown(habitId: string) {
    longPressTimer.current = setTimeout(() => {
      setContextMenuId(habitId);
    }, 500);
  }

  function handlePointerUp() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  // ─── Derived state ────────────────────────────────────────────
  const days = getDays(expanded ? 30 : 7);
  const weekPercent = getWeekCompletionPercent(habits);
  const perfectDay = isPerfectDay(habits);
  const todayStr = fmtDate(new Date());

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h1
          className={`text-ink-black font-light${perfectDay ? " vermillion-glow" : ""}`}
          style={{ fontSize: "var(--text-heading)" }}
        >
          Habits
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Small daily actions that compound over time.
        </p>
      </motion.div>

      {/* Weekly completion bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: EASE }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
            style={{ fontSize: "var(--text-micro)" }}
          >
            This Week
          </span>
          <span
            className="font-mono tracking-[0.08em] text-vermillion"
            style={{ fontSize: "var(--text-micro)" }}
          >
            {weekPercent}%
          </span>
        </div>
        <div className="w-full h-2 bg-vermillion/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-vermillion rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${weekPercent}%` }}
            transition={{ duration: 0.8, ease: EASE }}
          />
        </div>
      </motion.div>

      {/* Add / Edit Habit Form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
      >
        {!formOpen ? (
          <button
            onClick={() => {
              setFormData({ ...DEFAULT_FORM });
              setEditingId(null);
              setFormOpen(true);
            }}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            + Add Habit
          </button>
        ) : (
          <motion.form
            onSubmit={handleFormSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 space-y-4"
          >
            {/* Title */}
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Habit name..."
              className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
              style={{ fontSize: "var(--text-body)" }}
              autoFocus
            />

            {/* Type Picker */}
            <div>
              <label
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-2"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, type: t }))
                    }
                    className={`px-3 py-1.5 rounded-full border font-mono tracking-[0.04em] transition-all duration-200 ${
                      formData.type === t
                        ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
                        : "border-sumi-gray/20 text-sumi-gray-light hover:border-sumi-gray/40"
                    }`}
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional: Quantity target */}
            <AnimatePresence>
              {formData.type === "quantity" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  <label
                    className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-2"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    Target Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.targetValue}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetValue: Number(e.target.value),
                      }))
                    }
                    className="w-32 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black focus:outline-none focus:border-vermillion/30"
                    style={{ fontSize: "var(--text-body)" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conditional: Frequency */}
            <AnimatePresence>
              {formData.type === "frequency" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="number"
                    min={1}
                    value={formData.frequencyPerPeriod}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        frequencyPerPeriod: Number(e.target.value),
                      }))
                    }
                    className="w-20 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-3 py-2.5 text-ink-black text-center focus:outline-none focus:border-vermillion/30"
                    style={{ fontSize: "var(--text-body)" }}
                  />
                  <span
                    className="text-sumi-gray-light font-mono"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    times per
                  </span>
                  <select
                    value={formData.period}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        period: e.target.value,
                      }))
                    }
                    className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-3 py-2.5 text-ink-black focus:outline-none focus:border-vermillion/30"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    <option value="day">day</option>
                    <option value="week">week</option>
                    <option value="month">month</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Color Picker */}
            <div>
              <label
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-2"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Color
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color: c.value }))
                    }
                    className={`w-7 h-7 rounded-full transition-all duration-200 ${
                      formData.color === c.value
                        ? "ring-2 ring-offset-2 ring-sumi-gray/40 scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div>
              <label
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light block mb-2"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Icon (emoji)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, icon: e.target.value }))
                }
                placeholder="e.g. 💪"
                className="w-20 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black text-center placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
                style={{ fontSize: "var(--text-body)" }}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!formData.title.trim()}
                className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontSize: "var(--text-micro)" }}
              >
                {editingId ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setEditingId(null);
                  setFormData({ ...DEFAULT_FORM });
                }}
                className="border border-sumi-gray/20 text-sumi-gray-light rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:border-sumi-gray/40 transition-all duration-300"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>

      {/* 30-Day Dot Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl"
      >
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
          ) : habits.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-12 text-center"
            >
              No habits yet. Start building one.
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                ref={scrollRef}
                className="overflow-x-auto"
                style={{ scrollBehavior: "smooth" }}
              >
                <table className="w-max min-w-full border-collapse">
                  <thead>
                    <tr>
                      {/* Sticky habit name column header */}
                      <th className="sticky left-0 z-10 bg-parchment-warm/90 backdrop-blur-sm px-4 py-3 text-left min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Habit
                          </span>
                          <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-sumi-gray-light/60 hover:text-ink-black transition-colors duration-200 font-mono"
                            style={{ fontSize: "10px" }}
                            title={expanded ? "Show 7 days" : "Show 30 days"}
                          >
                            {expanded ? "7d" : "30d"}
                          </button>
                        </div>
                      </th>
                      {days.map((day) => (
                        <th
                          key={day.dateStr}
                          className={`px-0.5 py-2 text-center min-w-[36px] ${
                            day.dateStr === todayStr
                              ? "bg-vermillion/5"
                              : ""
                          }`}
                        >
                          <div
                            className="font-mono text-sumi-gray-light leading-tight"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            <div>{day.dayLetter}</div>
                            <div className="opacity-60">{day.dayNum}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((habit, i) => (
                      <motion.tr
                        key={habit.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: i * 0.03,
                          duration: 0.3,
                          ease: EASE,
                        }}
                        className="border-t border-sumi-gray/10"
                      >
                        {/* Sticky habit name cell */}
                        <td className="sticky left-0 z-10 bg-parchment-warm/90 backdrop-blur-sm px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[140px] relative">
                            <div
                              className="flex items-center gap-2 cursor-pointer select-none"
                              onPointerDown={() =>
                                handlePointerDown(habit.id)
                              }
                              onPointerUp={handlePointerUp}
                              onPointerLeave={handlePointerUp}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenuId(habit.id);
                              }}
                            >
                              {habit.icon && (
                                <span className="text-base">{habit.icon}</span>
                              )}
                              <span
                                className="text-ink-black font-light leading-snug truncate max-w-[120px]"
                                style={{ fontSize: "var(--text-body)" }}
                              >
                                {habit.title}
                              </span>
                              {habit.streak > 0 && (
                                <span
                                  className="text-vermillion font-mono shrink-0"
                                  style={{ fontSize: "var(--text-micro)" }}
                                >
                                  {"\uD83D\uDD25"} {habit.streak}
                                </span>
                              )}
                              {habit.healthKey && (
                                <span
                                  className="text-sumi-gray-light/50 font-mono shrink-0 uppercase"
                                  style={{ fontSize: "9px" }}
                                >
                                  auto
                                </span>
                              )}
                            </div>

                            <AnimatePresence>
                              {contextMenuId === habit.id && (
                                <HabitContextMenu
                                  onEdit={() => startEdit(habit)}
                                  onArchive={() => archiveHabit(habit.id)}
                                  onClose={() => setContextMenuId(null)}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </td>

                        {/* Dot cells */}
                        {days.map((day) => {
                          const log = getLogForDate(habit.logs, day.dateStr);
                          const habitColor = habit.color || "#D03A2C";

                          return (
                            <td
                              key={day.dateStr}
                              className={`px-0.5 py-2 text-center relative ${
                                day.dateStr === todayStr
                                  ? "bg-vermillion/5"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-center">
                                {/* Quantity type: progress ring */}
                                {habit.type === "quantity" ? (
                                  <button
                                    onClick={() =>
                                      handleDotTap(habit, day.dateStr)
                                    }
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sumi-gray/10 transition-colors duration-200"
                                  >
                                    <ProgressRing
                                      value={log ? log.value : 0}
                                      target={habit.targetValue}
                                      color={habitColor}
                                    />
                                  </button>
                                ) : habit.type === "negative" ? (
                                  /* Negative type: inverted logic */
                                  <button
                                    onClick={() =>
                                      handleDotTap(habit, day.dateStr)
                                    }
                                    className="w-8 h-8 flex items-center justify-center"
                                  >
                                    {log ? (
                                      <div className="w-7 h-7 rounded-full bg-red-400 transition-all duration-200" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-green-500/60 transition-all duration-200" />
                                    )}
                                  </button>
                                ) : (
                                  /* Daily / Frequency / Timed: 3-state */
                                  <button
                                    onClick={() =>
                                      handleDotTap(habit, day.dateStr)
                                    }
                                    className="w-8 h-8 flex items-center justify-center"
                                  >
                                    {log && log.skipped ? (
                                      <SkippedDot />
                                    ) : log && log.completed ? (
                                      <div
                                        className="w-7 h-7 rounded-full transition-all duration-200"
                                        style={{
                                          backgroundColor: habitColor,
                                        }}
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full border border-sumi-gray/30 transition-all duration-200 hover:border-sumi-gray/50" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Quantity Popover */}
                              <AnimatePresence>
                                {quantityPopover &&
                                  quantityPopover.habitId === habit.id &&
                                  quantityPopover.dateStr === day.dateStr && (
                                    <QuantityPopover
                                      currentValue={log ? log.value : 0}
                                      target={habit.targetValue}
                                      onSave={(v) =>
                                        handleQuantitySave(
                                          habit.id,
                                          day.dateStr,
                                          v
                                        )
                                      }
                                      onClose={() =>
                                        setQuantityPopover(null)
                                      }
                                    />
                                  )}
                              </AnimatePresence>
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
