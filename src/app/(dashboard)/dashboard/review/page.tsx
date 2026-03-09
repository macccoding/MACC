"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ease = [0.22, 1, 0.36, 1] as const;

export default function ReviewPage() {
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reflections, setReflections] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadReview() {
    try {
      const resp = await fetch("/api/weekly-review");
      if (resp.ok) {
        const data = await resp.json();
        setReview(data);
        if (data?.reflections) setReflections(data.reflections);
      }
    } catch {}
    setLoading(false);
  }

  async function generateReview() {
    setGenerating(true);
    try {
      const resp = await fetch("/api/weekly-review", { method: "POST" });
      if (resp.ok) {
        const data = await resp.json();
        setReview(data);
      }
    } catch {}
    setGenerating(false);
  }

  async function saveReflections() {
    if (!review) return;
    setSaving(true);
    try {
      await fetch("/api/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflections, status: "completed" }),
      });
      setReview({ ...review, reflections, status: "completed" });
    } catch {}
    setSaving(false);
  }

  useEffect(() => { loadReview(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-vermillion border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center justify-between"
      >
        <h1 className="text-ink-black font-light" style={{ fontSize: "var(--text-heading)" }}>
          <span className="font-serif text-ink-black/60 mr-2">省</span>
          Weekly Review
        </h1>
        <button
          onClick={generateReview}
          disabled={generating}
          className="px-4 py-2 rounded-lg text-sm bg-vermillion text-white hover:bg-vermillion/90 disabled:opacity-50 transition-colors"
        >
          {generating ? "Generating..." : review ? "Refresh" : "Generate Review"}
        </button>
      </motion.div>

      {!review ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-8 text-center"
        >
          <p className="text-sumi-gray-light mb-4">No review for this week yet.</p>
          <p className="text-sm text-sumi-gray-light">Click &quot;Generate Review&quot; to aggregate your weekly stats.</p>
        </motion.div>
      ) : (
        <>
          {/* Week label */}
          <p className="text-sm text-sumi-gray-light">
            Week of {new Date(review.weekOf).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {review.status === "completed" && (
              <span className="ml-2 text-vermillion">Completed</span>
            )}
          </p>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {[
              { label: "Tasks Done", value: review.stats?.tasksCompleted ?? 0, color: "text-green-600" },
              { label: "Habits Logged", value: review.stats?.habitsLogged ?? 0, color: "text-blue-600" },
              { label: "Workouts", value: review.stats?.workouts ?? 0, color: "text-yellow-600" },
              { label: "Avg Mood", value: review.stats?.avgMood ? `${review.stats.avgMood}/5` : "—", color: "text-purple-600" },
              { label: "Focus Time", value: `${review.stats?.focusMinutes ?? 0}m`, color: "text-orange-600" },
              { label: "Spent", value: `$${(review.stats?.totalSpent ?? 0).toFixed(0)}`, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 text-center">
                <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px]">{s.label}</p>
                <p className={`text-2xl font-light mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </motion.div>

          {/* AI Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease }}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
          >
            <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px] mb-3">
              Reflection Prompts
            </p>
            <div className="space-y-3">
              {(review.aiPrompts || []).map((prompt: string, i: number) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-vermillion text-sm mt-0.5">{i + 1}.</span>
                  <p className="text-sm text-ink-black/80">{prompt}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Reflections */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease }}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
          >
            <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px] mb-3">
              Your Reflections
            </p>
            <textarea
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              placeholder="Write your reflections here..."
              rows={6}
              className="w-full bg-parchment-warm/60 border border-sumi-gray/15 rounded-lg px-4 py-3 text-sm text-ink-black placeholder-sumi-gray-light outline-none resize-none focus:border-vermillion/30"
            />
            <button
              onClick={saveReflections}
              disabled={saving || !reflections.trim()}
              className="mt-3 px-6 py-2 rounded-lg text-sm bg-vermillion text-white hover:bg-vermillion/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Reflections"}
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}
