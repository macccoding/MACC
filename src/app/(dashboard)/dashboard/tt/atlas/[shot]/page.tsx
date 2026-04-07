"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const inputClass =
  "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] placeholder:text-[var(--parchment-dim)] focus:border-[var(--vermillion)] focus:outline-none";
const labelClass = "block font-mono text-xs mb-1" as const;

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ratingColor(r: number): string {
  if (r >= 8) return "var(--gold-seal)";
  if (r >= 6) return "var(--parchment)";
  return "var(--vermillion)";
}

function formatDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Rating = {
  id: string;
  shot: string;
  rating: number;
  date: string;
  notes?: string | null;
};

type VideoLink = {
  url: string;
  timestamp?: string;
  description?: string;
};

type Reference = {
  id: string;
  shot: string;
  playerName: string;
  mechanicsBreakdown?: string | null;
  extractionNotes?: string | null;
  comparisonNotes?: string | null;
  videoLinks?: unknown;
};

type Drill = {
  id: string;
  name: string;
  rating?: number | null;
  createdAt: string;
  session: {
    date: string;
    blade: string;
  };
};

type ShotData = {
  shot: string;
  ratings: Rating[];
  references: Reference[];
  recentDrills: Drill[];
};

type Guide = {
  readyPosition: string | null;
  gripAdjustment: string | null;
  preparation: string | null;
  contact: string | null;
  wristForearm: string | null;
  followThrough: string | null;
  commonMistakes: string | null;
  whenToUse: string | null;
  whenNotToUse: string | null;
  cuePhrase: string | null;
  imageUrl: string | null;
};

function TrendArrow({ ratings }: { ratings: Rating[] }) {
  if (ratings.length < 2) return null;
  const last = ratings[ratings.length - 1].rating;
  const prev = ratings[ratings.length - 2].rating;
  if (last > prev) return <span style={{ color: "var(--gold-seal)" }}>↑</span>;
  if (last < prev) return <span style={{ color: "var(--vermillion)" }}>↓</span>;
  return <span style={{ color: "var(--parchment-dim)" }}>→</span>;
}

function RatingBars({ ratings }: { ratings: Rating[] }) {
  if (ratings.length === 0) return (
    <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>No history yet</p>
  );
  return (
    <div className="flex items-end gap-1 h-12">
      {ratings.map((r) => (
        <div
          key={r.id}
          className="flex-1 rounded-sm min-w-[6px] transition-all"
          style={{
            height: `${(r.rating / 10) * 100}%`,
            backgroundColor: ratingColor(r.rating),
            opacity: 0.8,
          }}
          title={`${r.rating} — ${formatDate(r.date)}`}
        />
      ))}
    </div>
  );
}

