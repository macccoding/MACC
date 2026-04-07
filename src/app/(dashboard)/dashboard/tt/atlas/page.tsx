"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

const SHOT_CATALOG = [
  { slug: "bh-flick", name: "BH Flick", category: "sharingan" },
  { slug: "bh-opening-loop", name: "BH Opening Loop", category: "totsuka" },
  { slug: "bh-counter-loop", name: "BH Counter Loop", category: "totsuka" },
  { slug: "bh-block-redirect", name: "BH Block/Redirect", category: "yata-mirror" },
  { slug: "bh-kill-finish", name: "BH Kill/Finish", category: "totsuka" },
  { slug: "bh-push-touch", name: "BH Push/Touch", category: "sharingan" },
  { slug: "fh-opening-loop", name: "FH Opening Loop", category: "amaterasu" },
  { slug: "fh-counter-loop", name: "FH Counter Loop", category: "amaterasu" },
  { slug: "fh-kill-smash", name: "FH Kill/Smash", category: "amaterasu" },
  { slug: "fh-block", name: "FH Block", category: "yata-mirror" },
  { slug: "fh-flick", name: "FH Flick", category: "sharingan" },
  { slug: "fh-push-touch", name: "FH Push/Touch", category: "sharingan" },
  { slug: "pendulum-serve", name: "Pendulum Serve", category: "sharingan" },
  { slug: "reverse-pendulum", name: "Reverse Pendulum", category: "sharingan" },
  { slug: "backhand-serve", name: "Backhand Serve", category: "sharingan" },
  { slug: "receive", name: "Receive", category: "sharingan" },
];

const CATEGORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "sharingan", label: "Sharingan" },
  { value: "amaterasu", label: "Amaterasu" },
  { value: "totsuka", label: "Totsuka" },
  { value: "yata-mirror", label: "Yata Mirror" },
];

function categoryStyle(cat: string): { bg: string; color: string } {
  switch (cat) {
    case "sharingan":
      return { bg: "var(--vermillion-wash)", color: "var(--vermillion-glow)" };
    case "amaterasu":
      return { bg: "color-mix(in srgb, var(--gold-seal) 15%, transparent)", color: "var(--gold-seal-glow)" };
    case "totsuka":
      return { bg: "color-mix(in srgb, var(--vermillion) 20%, transparent)", color: "var(--vermillion)" };
    case "yata-mirror":
      return { bg: "color-mix(in srgb, var(--sumi-gray-light) 10%, transparent)", color: "var(--sumi-gray-light)" };
    default:
      return { bg: "var(--ink-dark)", color: "var(--parchment-muted)" };
  }
}

function ratingColor(r: number): string {
  if (r >= 8) return "var(--gold-seal)";
  if (r >= 6) return "var(--parchment)";
  return "var(--vermillion)";
}

type TechniqueRating = {
  shot: string;
  rating: number;
};

type Reference = {
  shot: string;
  playerName: string;
};

export default function AtlasPage() {
  const [filter, setFilter] = useState("all");
  const [ratings, setRatings] = useState<TechniqueRating[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [techRes, refRes] = await Promise.allSettled([
        fetch("/api/tt/techniques"),
        fetch("/api/tt/references"),
      ]);
      if (techRes.status === "fulfilled" && techRes.value.ok) {
        setRatings(await techRes.value.json());
      }
      if (refRes.status === "fulfilled" && refRes.value.ok) {
        setReferences(await refRes.value.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all"
    ? SHOT_CATALOG
    : SHOT_CATALOG.filter((s) => s.category === filter);

  function getRating(slug: string): number | null {
    return ratings.find((r) => r.shot === slug)?.rating ?? null;
  }

  function getRefPlayer(slug: string): string | null {
    return references.find((r) => r.shot === slug)?.playerName ?? null;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...ease] }}
      >
        <h1 className="font-mono text-2xl font-light" style={{ color: "var(--parchment)" }}>
          写 — Technique Atlas
        </h1>
        <p className="mt-1 font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
          {SHOT_CATALOG.length} shots catalogued
        </p>
      </motion.div>

      {/* Category filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.4, ease: [...ease] }}
        className="flex flex-wrap gap-2"
      >
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="rounded-full px-3 py-1 font-mono text-xs transition-colors"
            style={{
              backgroundColor: filter === f.value ? "var(--vermillion-wash)" : "var(--ink-dark)",
              color: filter === f.value ? "var(--vermillion-glow)" : "var(--parchment-muted)",
              border: `1px solid ${filter === f.value ? "var(--vermillion)" : "var(--ink-mid)"}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
          Loading...
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((shot, i) => {
            const rating = getRating(shot.slug);
            const player = getRefPlayer(shot.slug);
            const catStyle = categoryStyle(shot.category);

            return (
              <motion.div
                key={shot.slug}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.04, duration: 0.4, ease: [...ease] }}
              >
                <Link
                  href={`/dashboard/tt/atlas/${shot.slug}`}
                  className="block rounded-lg border p-3 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--ink-dark)",
                    borderColor: "var(--ink-mid)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-sm font-medium leading-tight" style={{ color: "var(--parchment)" }}>
                      {shot.name}
                    </span>
                    {rating !== null ? (
                      <span
                        className="font-mono text-xl font-light tabular-nums shrink-0"
                        style={{ color: ratingColor(rating) }}
                      >
                        {rating}
                      </span>
                    ) : (
                      <span className="font-mono text-sm shrink-0" style={{ color: "var(--ink-mid)" }}>
                        —
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-xs"
                      style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                    >
                      {shot.category}
                    </span>
                    {player && (
                      <span className="font-mono text-xs truncate" style={{ color: "var(--parchment-dim)" }}>
                        {player}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
