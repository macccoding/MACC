"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export function FocusTimer() {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active session on mount
  useEffect(() => {
    fetch("/api/focus?days=1")
      .then((r) => r.json())
      .then((sessions: FocusSession[]) => {
        const active = sessions.find((s) => s.status === "active");
        if (active) {
          setSession(active);
          const elapsed = (Date.now() - new Date(active.startedAt).getTime()) / 1000;
          const left = Math.max(0, active.durationMinutes * 60 - elapsed);
          setRemaining(Math.ceil(left));
        }
      })
      .catch(() => {});
  }, []);

  // Countdown interval
  useEffect(() => {
    if (!session || session.status !== "active") return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const completeSession = useCallback(async () => {
    if (!session) return;
    const elapsed = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 60000
    );
    await fetch("/api/focus", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: session.id,
        status: "completed",
        actualMinutes: elapsed,
      }),
    });
    setSession(null);
    setRemaining(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [session]);

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
      const data = await resp.json();
      setSession(data);
      setRemaining(minutes * 60);
      setExpanded(false);
      setLabel("");
    }
  }

  async function cancelSession() {
    if (!session) return;
    const elapsed = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 60000
    );
    await fetch("/api/focus", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: session.id,
        status: "cancelled",
        actualMinutes: elapsed,
      }),
    });
    setSession(null);
    setRemaining(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progress = session
    ? 1 - remaining / (session.durationMinutes * 60)
    : 0;

  // Active session pill (collapsed)
  if (session && !expanded) {
    return (
      <div className="fixed bottom-20 lg:bottom-4 right-4 z-40">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 bg-parchment border border-sumi-gray/20 rounded-full px-4 py-2 shadow-lg hover:border-vermillion/30 transition-colors"
        >
          <div className="relative w-5 h-5">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="#e0d6c8" strokeWidth="2" />
              <circle
                cx="10" cy="10" r="8"
                fill="none"
                stroke="#D03A2C"
                strokeWidth="2"
                strokeDasharray={`${progress * 50.26} 50.26`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-sm font-mono text-ink-black">{formatTime(remaining)}</span>
          {session.label && (
            <span className="text-xs text-sumi-gray-light max-w-20 truncate">{session.label}</span>
          )}
        </button>
      </div>
    );
  }

  // Expanded card (active session or launcher)
  return (
    <AnimatePresence>
      {(session || expanded) && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 lg:bottom-4 right-4 z-40 w-72"
        >
          <div className="bg-parchment border border-sumi-gray/20 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px]">
                {session ? (session.type === "break" ? "Break" : "Focusing") : "Start Focus"}
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="text-sumi-gray-light hover:text-ink-black"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={session ? "M19 9l-7 7-7-7" : "M6 18L18 6M6 6l12 12"} />
                </svg>
              </button>
            </div>

            {session ? (
              <>
                {session.label && (
                  <p className="text-sm text-ink-black/70 mb-2">{session.label}</p>
                )}
                <div className="text-center mb-4">
                  <p className="text-4xl font-mono font-bold text-ink-black">{formatTime(remaining)}</p>
                  <div className="w-full bg-sumi-gray/10 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-vermillion h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={completeSession}
                    className="flex-1 py-2 rounded-lg text-sm bg-vermillion text-white hover:bg-vermillion/90 transition-colors"
                  >
                    Complete
                  </button>
                  <button
                    onClick={cancelSession}
                    className="flex-1 py-2 rounded-lg text-sm bg-parchment-warm text-sumi-gray-light hover:bg-parchment-warm/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full bg-parchment-warm/60 border border-sumi-gray/15 rounded-lg px-3 py-2 text-sm text-ink-black placeholder-sumi-gray-light outline-none focus:border-vermillion/30 mb-3"
                />
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => startSession(p.minutes, p.type)}
                      className="py-2 rounded-lg text-sm bg-parchment-warm text-ink-black/70 hover:bg-vermillion hover:text-white transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Launcher button to toggle the FocusTimer expanded state */
export function FocusLaunchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 lg:bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-parchment border border-sumi-gray/20 shadow-lg flex items-center justify-center hover:border-vermillion/30 transition-colors"
      title="Focus Timer"
    >
      <span className="text-lg font-serif text-ink-black/60">集</span>
    </button>
  );
}