function VideoLinks({ links }: { links: unknown }) {
  if (!links || !Array.isArray(links) || links.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {(links as VideoLink[]).map((link, i) => (
        <div key={i} className="flex items-start gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs underline underline-offset-2 hover:opacity-70"
            style={{ color: "var(--vermillion-glow)" }}
          >
            {link.timestamp ? `[${link.timestamp}]` : "Watch"}
          </a>
          {link.description && (
            <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
              {link.description}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ShotDetailPage({ params }: { params: Promise<{ shot: string }> }) {
  const { shot } = use(params);
  const [data, setData] = useState<ShotData | null>(null);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  // Form state
  const [ratingInput, setRatingInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [dateInput, setDateInput] = useState(todayStr());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [techRes, guideRes] = await Promise.all([
        fetch(`/api/tt/techniques/${encodeURIComponent(shot)}`),
        fetch(`/api/tt/guides?shot=${encodeURIComponent(shot)}`),
      ]);
      if (techRes.ok) setData(await techRes.json());
      if (guideRes.ok) setGuide(await guideRes.json());
      setLoading(false);
    }
    load();
  }, [shot]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const r = Number(ratingInput);
    if (!ratingInput || isNaN(r) || r < 1 || r > 10) {
      setSaveError("Rating must be 1–10");
      return;
    }
    setSaving(true);
    setSaveError("");
    const res = await fetch("/api/tt/techniques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shot, rating: r, date: dateInput, notes: notesInput || undefined }),
    });
    if (res.ok) {
      const newEntry: Rating = await res.json();
      setData((prev) => prev ? {
        ...prev,
        ratings: [...prev.ratings, newEntry].sort((a, b) => a.date.localeCompare(b.date)),
      } : prev);
      setRatingInput("");
      setNotesInput("");
      setDateInput(todayStr());
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } else {
      setSaveError("Failed to save");
    }
    setSaving(false);
  }

  const shotTitle = slugToTitle(shot);
  const currentRating = data?.ratings.length
    ? data.ratings[data.ratings.length - 1].rating
    : null;

  return (
    <div className="max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...ease] }}
        className="mb-6"
      >
        <h1 className="font-mono text-2xl font-light" style={{ color: "var(--parchment)" }}>
          写 — {shotTitle}
        </h1>
      </motion.div>

      {loading ? (
        <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>Loading...</p>
      ) : (
        <>
        {guide && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.4, ease: [...ease] }}
            className="mb-5 space-y-4"
          >
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--gold-seal)" }}>
              Technique Guide
            </p>

            {guide.cuePhrase && (
              <p className="font-serif text-lg italic" style={{ color: "var(--vermillion)" }}>
                &ldquo;{guide.cuePhrase}&rdquo;
              </p>
            )}

            {/* Mechanics grid */}
            {[
              { label: "Ready Position", icon: "立", value: guide.readyPosition },
              { label: "Grip", icon: "握", value: guide.gripAdjustment },
              { label: "Preparation", icon: "構", value: guide.preparation },
              { label: "Contact", icon: "触", value: guide.contact },
              { label: "Wrist & Forearm", icon: "腕", value: guide.wristForearm },
              { label: "Follow-Through", icon: "流", value: guide.followThrough },
            ].filter((item) => item.value).length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { label: "Ready Position", icon: "立", value: guide.readyPosition },
                  { label: "Grip", icon: "握", value: guide.gripAdjustment },
                  { label: "Preparation", icon: "構", value: guide.preparation },
                  { label: "Contact", icon: "触", value: guide.contact },
                  { label: "Wrist & Forearm", icon: "腕", value: guide.wristForearm },
                  { label: "Follow-Through", icon: "流", value: guide.followThrough },
                ]
                  .filter((item) => item.value)
                  .map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.04, duration: 0.35, ease: [...ease] }}
                      className="rounded-lg border p-4"
                      style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
                    >
                      <p className="font-mono text-xs mb-2" style={{ color: "var(--parchment-muted)" }}>
                        {item.icon} {item.label}
                      </p>
                      <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>
                        {item.value}
                      </p>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* When to use / when not to use */}
            {(guide.whenToUse || guide.whenNotToUse) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {guide.whenToUse && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.34, duration: 0.35, ease: [...ease] }}
                    className="rounded-lg border p-4"
                    style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--gold-seal)" }}
                  >
                    <p className="font-mono text-xs mb-2" style={{ color: "var(--gold-seal)" }}>
                      When to Use
                    </p>
                    <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>
                      {guide.whenToUse}
                    </p>
                  </motion.div>
                )}
                {guide.whenNotToUse && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38, duration: 0.35, ease: [...ease] }}
                    className="rounded-lg border p-4"
                    style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--vermillion)" }}
                  >
                    <p className="font-mono text-xs mb-2" style={{ color: "var(--vermillion)" }}>
                      When NOT to Use
                    </p>
                    <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>
                      {guide.whenNotToUse}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Common mistakes */}
            {guide.commonMistakes && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.35, ease: [...ease] }}
                className="rounded-lg border p-4"
                style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--vermillion)" }}
              >
                <p className="font-mono text-xs mb-2" style={{ color: "var(--vermillion)" }}>
                  Common Mistakes
                </p>
                <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>
                  {guide.commonMistakes}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left — Your Game */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [...ease] }}
            className="space-y-4"
          >
            {/* Current rating */}
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
            >
              <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>Your Game</p>
              <div className="flex items-end gap-3">
                {currentRating !== null ? (
                  <>
                    <span
                      className="font-mono text-5xl font-light tabular-nums leading-none"
                      style={{ color: ratingColor(currentRating) }}
                    >
                      {currentRating}
                    </span>
                    <span className="font-mono text-xl mb-1" style={{ color: "var(--parchment-dim)" }}>
                      <TrendArrow ratings={data?.ratings ?? []} />
                    </span>
                    <span className="font-mono text-sm mb-1" style={{ color: "var(--parchment-dim)" }}>/10</span>
                  </>
                ) : (
                  <span className="font-mono text-2xl font-light" style={{ color: "var(--ink-mid)" }}>
                    Unrated
                  </span>
                )}
              </div>
              {/* Rating history bars */}
              <div>
                <p className="font-mono text-xs mb-2" style={{ color: "var(--parchment-dim)" }}>
                  History ({data?.ratings.length ?? 0} entries)
                </p>
                <RatingBars ratings={data?.ratings ?? []} />
              </div>
            </div>

            {/* Log rating form */}
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
            >
              <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>Log Rating</p>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className={labelClass} style={{ color: "var(--parchment-muted)" }}>
                    Rating (1–10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={ratingInput}
                    onChange={(e) => setRatingInput(e.target.value)}
                    placeholder="7"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: "var(--parchment-muted)" }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: "var(--parchment-muted)" }}>
                    Notes
                  </label>
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="What needs work..."
                    rows={2}
                    className={inputClass}
                  />
                </div>
                {saveError && (
                  <p className="font-mono text-xs" style={{ color: "var(--vermillion)" }}>{saveError}</p>
                )}
                {saveOk && (
                  <p className="font-mono text-xs" style={{ color: "var(--gold-seal)" }}>Saved.</p>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-md border px-4 py-2 font-mono text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--vermillion-wash)",
                    borderColor: "var(--vermillion)",
                    color: "var(--vermillion-glow)",
                  }}
                >
                  {saving ? "Saving..." : "Save Rating"}
                </button>
              </form>
            </div>

            {/* Recent drills */}
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
            >
              <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>Recent Drills</p>
              {data?.recentDrills.length ? (
                <div className="space-y-2">
                  {data.recentDrills.slice(0, 10).map((drill) => (
                    <div
                      key={drill.id}
                      className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                      style={{ borderColor: "var(--ink-mid)" }}
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm truncate" style={{ color: "var(--parchment)" }}>
                          {drill.name}
                        </p>
                        <p className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                          {formatDate(drill.session.date)} · {drill.session.blade}
                        </p>
                      </div>
                      {drill.rating !== null && drill.rating !== undefined && (
                        <span
                          className="font-mono text-sm tabular-nums shrink-0"
                          style={{ color: ratingColor(drill.rating) }}
                        >
                          {drill.rating}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>No drills logged yet</p>
              )}
            </div>
          </motion.div>

          {/* Right — Reference Model */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4, ease: [...ease] }}
            className="space-y-4"
          >
            <div
              className="rounded-lg border p-4 space-y-1"
              style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
            >
              <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>Reference Model</p>
            </div>

            {data?.references.length ? (
              data.references.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-lg border p-4 space-y-3"
                  style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
                >
                  <p className="font-mono text-base" style={{ color: "var(--gold-seal)" }}>
                    {ref.playerName}
                  </p>

                  {ref.mechanicsBreakdown && (
                    <div>
                      <p className="font-mono text-xs mb-1" style={{ color: "var(--parchment-muted)" }}>
                        Mechanics
                      </p>
                      <p className="font-mono text-sm whitespace-pre-wrap" style={{ color: "var(--parchment)" }}>
                        {ref.mechanicsBreakdown}
                      </p>
                    </div>
                  )}

                  {ref.extractionNotes && (
                    <div>
                      <p className="font-mono text-xs mb-1" style={{ color: "var(--parchment-muted)" }}>
                        Extraction Notes
                      </p>
                      <p className="font-mono text-sm whitespace-pre-wrap" style={{ color: "var(--parchment)" }}>
                        {ref.extractionNotes}
                      </p>
                    </div>
                  )}

                  {ref.comparisonNotes && (
                    <div>
                      <p className="font-mono text-xs mb-1" style={{ color: "var(--parchment-muted)" }}>
                        Gap Analysis
                      </p>
                      <p className="font-mono text-sm whitespace-pre-wrap" style={{ color: "var(--parchment)" }}>
                        {ref.comparisonNotes}
                      </p>
                    </div>
                  )}

                  {Array.isArray(ref.videoLinks) && (ref.videoLinks as unknown[]).length > 0 && (
                    <div>
                      <p className="font-mono text-xs mb-1.5" style={{ color: "var(--parchment-muted)" }}>
                        Video
                      </p>
                      <VideoLinks links={ref.videoLinks} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
              >
                <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
                  No reference model yet. Add one via the API.
                </p>
              </div>
            )}
          </motion.div>
        </div>
        </>
      )}
    </div>
  );
}
