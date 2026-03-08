"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Capture = {
  id: string;
  content: string;
  category: string;
  processed: boolean;
  suggestedRoute: string | null;
  suggestedData: Record<string, unknown> | null;
  routedTo: string | null;
  confidence: number | null;
  createdAt: string;
  updatedAt: string;
};

type Tab = "inbox" | "routed";

const TABS: { label: string; value: Tab }[] = [
  { label: "Inbox", value: "inbox" },
  { label: "Recently Routed", value: "routed" },
];

const ROUTE_LABELS: Record<string, string> = {
  reading: "Reading List",
  goal: "Goals",
  habit: "Habits",
  travel: "Travel",
  creative: "Creative",
  investment_note: "Investment Note",
  journal: "Journal",
  contact: "People",
  none: "No suggestion",
};

const ROUTE_COLORS: Record<string, string> = {
  reading: "text-amber-400 bg-amber-400/10",
  goal: "text-green-400 bg-green-400/10",
  habit: "text-blue-400 bg-blue-400/10",
  travel: "text-purple-400 bg-purple-400/10",
  creative: "text-pink-400 bg-pink-400/10",
  investment_note: "text-emerald-400 bg-emerald-400/10",
  journal: "text-indigo-400 bg-indigo-400/10",
  contact: "text-cyan-400 bg-cyan-400/10",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CapturesPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("inbox");
  const [actioning, setActioning] = useState<Record<string, boolean>>({});

  const fetchCaptures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/captures?status=${tab}`);
      if (res.ok) {
        const data = await res.json();
        setCaptures(data);
      }
    } catch (err) {
      console.error("Failed to fetch captures:", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchCaptures();
  }, [fetchCaptures]);

  async function approveCapture(capture: Capture) {
    if (!capture.suggestedRoute || capture.suggestedRoute === "none") return;
    setActioning((prev) => ({ ...prev, [capture.id]: true }));

    try {
      const res = await fetch(`/api/captures/${capture.id}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: capture.suggestedRoute,
          data: capture.suggestedData || {},
        }),
      });
      if (res.ok) {
        setCaptures((prev) => prev.filter((c) => c.id !== capture.id));
      }
    } catch (err) {
      console.error("Failed to approve capture:", err);
    } finally {
      setActioning((prev) => ({ ...prev, [capture.id]: false }));
    }
  }

  async function dismissCapture(id: string) {
    setActioning((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await fetch(`/api/captures/${id}/dismiss`, {
        method: "POST",
      });
      if (res.ok) {
        setCaptures((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to dismiss capture:", err);
    } finally {
      setActioning((prev) => ({ ...prev, [id]: false }));
    }
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
          Captures
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Quick thoughts, auto-routed by Kemi.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`font-mono tracking-[0.12em] uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${
              tab === t.value
                ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
                : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray-light hover:border-sumi-gray/20 hover:text-sumi-gray"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Capture Cards */}
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
          ) : captures.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              {tab === "inbox"
                ? "Inbox is clear. All captures have been routed."
                : "No recently routed captures."}
            </motion.div>
          ) : (
            captures.map((capture, i) => (
              <motion.div
                key={capture.id}
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
                    {/* Content */}
                    <p
                      className="text-ink-black font-light leading-relaxed"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {capture.content}
                    </p>

                    {/* Meta row: time + suggestion badge */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span
                        className="text-sumi-gray-light font-mono tracking-[0.08em]"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {timeAgo(capture.createdAt)}
                      </span>

                      {tab === "inbox" &&
                        capture.suggestedRoute &&
                        capture.suggestedRoute !== "none" && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase ${
                              ROUTE_COLORS[capture.suggestedRoute] ||
                              "text-sumi-gray-light bg-sumi-gray/10"
                            }`}
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {ROUTE_LABELS[capture.suggestedRoute] ||
                              capture.suggestedRoute}
                            {capture.confidence !== null && (
                              <span className="opacity-60">
                                {Math.round(capture.confidence * 100)}%
                              </span>
                            )}
                          </span>
                        )}

                      {tab === "routed" && capture.routedTo && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase ${
                            ROUTE_COLORS[capture.routedTo] ||
                            "text-sumi-gray-light bg-sumi-gray/10"
                          }`}
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          <span className="text-green-400">{"\u2713"}</span>
                          {ROUTE_LABELS[capture.routedTo] || capture.routedTo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (inbox only) */}
                  {tab === "inbox" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {capture.suggestedRoute &&
                        capture.suggestedRoute !== "none" && (
                          <button
                            onClick={() => approveCapture(capture)}
                            disabled={actioning[capture.id]}
                            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-lg px-3 py-1.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ fontSize: "var(--text-micro)" }}
                            title="Approve suggestion"
                          >
                            Approve
                          </button>
                        )}
                      <button
                        onClick={() => dismissCapture(capture.id)}
                        disabled={actioning[capture.id]}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Dismiss"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
