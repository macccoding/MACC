"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ease = [0.22, 1, 0.36, 1] as const;

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

type GameScore = { you: number; them: number };

type TTMatch = {
  id: string;
  date: string;
  opponent: string;
  result: string;
  blade: string;
  tournament?: string | null;
  opponentNotes?: string | null;
  scores?: unknown;
  whatWorked?: string | null;
  whatBroke?: string | null;
  servesUsed?: string | null;
  receiveNotes?: string | null;
  tacticalNotes?: string | null;
  peakMode?: number | null;
};

function formatFullDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [match, setMatch] = useState<TTMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tt/matches/${id}`);
        if (res.status === 404) {
          setNotFound(true);
        } else if (res.ok) {
          setMatch(await res.json());
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [id]);

  async function deleteMatch() {
    if (!window.confirm("Delete this match?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tt/matches/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard/tt/matches");
    } catch { /* ignore */ }
    setDeleting(false);
  }

  if (loading) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-sm"
        style={{ color: "var(--parchment-dim)" }}
      >
        Loading...
      </motion.p>
    );
  }

  if (notFound || !match) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/tt/matches" className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
          ← Match Journal
        </Link>
        <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
          Match not found.
        </p>
      </div>
    );
  }

  const scores = Array.isArray(match.scores) ? (match.scores as GameScore[]) : [];
  const isWin = match.result === "W";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back + Delete */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [...ease] }}
      >
        <Link href="/dashboard/tt/matches" className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
          ← Match Journal
        </Link>
        <button
          onClick={deleteMatch}
          disabled={deleting}
          className="font-mono text-xs transition-opacity disabled:opacity-40"
          style={{ color: "var(--vermillion)" }}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </motion.div>

      {/* Result Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.5, ease: [...ease] }}
      >
        <div className="flex items-baseline gap-4">
          <span
            className="font-mono text-5xl font-light"
            style={{ color: isWin ? "var(--gold-seal)" : "var(--vermillion)" }}
          >
            {match.result}
          </span>
          <div>
            <h1 className="font-mono text-xl font-light" style={{ color: "var(--parchment)" }}>
              {match.opponent}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="font-mono text-sm" style={{ color: "var(--parchment-muted)" }}>
                {formatFullDate(match.date)}
              </span>
              <span className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
                {match.blade}
              </span>
              {match.tournament && (
                <span className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
                  {match.tournament}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scorecard */}
      {scores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [...ease] }}
          className="rounded-lg border p-4"
          style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
        >
          <p className="font-mono text-xs mb-3" style={{ color: "var(--parchment-muted)" }}>Scorecard</p>
          <div className="flex gap-3 flex-wrap">
            {scores.map((g, i) => {
              const won = g.you > g.them;
              return (
                <div key={i} className="text-center">
                  <p className="font-mono text-xs mb-1" style={{ color: "var(--parchment-dim)" }}>G{i + 1}</p>
                  <div
                    className="rounded-md border px-3 py-2"
                    style={{
                      borderColor: won ? "var(--gold-seal-dim)" : "var(--vermillion-wash)",
                      backgroundColor: won
                        ? "color-mix(in srgb, var(--gold-seal) 8%, transparent)"
                        : "var(--vermillion-wash)",
                    }}
                  >
                    <p
                      className="font-mono text-base tabular-nums"
                      style={{ color: won ? "var(--gold-seal)" : "var(--vermillion)" }}
                    >
                      {g.you}—{g.them}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 2x2 Analysis Grid */}
      {(match.whatWorked || match.whatBroke || match.servesUsed || match.receiveNotes) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: [...ease] }}
          className="grid grid-cols-2 gap-3"
        >
          {match.whatWorked && (
            <div className="rounded-lg border p-3 space-y-1" style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}>
              <p className="font-mono text-xs" style={{ color: "var(--gold-seal)" }}>What Worked</p>
              <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>{match.whatWorked}</p>
            </div>
          )}
          {match.whatBroke && (
            <div className="rounded-lg border p-3 space-y-1" style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}>
              <p className="font-mono text-xs" style={{ color: "var(--vermillion)" }}>What Broke</p>
              <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>{match.whatBroke}</p>
            </div>
          )}
          {match.servesUsed && (
            <div className="rounded-lg border p-3 space-y-1" style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}>
              <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>Serves Used</p>
              <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>{match.servesUsed}</p>
            </div>
          )}
          {match.receiveNotes && (
            <div className="rounded-lg border p-3 space-y-1" style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}>
              <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>Receive Notes</p>
              <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>{match.receiveNotes}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Opponent Scouting */}
      {match.opponentNotes && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5, ease: [...ease] }}
          className="rounded-lg border p-4"
          style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
        >
          <p className="font-mono text-xs mb-2" style={{ color: "var(--parchment-muted)" }}>Opponent Scouting</p>
          <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>
            {match.opponentNotes}
          </p>
        </motion.div>
      )}

      {/* Tactical Notes */}
      {match.tacticalNotes && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [...ease] }}
          className="rounded-lg border-l-2 border p-4"
          style={{
            backgroundColor: "var(--ink-dark)",
            borderColor: "var(--ink-mid)",
            borderLeftColor: "var(--vermillion)",
          }}
        >
          <p className="font-mono text-xs mb-2" style={{ color: "var(--vermillion)" }}>Next Time</p>
          <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--parchment)" }}>
            {match.tacticalNotes}
          </p>
        </motion.div>
      )}

      {/* Peak Mode */}
      {match.peakMode != null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.5, ease: [...ease] }}
          className="rounded-lg border p-3 inline-flex items-center gap-3"
          style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
        >
          <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>Peak Mode</p>
          <p className="font-mono text-sm" style={{ color: "var(--parchment)" }}>
            {match.peakMode} — {MODE_NAMES[match.peakMode]}
          </p>
        </motion.div>
      )}
    </div>
  );
}
