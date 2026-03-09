"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FocusSession {
  id: string;
  type: string;
  durationMinutes: number;
  actualMinutes: number | null;
  label: string | null;
  status: string;
  startedAt: string;
}

const PRESETS = [
  { label: "25min", minutes: 25, type: "pomodoro" },
  { label: "50min", minutes: 50, type: "deep_work" },
  { label: "5min", minutes: 5, type: "break" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function FocusPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");

  useEffect(() => {
    fetch("/api/focus?days=30")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function startSession(minutes: number, type: string) {
    const resp = await fetch("/api/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        durationMinutes: minutes,
        label: label.trim() || undefined,
      }),
    });
    if (resp.ok) {
      setLabel("");
      // Reload sessions
      const data = await fetch("/api/focus?days=30").then((r) => r.json());
      setSessions(data);
    }
  }

  const completed = sessions.filter((s) => s.status === "completed");
  const today = new Date().toISOString().split("T")[0];
  const todayMinutes = completed
    .filter((s) => s.startedAt.startsWith(today))
    .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const weekMinutes = completed
    .filter((s) => s.startedAt >= weekAgo)
    .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-vermillion border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="text-ink-black font-light"
        style={{ fontSize: "var(--text-heading)" }}
      >
        <span className="font-serif text-ink-black/60 mr-2">集</span>
        Focus Timer
      </motion.h1>

      {/* Start a session */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
      >
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What are you working on?"
          className="w-full bg-parchment-warm/60 border border-sumi-gray/15 rounded-lg px-4 py-3 text-ink-black placeholder-sumi-gray-light outline-none focus:border-vermillion/30 mb-4"
        />
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => startSession(p.minutes, p.type)}
              className="py-4 rounded-xl text-lg font-semibold bg-parchment-warm text-ink-black/70 hover:bg-vermillion hover:text-white transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Today", value: `${todayMinutes}m` },
          { label: "This Week", value: `${weekMinutes}m` },
          { label: "Sessions", value: completed.length },
        ].map((s) => (
          <div key={s.label} className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 text-center">
            <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px]">{s.label}</p>
            <p className="text-2xl font-light text-ink-black mt-1">{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
      >
        <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px] mb-3">
          Recent Sessions
        </p>
        {completed.length === 0 ? (
          <p className="text-sumi-gray-light text-sm">No focus sessions yet. Start one above!</p>
        ) : (
          <div className="space-y-2">
            {completed.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-sumi-gray/10 last:border-0">
                <div>
                  <p className="text-sm text-ink-black/80">{s.label || s.type}</p>
                  <p className="text-xs text-sumi-gray-light">
                    {new Date(s.startedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(s.startedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-sm text-vermillion">{s.actualMinutes || s.durationMinutes}m</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
