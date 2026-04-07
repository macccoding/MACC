"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const inputClass =
  "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] placeholder:text-[var(--parchment-dim)] focus:border-[var(--vermillion)] focus:outline-none";
const labelClass = "block font-mono text-xs text-[var(--parchment-muted)] mb-1";

const CURRENT_SETUP = [
  {
    blade: "FZD ALC",
    weight: "195g",
    role: "Ball 3 dominance, lighter, immediate",
    fh: "J&H C57.5 + Haifu Yellow",
    bh: "J&H C52.5 + Falco Tempo Long",
  },
  {
    blade: "Q968",
    weight: "203g",
    role: "Extended rallies, explosive ceiling",
    fh: "J&H C57.5 + Haifu Yellow",
    bh: "J&H C52.5 + Falco Tempo Long",
  },
];

const RUBBER_OPTIONS = [
  "J&H C57.5",
  "J&H C52.5",
  "Haifu Yellow",
  "Falco Tempo Long",
];

const BOOSTER_OPTIONS = [
  "Falco Booster",
  "Haifu Shark II",
  "Speed Glue Imitation",
  "Other",
];

type EquipmentEntry = {
  id: string;
  item: string;
  type: string;
  dateStarted: string;
  side?: string | null;
  blade?: string | null;
  dateEnded?: string | null;
  verdict?: string | null;
  pros?: string | null;
  cons?: string | null;
  notes?: string | null;
};

