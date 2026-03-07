"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: string;
  createdAt: string;
};

type Filter = "active" | "completed" | "paused";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Paused", value: "paused" },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("active");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error("Failed to fetch goals:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setNewTitle("");
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  }

  async function updateGoalStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchGoals();
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  }

  async function deleteGoal(id: string) {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) fetchGoals();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  }

  function formatDeadline(deadline: string | null) {
    if (!deadline) return null;
    return new Date(deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Goals
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Track what you&apos;re building toward.
        </p>
      </motion.div>

      {/* Add Goal Form */}
      <motion.form
        onSubmit={addGoal}
        className="flex gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New goal..."
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

      {/* Goals List */}
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
          ) : goals.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              No {filter} goals yet.
            </motion.div>
          ) : (
            goals.map((goal, i) => (
              <motion.div
                key={goal.id}
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
                    <h3
                      className={`text-ink-black font-light leading-snug ${
                        goal.status === "completed"
                          ? "line-through opacity-50"
                          : ""
                      }`}
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-sumi-gray-light text-sm mt-1 leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                    {goal.deadline && (
                      <p
                        className="font-mono tracking-[0.08em] text-sumi-gray mt-2"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        Due {formatDeadline(goal.deadline)}
                      </p>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                    {goal.status !== "completed" ? (
                      <button
                        onClick={() => updateGoalStatus(goal.id, "completed")}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-green-400 hover:bg-green-400/10 transition-colors duration-200"
                        title="Complete"
                      >
                        &#10003;
                      </button>
                    ) : (
                      <button
                        onClick={() => updateGoalStatus(goal.id, "active")}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-vermillion hover:bg-vermillion/10 transition-colors duration-200"
                        title="Reactivate"
                      >
                        &#8617;
                      </button>
                    )}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
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
