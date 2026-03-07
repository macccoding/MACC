"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LearningLog = {
  id: string;
  date: string;
  notes: string;
  duration: number | null;
};

type LearningTrack = {
  id: string;
  title: string;
  type: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  logs: LearningLog[];
};

const TRACK_TYPES = ["course", "book", "language", "skill"] as const;
type TrackType = (typeof TRACK_TYPES)[number];

const TYPE_COLORS: Record<TrackType, { bg: string; border: string; text: string }> = {
  course: {
    bg: "bg-vermillion/15",
    border: "border-vermillion/30",
    text: "text-vermillion",
  },
  book: {
    bg: "bg-gold-seal/15",
    border: "border-gold-seal/30",
    text: "text-gold-seal",
  },
  language: {
    bg: "bg-sumi-gray/15",
    border: "border-sumi-gray/30",
    text: "text-sumi-gray",
  },
  skill: {
    bg: "bg-vermillion-glow/15",
    border: "border-vermillion-glow/30",
    text: "text-vermillion-glow",
  },
};

const ease = [0.22, 1, 0.36, 1] as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function LearningPage() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<TrackType>("course");
  const [loggingTrackId, setLoggingTrackId] = useState<string | null>(null);
  const [logNotes, setLogNotes] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [savingLog, setSavingLog] = useState(false);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/learning");
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  async function addTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), type: newType }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewType("course");
        fetchTracks();
      }
    } catch (err) {
      console.error("Failed to add track:", err);
    }
  }

  async function updateProgress(id: string, progress: number) {
    try {
      const res = await fetch(`/api/learning/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      });
      if (res.ok) {
        setTracks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, progress } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  }

  async function logSession(e: React.FormEvent, trackId: string) {
    e.preventDefault();
    setSavingLog(true);
    try {
      const body: Record<string, unknown> = { notes: logNotes.trim() };
      if (logDuration) body.duration = parseInt(logDuration, 10);

      const res = await fetch(`/api/learning/${trackId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setLoggingTrackId(null);
        setLogNotes("");
        setLogDuration("");
        fetchTracks();
      }
    } catch (err) {
      console.error("Failed to log session:", err);
    } finally {
      setSavingLog(false);
    }
  }

  async function deleteTrack(id: string) {
    try {
      const res = await fetch(`/api/learning/${id}`, { method: "DELETE" });
      if (res.ok) fetchTracks();
    } catch (err) {
      console.error("Failed to delete track:", err);
    }
  }

  function getTypeColor(type: string) {
    return TYPE_COLORS[type as TrackType] ?? TYPE_COLORS.course;
  }

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
          Learning
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Sharpen the blade every day.
        </p>
      </motion.div>

      {/* Add Track Form */}
      <motion.form
        onSubmit={addTrack}
        className="flex gap-3 flex-wrap sm:flex-nowrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What are you learning?"
          className="flex-1 min-w-0 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as TrackType)}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-3 py-2.5 text-ink-black font-mono tracking-[0.08em] focus:outline-none focus:border-vermillion/30 transition-colors duration-300 appearance-none cursor-pointer"
          style={{ fontSize: "var(--text-micro)" }}
        >
          {TRACK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
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

      {/* Track Cards */}
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
          ) : tracks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              No tracks yet. Start learning something new.
            </motion.div>
          ) : (
            tracks.map((track, i) => {
              const colors = getTypeColor(track.type);
              const isLogging = loggingTrackId === track.id;
              const recentLogs = track.logs.slice(0, 3);

              return (
                <motion.div
                  key={track.id}
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
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <h3
                        className="text-ink-black font-light leading-snug truncate"
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {track.title}
                      </h3>
                      <span
                        className={`shrink-0 font-mono tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text}`}
                        style={{ fontSize: "10px" }}
                      >
                        {track.type}
                      </span>
                    </div>

                    {/* Hover actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      <button
                        onClick={() => {
                          if (isLogging) {
                            setLoggingTrackId(null);
                            setLogNotes("");
                            setLogDuration("");
                          } else {
                            setLoggingTrackId(track.id);
                          }
                        }}
                        className="h-7 flex items-center justify-center rounded-lg px-2 text-sumi-gray-light hover:text-gold-seal hover:bg-gold-seal/10 transition-colors duration-200 font-mono tracking-[0.08em]"
                        style={{ fontSize: "var(--text-micro)" }}
                        title="Log session"
                      >
                        + Log
                      </button>
                      <button
                        onClick={() => deleteTrack(track.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="font-mono tracking-[0.08em] text-sumi-gray-light"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        Progress
                      </span>
                      <span
                        className="font-mono tracking-[0.08em] text-sumi-gray"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {Math.round(track.progress)}%
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-sumi-gray/20 rounded-full overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          track.progress >= 100
                            ? "bg-gold-seal"
                            : "bg-vermillion/70"
                        }`}
                        initial={false}
                        animate={{ width: `${Math.min(100, track.progress)}%` }}
                        transition={{ duration: 0.4, ease }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(track.progress)}
                      onChange={(e) =>
                        updateProgress(track.id, parseInt(e.target.value, 10))
                      }
                      className="w-full h-1 appearance-none bg-transparent cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-vermillion [&::-webkit-slider-thumb]:cursor-pointer"
                      style={{ marginTop: "-6px" }}
                    />
                  </div>

                  {/* Recent logs */}
                  {recentLogs.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {recentLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-baseline gap-2 text-sm"
                        >
                          <span
                            className="font-mono tracking-[0.08em] text-sumi-gray-light shrink-0"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {formatDate(log.date)}
                          </span>
                          {log.duration && (
                            <span
                              className="font-mono tracking-[0.08em] text-vermillion/60 shrink-0"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              {log.duration}m
                            </span>
                          )}
                          <span className="text-sumi-gray truncate text-sm">
                            {log.notes || "--"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline log form */}
                  <AnimatePresence>
                    {isLogging && (
                      <motion.form
                        onSubmit={(e) => logSession(e, track.id)}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-2 border-t border-sumi-gray/20 space-y-3">
                          <textarea
                            value={logNotes}
                            onChange={(e) => setLogNotes(e.target.value)}
                            placeholder="What did you learn?"
                            rows={2}
                            className="w-full bg-parchment-warm/60 border border-sumi-gray/20 rounded-lg px-3 py-2 text-ink-black placeholder:text-sumi-gray-light/40 focus:outline-none focus:border-vermillion/30 transition-colors duration-300 resize-none"
                            style={{ fontSize: "var(--text-body)" }}
                          />
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label
                                className="font-mono tracking-[0.08em] text-sumi-gray-light"
                                style={{ fontSize: "var(--text-micro)" }}
                              >
                                Duration
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={logDuration}
                                onChange={(e) => setLogDuration(e.target.value)}
                                placeholder="min"
                                className="w-20 bg-parchment-warm/60 border border-sumi-gray/20 rounded-lg px-3 py-1.5 text-ink-black placeholder:text-sumi-gray-light/40 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
                                style={{ fontSize: "var(--text-body)" }}
                              />
                            </div>
                            <div className="flex-1" />
                            <button
                              type="submit"
                              disabled={savingLog}
                              className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-lg px-4 py-1.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              {savingLog ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setLoggingTrackId(null);
                                setLogNotes("");
                                setLogDuration("");
                              }}
                              className="bg-parchment-warm/20 border border-sumi-gray/20 text-sumi-gray-light rounded-lg px-4 py-1.5 font-mono tracking-[0.12em] uppercase hover:border-sumi-gray/20 hover:text-sumi-gray transition-all duration-300"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
