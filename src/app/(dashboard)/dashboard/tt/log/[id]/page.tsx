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

const CATEGORY_LABELS: Record<string, string> = {
  sharingan: "Sharingan — Serve/Receive",
  amaterasu: "Amaterasu — Forehand",
  totsuka: "Totsuka — Kill/Attack",
  "yata-mirror": "Yata Mirror — Block/Defense",
};

type Drill = {
  id: string;
  name: string;
  category: string;
  technique?: string | null;
  rating?: number | null;
  notes?: string | null;
};

type TTSession = {
  id: string;
  date: string;
  duration: number;
  blade: string;
  location?: string | null;
  mode1Respected?: boolean | null;
  peakMode?: number | null;
  energyLevel?: number | null;
  notes?: string | null;
  drills: Drill[];
};

function formatFullDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<TTSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tt/sessions/${id}`);
        if (res.status === 404) {
          setNotFound(true);
        } else if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function deleteSession() {
    if (!window.confirm("Delete this session?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tt/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/tt/log");
      }
    } catch {
      /* ignore */
    }
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

  if (notFound || !session) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/tt/log"
          className="font-mono text-xs"
          style={{ color: "var(--parchment-muted)" }}
        >
          ← Back to Log
        </Link>
        <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
          Session not found.
        </p>
      </div>
    );
  }

  const m1Color =
    session.mode1Respected === true
      ? "var(--gold-seal)"
      : session.mode1Respected === false
      ? "var(--vermillion)"
      : "var(--parchment-dim)";

  const m1Label =
    session.mode1Respected === true
      ? "Yes"
      : session.mode1Respected === false
      ? "No"
      : "—";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back + Delete */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [...ease] }}
      >
        <Link
          href="/dashboard/tt/log"
          className="font-mono text-xs"
          style={{ color: "var(--parchment-muted)" }}
        >
          ← Training Log
        </Link>
        <button
          onClick={deleteSession}
          disabled={deleting}
          className="font-mono text-xs transition-opacity disabled:opacity-40"
          style={{ color: "var(--vermillion)" }}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </motion.div>

      {/* Date Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.5, ease: [...ease] }}
      >
        <h1 className="font-mono text-xl font-light" style={{ color: "var(--parchment)" }}>
          {formatFullDate(session.date)}
        </h1>
        <div className="mt-1 flex items-center gap-3">
          <span className="font-mono text-sm" style={{ color: "var(--parchment-muted)" }}>
            {session.duration}min
          </span>
          <span className="font-mono text-sm" style={{ color: "var(--parchment-muted)" }}>
            {session.blade}
          </span>
          {session.location && (
            <span className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
              {session.location}
            </span>
          )}
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [...ease] }}
      >
        <div
          className="rounded-lg border p-3"
          style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
        >
          <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
            Mode 1
          </p>
          <p className="mt-1 font-mono text-base" style={{ color: m1Color }}>
            {m1Label}
          </p>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
        >
          <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
            Peak Mode
          </p>
          <p className="mt-1 font-mono text-base" style={{ color: "var(--parchment)" }}>
            {session.peakMode != null
              ? `${session.peakMode} — ${MODE_NAMES[session.peakMode]}`
              : "—"}
          </p>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
        >
          <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
            Energy
          </p>
          <p className="mt-1 font-mono text-base" style={{ color: "var(--parchment)" }}>
            {session.energyLevel != null ? `${session.energyLevel}/10` : "—"}
          </p>
        </div>
      </motion.div>

      {/* Drills */}
      {session.drills.length > 0 && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: [...ease] }}
        >
          <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
            Drills
          </p>
          {session.drills.map((drill) => (
            <div
              key={drill.id}
              className="rounded-lg border p-3 space-y-1"
              style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm" style={{ color: "var(--parchment)" }}>
                  {drill.name}
                </span>
                {drill.rating != null && (
                  <span
                    className="font-mono text-sm tabular-nums"
                    style={{
                      color:
                        drill.rating >= 8
                          ? "var(--gold-seal)"
                          : drill.rating >= 6
                          ? "var(--parchment)"
                          : "var(--vermillion)",
                    }}
                  >
                    {drill.rating}/10
                  </span>
                )}
              </div>
              <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                {CATEGORY_LABELS[drill.category] ?? drill.category}
              </p>
              {drill.technique && (
                <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                  #{drill.technique}
                </p>
              )}
              {drill.notes && (
                <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
                  {drill.notes}
                </p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Notes */}
      {session.notes && (
        <motion.div
          className="rounded-lg border p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5, ease: [...ease] }}
          style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
        >
          <p className="font-mono text-xs mb-2" style={{ color: "var(--parchment-muted)" }}>
            Notes
          </p>
          <p
            className="font-mono text-sm whitespace-pre-wrap leading-relaxed"
            style={{ color: "var(--parchment)" }}
          >
            {session.notes}
          </p>
        </motion.div>
      )}
    </div>
  );
}
