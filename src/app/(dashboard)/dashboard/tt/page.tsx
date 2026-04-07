"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

const NATIONALS = new Date("2026-11-01T00:00:00");

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

const SPOTLIGHT_SHOTS = ["bh-flick", "bh-counter-loop", "fh-block"];

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
};

type TTPeriod = {
  id: string;
  name: string;
  startMonth: string;
  endMonth: string;
  focusAreas: unknown;
};

type TTTechniqueRating = {
  id: string;
  shot: string;
  rating: number;
  date: string;
};

function daysToNationals(): number {
  const now = new Date();
  const diff = NATIONALS.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string): string {
  const d = new Date(iso + (iso.includes("T") ? "" : "T12:00:00"));
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function ratingColor(r: number): string {
  if (r >= 8) return "var(--gold-seal)";
  if (r >= 6) return "var(--parchment)";
  return "var(--vermillion)";
}

function focusAreasList(focusAreas: unknown): string[] {
  if (Array.isArray(focusAreas)) return focusAreas.map(String);
  if (typeof focusAreas === "object" && focusAreas !== null) {
    const vals = Object.values(focusAreas as Record<string, unknown>);
    return vals.map(String);
  }
  return [];
}

export default function TTHubPage() {
  const [lastSession, setLastSession] = useState<TTSession | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<TTPeriod | null>(null);
  const [techniques, setTechniques] = useState<TTTechniqueRating[]>([]);
  const [loading, setLoading] = useState(true);
  const days = daysToNationals();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sessRes, periodsRes, techRes] = await Promise.allSettled([
        fetch("/api/tt/sessions?limit=1"),
        fetch("/api/tt/periods"),
        fetch("/api/tt/techniques"),
      ]);

      if (sessRes.status === "fulfilled" && sessRes.value.ok) {
        const data = await sessRes.value.json();
        setLastSession(data[0] ?? null);
      }

      if (periodsRes.status === "fulfilled" && periodsRes.value.ok) {
        const data: TTPeriod[] = await periodsRes.value.json();
        const now = new Date();
        const active = data.find((p) => {
          const start = new Date(p.startMonth);
          const end = new Date(p.endMonth);
          return now >= start && now <= end;
        });
        setCurrentPeriod(active ?? data[data.length - 1] ?? null);
      }

      if (techRes.status === "fulfilled" && techRes.value.ok) {
        const data: TTTechniqueRating[] = await techRes.value.json();
        setTechniques(data);
      }

      setLoading(false);
    }
    load();
  }, []);

  const spotlightTechs = SPOTLIGHT_SHOTS.map((shot) => {
    const match = techniques.find((t) => t.shot === shot);
    return { shot, rating: match?.rating ?? null };
  });

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...ease] }}
      >
        <h1 className="font-mono text-2xl font-light" style={{ color: "var(--parchment)" }}>
          月読 — Tsukuyomi
        </h1>
        <p className="mt-1 font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
          You were in my genjutsu from ball 1
        </p>
      </motion.div>

      {loading ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-sm"
          style={{ color: "var(--parchment-dim)" }}
        >
          Loading...
        </motion.p>
      ) : (
        <>
          {/* Days to Nationals */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [...ease] }}
            className="rounded-lg border p-4"
            style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
          >
            <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
              Days to Nationals
            </p>
            <p
              className="mt-1 font-mono text-4xl font-light tabular-nums"
              style={{ color: "var(--vermillion-glow)" }}
            >
              {days}
            </p>
            <p className="mt-0.5 font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
              November 1, 2026
            </p>
          </motion.div>

          {/* Current Period */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [...ease] }}
            className="rounded-lg border p-4 space-y-2"
            style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
          >
            <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
              Current Phase
            </p>
            {currentPeriod ? (
              <>
                <p className="font-mono text-base" style={{ color: "var(--parchment)" }}>
                  {currentPeriod.name}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {focusAreasList(currentPeriod.focusAreas).map((area) => (
                    <span
                      key={area}
                      className="rounded-full px-2 py-0.5 font-mono text-xs"
                      style={{
                        backgroundColor: "var(--vermillion-wash)",
                        color: "var(--vermillion-glow)",
                      }}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
                No active phase
              </p>
            )}
          </motion.div>

          {/* Last Session */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5, ease: [...ease] }}
            className="rounded-lg border p-4 space-y-2"
            style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
          >
            <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
              Last Session
            </p>
            {lastSession ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm" style={{ color: "var(--parchment)" }}>
                    {formatDate(lastSession.date)}
                  </span>
                  <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                    {lastSession.duration}min
                  </span>
                  <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                    {lastSession.blade}
                  </span>
                </div>
                {lastSession.mode1Respected !== null && lastSession.mode1Respected !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                      Mode 1
                    </span>
                    <span
                      className="font-mono text-xs"
                      style={{
                        color: lastSession.mode1Respected
                          ? "var(--gold-seal)"
                          : "var(--vermillion)",
                      }}
                    >
                      {lastSession.mode1Respected ? "Respected" : "Not Respected"}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
                No sessions yet
              </p>
            )}
          </motion.div>

          {/* Technique Spotlight */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.29, duration: 0.5, ease: [...ease] }}
            className="rounded-lg border p-4 space-y-3"
            style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
          >
            <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
              Technique Spotlight
            </p>
            <div className="space-y-2">
              {spotlightTechs.map(({ shot, rating }) => (
                <div key={shot} className="flex items-center justify-between">
                  <span className="font-mono text-sm" style={{ color: "var(--parchment-muted)" }}>
                    {shot}
                  </span>
                  {rating !== null ? (
                    <span
                      className="font-mono text-sm tabular-nums"
                      style={{ color: ratingColor(rating) }}
                    >
                      {rating}/10
                    </span>
                  ) : (
                    <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                      unrated
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.5, ease: [...ease] }}
            className="flex gap-3"
          >
            <Link
              href="/dashboard/tt/log?new=1"
              className="flex-1 rounded-md border px-4 py-3 text-center font-mono text-sm transition-colors hover:opacity-80"
              style={{
                backgroundColor: "var(--vermillion-wash)",
                borderColor: "var(--vermillion)",
                color: "var(--vermillion-glow)",
              }}
            >
              Log Session
            </Link>
            <Link
              href="/dashboard/tt/matches?new=1"
              className="flex-1 rounded-md border px-4 py-3 text-center font-mono text-sm transition-colors hover:opacity-80"
              style={{
                backgroundColor: "var(--ink-dark)",
                borderColor: "var(--ink-mid)",
                color: "var(--parchment-muted)",
              }}
            >
              Log Match
            </Link>
          </motion.div>
        </>
      )}
    </div>
  );
}