type BoostEntry = {
  id: string;
  rubber: string;
  blade: string;
  side: string;
  booster: string;
  date: string;
  notes?: string | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function boostAgeDays(iso: string): number {
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function lastBoostForSide(boosts: BoostEntry[], blade: string, side: "fh" | "bh"): BoostEntry | null {
  return (
    boosts
      .filter((b) => b.blade === blade && b.side.toLowerCase() === side)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null
  );
}

export default function LabPage() {
  const [tab, setTab] = useState<"setup" | "timeline" | "boost">("setup");
  const [equipment, setEquipment] = useState<EquipmentEntry[]>([]);
  const [boosts, setBoosts] = useState<BoostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBoostForm, setShowBoostForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Boost form
  const [bRubber, setBRubber] = useState(RUBBER_OPTIONS[0]);
  const [bBlade, setBBlade] = useState("FZD ALC");
  const [bSide, setBSide] = useState("fh");
  const [bBooster, setBBooster] = useState(BOOSTER_OPTIONS[0]);
  const [bDate, setBDate] = useState(todayStr());
  const [bNotes, setBNotes] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [eq, bo] = await Promise.allSettled([
        fetch("/api/tt/equipment"),
        fetch("/api/tt/boost"),
      ]);
      if (eq.status === "fulfilled" && eq.value.ok) setEquipment(await eq.value.json());
      if (bo.status === "fulfilled" && bo.value.ok) setBoosts(await bo.value.json());
      setLoading(false);
    }
    load();
  }, []);

  async function saveBoost() {
    if (!bRubber || !bBlade || !bSide || !bBooster || !bDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tt/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubber: bRubber, blade: bBlade, side: bSide, booster: bBooster, date: bDate, notes: bNotes.trim() || undefined }),
      });
      if (res.ok) {
        const entry = await res.json();
        setBoosts((prev) => [entry, ...prev]);
        setShowBoostForm(false);
        setBRubber(RUBBER_OPTIONS[0]);
        setBBlade("FZD ALC");
        setBSide("fh");
        setBBooster(BOOSTER_OPTIONS[0]);
        setBDate(todayStr());
        setBNotes("");
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  const verdictStyle = (v?: string | null) => {
    if (v === "kept") return { bg: "color-mix(in srgb, var(--gold-seal) 15%, transparent)", color: "var(--gold-seal)" };
    if (v === "discarded") return { bg: "var(--vermillion-wash)", color: "var(--vermillion)" };
    return { bg: "var(--ink-dark)", color: "var(--parchment-muted)" };
  };

  return (
    <div className="max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...ease] }}
      >
        <h1 className="font-mono text-2xl font-light" style={{ color: "var(--parchment)" }}>
          具 — Equipment Lab
        </h1>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.4, ease: [...ease] }}
        className="flex gap-2"
      >
        {(["setup", "timeline", "boost"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-full px-3 py-1 font-mono text-xs transition-colors capitalize"
            style={{
              backgroundColor: tab === t ? "var(--vermillion-wash)" : "var(--ink-dark)",
              color: tab === t ? "var(--vermillion-glow)" : "var(--parchment-muted)",
              border: `1px solid ${tab === t ? "var(--vermillion)" : "var(--ink-mid)"}`,
            }}
          >
            {t === "setup" ? "Current Setup" : t === "timeline" ? "Timeline" : "Boost Log"}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>Loading...</p>
      ) : (
        <AnimatePresence mode="wait">
          {tab === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: [...ease] }}
              className="space-y-4"
            >
              {CURRENT_SETUP.map((s) => {
                const fhBoost = lastBoostForSide(boosts, s.blade, "fh");
                const bhBoost = lastBoostForSide(boosts, s.blade, "bh");
                const fhDays = fhBoost ? boostAgeDays(fhBoost.date) : null;
                const bhDays = bhBoost ? boostAgeDays(bhBoost.date) : null;

                return (
                  <div
                    key={s.blade}
                    className="rounded-lg border p-4 space-y-3"
                    style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-base font-medium" style={{ color: "var(--parchment)" }}>
                          {s.blade}
                        </p>
                        <p className="font-mono text-xs mt-0.5" style={{ color: "var(--parchment-dim)" }}>
                          {s.weight} — {s.role}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border p-2.5" style={{ borderColor: "var(--ink-mid)" }}>
                        <p className="font-mono text-xs mb-1" style={{ color: "var(--parchment-muted)" }}>FH</p>
                        <p className="font-mono text-sm" style={{ color: "var(--parchment)" }}>{s.fh}</p>
                        {fhBoost && fhDays !== null && (
                          <p
                            className="font-mono text-xs mt-1"
                            style={{ color: fhDays > 21 ? "var(--vermillion)" : "var(--parchment-dim)" }}
                          >
                            Boosted {fhDays}d ago
                          </p>
                        )}
                        {!fhBoost && (
                          <p className="font-mono text-xs mt-1" style={{ color: "var(--parchment-dim)" }}>
                            No boost logged
                          </p>
                        )}
                      </div>
                      <div className="rounded-md border p-2.5" style={{ borderColor: "var(--ink-mid)" }}>
                        <p className="font-mono text-xs mb-1" style={{ color: "var(--parchment-muted)" }}>BH</p>
                        <p className="font-mono text-sm" style={{ color: "var(--parchment)" }}>{s.bh}</p>
                        {bhBoost && bhDays !== null && (
                          <p
                            className="font-mono text-xs mt-1"
                            style={{ color: bhDays > 21 ? "var(--vermillion)" : "var(--parchment-dim)" }}
                          >
                            Boosted {bhDays}d ago
                          </p>
                        )}
                        {!bhBoost && (
                          <p className="font-mono text-xs mt-1" style={{ color: "var(--parchment-dim)" }}>
                            No boost logged
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: [...ease] }}
              className="space-y-3"
            >
              {equipment.length === 0 ? (
                <p className="font-mono text-sm py-6 text-center" style={{ color: "var(--parchment-dim)" }}>
                  No equipment entries yet.
                </p>
              ) : (
                equipment.map((e, i) => {
                  const vs = verdictStyle(e.verdict);
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.35, ease: [...ease] }}
                      className="rounded-lg border p-4 space-y-2"
                      style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-mono text-sm font-medium" style={{ color: "var(--parchment)" }}>
                          {e.item}
                        </p>
                        {e.verdict && (
                          <span
                            className="rounded-full px-2 py-0.5 font-mono text-xs shrink-0"
                            style={{ backgroundColor: vs.bg, color: vs.color }}
                          >
                            {e.verdict}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                          {e.type}
                        </span>
                        {e.side && (
                          <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                            {e.side.toUpperCase()}
                          </span>
                        )}
                        {e.blade && (
                          <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                            {e.blade}
                          </span>
                        )}
                        <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                          {formatDate(e.dateStarted)}{e.dateEnded ? ` — ${formatDate(e.dateEnded)}` : " — present"}
                        </span>
                      </div>
                      {e.pros && (
                        <p className="font-mono text-xs" style={{ color: "var(--gold-seal)" }}>
                          + {e.pros}
                        </p>
                      )}
                      {e.cons && (
                        <p className="font-mono text-xs" style={{ color: "var(--vermillion)" }}>
                          - {e.cons}
                        </p>
                      )}
                      {e.notes && (
                        <p className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
                          {e.notes}
                        </p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {tab === "boost" && (
            <motion.div
              key="boost"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: [...ease] }}
              className="space-y-4"
            >
              {!showBoostForm && (
                <button
                  onClick={() => setShowBoostForm(true)}
                  className="rounded-md border px-4 py-2 font-mono text-sm transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: "var(--vermillion-wash)",
                    borderColor: "var(--vermillion)",
                    color: "var(--vermillion-glow)",
                  }}
                >
                  Log Boost
                </button>
              )}

              <AnimatePresence>
                {showBoostForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [...ease] }}
                    className="rounded-lg border p-4 space-y-4"
                    style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--parchment-muted)" }}>
                        Log Boost
                      </span>
                      <button onClick={() => setShowBoostForm(false)} className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Rubber</label>
                        <select value={bRubber} onChange={(e) => setBRubber(e.target.value)} className={inputClass}>
                          {RUBBER_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Blade</label>
                        <select value={bBlade} onChange={(e) => setBBlade(e.target.value)} className={inputClass}>
                          <option>FZD ALC</option>
                          <option>Q968</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Side</label>
                        <select value={bSide} onChange={(e) => setBSide(e.target.value)} className={inputClass}>
                          <option value="fh">FH</option>
                          <option value="bh">BH</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Booster</label>
                        <select value={bBooster} onChange={(e) => setBBooster(e.target.value)} className={inputClass}>
                          {BOOSTER_OPTIONS.map((b) => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Notes</label>
                      <input type="text" value={bNotes} onChange={(e) => setBNotes(e.target.value)} placeholder="Optional notes..." className={inputClass} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowBoostForm(false)}
                        className="rounded-md border px-4 py-2 font-mono text-sm"
                        style={{ borderColor: "var(--ink-mid)", color: "var(--parchment-dim)" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveBoost}
                        disabled={saving}
                        className="rounded-md border px-5 py-2 font-mono text-sm disabled:opacity-40"
                        style={{ backgroundColor: "var(--vermillion-wash)", borderColor: "var(--vermillion)", color: "var(--vermillion-glow)" }}
                      >
                        {saving ? "Saving..." : "Save Boost"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                {boosts.length === 0 ? (
                  <p className="font-mono text-sm py-6 text-center" style={{ color: "var(--parchment-dim)" }}>
                    No boosts logged yet.
                  </p>
                ) : (
                  boosts.map((b, i) => {
                    const days = boostAgeDays(b.date);
                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 * i, duration: 0.3, ease: [...ease] }}
                        className="rounded-lg border p-3"
                        style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm" style={{ color: "var(--parchment)" }}>
                              {b.rubber} — {b.blade} {b.side.toUpperCase()}
                            </p>
                            <p className="font-mono text-xs mt-0.5" style={{ color: "var(--parchment-dim)" }}>
                              {b.booster} · {formatDate(b.date)}
                            </p>
                            {b.notes && (
                              <p className="font-mono text-xs mt-0.5" style={{ color: "var(--parchment-muted)" }}>
                                {b.notes}
                              </p>
                            )}
                          </div>
                          <span
                            className="font-mono text-xs shrink-0"
                            style={{ color: days > 21 ? "var(--vermillion)" : "var(--parchment-dim)" }}
                          >
                            {days}d ago
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
