"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
};

type Habit = {
  id: string;
  title: string;
  frequency: string;
  streak: number;
  logs: HabitLog[];
  createdAt: string;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getLast7Days(): { dateStr: string; label: string }[] {
  const days: { dateStr: string; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ dateStr, label: DAY_LABELS[d.getDay()] });
  }

  return days;
}

function isCompletedOn(logs: HabitLog[], dateStr: string): boolean {
  return logs.some((log) => {
    const d = new Date(log.date);
    const logStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return logStr === dateStr && log.completed;
  });
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
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

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setNewTitle("");
        fetchHabits();
      }
    } catch (err) {
      console.error("Failed to add habit:", err);
    }
  }

  async function deleteHabit(id: string) {
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      if (res.ok) fetchHabits();
    } catch (err) {
      console.error("Failed to delete habit:", err);
    }
  }

  async function toggleDay(habitId: string, dateStr: string) {
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      if (res.ok) fetchHabits();
    } catch (err) {
      console.error("Failed to toggle habit day:", err);
    }
  }

  const last7Days = getLast7Days();

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
          Habits
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Small daily actions that compound over time.
        </p>
      </motion.div>

      {/* Add Habit Form */}
      <motion.form
        onSubmit={addHabit}
        className="flex gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New habit..."
          className="flex-1 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
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

      {/* Habits List */}
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
          ) : habits.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              No habits yet. Start building one.
            </motion.div>
          ) : (
            habits.map((habit, i) => (
              <motion.div
                key={habit.id}
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
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <h3
                      className="text-ink-black font-light leading-snug truncate"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {habit.title}
                    </h3>
                    {habit.streak > 0 && (
                      <span
                        className="font-mono tracking-[0.08em] text-vermillion shrink-0"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {habit.streak}d streak
                      </span>
                    )}
                  </div>

                  {/* Delete button — visible on hover */}
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 shrink-0"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>

                {/* 7-Day Grid */}
                <div className="flex gap-1.5">
                  {last7Days.map((day) => {
                    const completed = isCompletedOn(habit.logs, day.dateStr);
                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => toggleDay(habit.id, day.dateStr)}
                        className={`w-9 h-9 rounded-lg border text-xs font-mono tracking-wide transition-all duration-200 ${
                          completed
                            ? "bg-vermillion/20 border-vermillion/40 text-vermillion"
                            : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray hover:border-sumi-gray/20"
                        }`}
                        title={day.dateStr}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
