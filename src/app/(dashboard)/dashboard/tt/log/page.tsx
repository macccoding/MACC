"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const ease = [0.22, 1, 0.36, 1] as const;

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

const CATEGORIES = [
  { value: "sharingan", label: "Sharingan", desc: "Serve/Receive" },
  { value: "amaterasu", label: "Amaterasu", desc: "Forehand" },
  { value: "totsuka", label: "Totsuka", desc: "Kill/Attack" },
  { value: "yata-mirror", label: "Yata Mirror", desc: "Block/Defense" },
];

const BLADES = ["FZD ALC", "Q968"];

const inputClass =
  "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] placeholder:text-[var(--parchment-dim)] focus:border-[var(--vermillion)] focus:outline-none";
const labelClass = "block font-mono text-xs text-[var(--parchment-muted)] mb-1";

type Drill = {
  name: string;
  category: string;
  technique: string;
  rating: string;
  notes: string;
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
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function emptyDrill(): Drill {
  return { name: "", category: "sharingan", technique: "", rating: "", notes: "" };
}

export default function TrainingLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewParam = searchParams.get("new") === "1";

  const [showForm, setShowForm] = useState(isNewParam);
  const [sessions, setSessions] = useState<TTSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [date, setDate] = useState(todayStr());
  const [duration, setDuration] = useState("");
  const [blade, setBlade] = useState("FZD ALC");
  const [location, setLocation] = useState("");
  const [mode1, setMode1] = useState<"yes" | "no" | "unsure">("unsure");
  const [peakMode, setPeakMode] = useState<string>("2");
  const [energy, setEnergy] = useState<string>("7");
  const [drills, setDrills] = useState<Drill[]>([emptyDrill()]);
  const [sessionNotes, setSessionNotes] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/tt/sessions?limit=50");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  function openForm() {
    setShowForm(true);
    router.replace("/dashboard/tt/log?new=1");
  }

  function closeForm() {
    setShowForm(false);
    router.replace("/dashboard/tt/log");
  }

  function addDrill() {
    setDrills((prev) => [...prev, emptyDrill()]);
  }

  function removeDrill(i: number) {
    setDrills((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateDrill(i: number, field: keyof Drill, value: string) {
    setDrills((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  }

  async function saveSession() {
    if (!date || !duration || !blade) return;
    setSaving(true);
    try {
      const payload = {
        date,
        duration: parseInt(duration, 10),
        blade,
        location: location.trim() || undefined,
        mode1Respected: mode1 === "yes" ? true : mode1 === "no" ? false : undefined,
        peakMode: peakMode ? parseInt(peakMode, 10) : undefined,
        energyLevel: energy ? parseInt(energy, 10) : undefined,
        notes: sessionNotes.trim() || undefined,
        drills: drills
          .filter((d) => d.name.trim())
          .map((d) => ({
            name: d.name.trim(),
            category: d.category,
            technique: d.technique.trim() || undefined,
            rating: d.rating ? parseInt(d.rating, 10) : undefined,
            notes: d.notes.trim() || undefined,
          })),
      };
      const res = await fetch("/api/tt/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        closeForm();
        await fetchSessions();
        // Reset form
        setDate(todayStr());
        setDuration("");
        setBlade("FZD ALC");
        setLocation("");
        setMode1("unsure");
        setPeakMode("2");
        setEnergy("7");
        setDrills([emptyDrill()]);
        setSessionNotes("");
      }
    } catch {
      /* ignore */
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-end justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...ease] }}
      >
        <div>
          <h1 className="font-mono text-2xl font-light" style={{ color: "var(--parchment)" }}>
            記 — Training Log
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={openForm}
            className="rounded-md border px-4 py-2 font-mono text-sm transition-colors hover:opacity-80"
            style={{
              backgroundColor: "var(--vermillion-wash)",
              borderColor: "var(--vermillion)",
              color: "var(--vermillion-glow)",
            }}
          >
            New Session
          </button>
        )}
      </motion.div>

      {/* New Session Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [...ease] }}
            className="rounded-lg border p-4 space-y-4"
            style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--parchment-muted)" }}>
                New Session
              </span>
              <button
                onClick={closeForm}
                className="font-mono text-sm"
                style={{ color: "var(--parchment-dim)" }}
              >
                ×
              </button>
            </div>

            {/* Row 1: Date + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="90"
                  className={inputClass}
                  min={1}
                />
              </div>
            </div>

            {/* Row 2: Blade + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Blade</label>
                <select
                  value={blade}
                  onChange={(e) => setBlade(e.target.value)}
                  className={inputClass}
                >
                  {BLADES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Club, gym..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 3: Mode 1 + Peak Mode + Energy */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Mode 1 Respected</label>
                <select
                  value={mode1}
                  onChange={(e) => setMode1(e.target.value as "yes" | "no" | "unsure")}
                  className={inputClass}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Unsure</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Peak Mode</label>
                <select
                  value={peakMode}
                  onChange={(e) => setPeakMode(e.target.value)}
                  className={inputClass}
                >
                  {[1, 2, 3, 4].map((m) => (
                    <option key={m} value={m}>
                      {m} — {MODE_NAMES[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Energy (1-10)</label>
                <input
                  type="number"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  min={1}
                  max={10}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Drills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
                  Drills
                </span>
                <button
                  onClick={addDrill}
                  className="font-mono text-xs"
                  style={{ color: "var(--vermillion-glow)" }}
                >
                  + Add drill
                </button>
              </div>
              {drills.map((drill, i) => (
                <div
                  key={i}
                  className="rounded-md border p-3 space-y-2"
                  style={{ borderColor: "var(--ink-mid)", backgroundColor: "var(--ink-deep)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                      Drill {i + 1}
                    </span>
                    {drills.length > 1 && (
                      <button
                        onClick={() => removeDrill(i)}
                        className="font-mono text-xs"
                        style={{ color: "var(--parchment-dim)" }}
                      >
                        × remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        type="text"
                        value={drill.name}
                        onChange={(e) => updateDrill(i, "name", e.target.value)}
                        placeholder="Drill name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Category</label>
                      <select
                        value={drill.category}
                        onChange={(e) => updateDrill(i, "category", e.target.value)}
                        className={inputClass}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label} — {c.desc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Technique tag</label>
                      <input
                        type="text"
                        value={drill.technique}
                        onChange={(e) => updateDrill(i, "technique", e.target.value)}
                        placeholder="e.g. bh-flick"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Rating (1-10)</label>
                      <input
                        type="number"
                        value={drill.rating}
                        onChange={(e) => updateDrill(i, "rating", e.target.value)}
                        min={1}
                        max={10}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Notes</label>
                    <input
                      type="text"
                      value={drill.notes}
                      onChange={(e) => updateDrill(i, "notes", e.target.value)}
                      placeholder="Observations..."
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Session Notes */}
            <div>
              <label className={labelClass}>Session Notes</label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
                placeholder="Overall session notes..."
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={closeForm}
                className="rounded-md border px-4 py-2 font-mono text-sm transition-colors"
                style={{ borderColor: "var(--ink-mid)", color: "var(--parchment-dim)" }}
              >
                Cancel
              </button>
              <button
                onClick={saveSession}
                disabled={!date || !duration || !blade || saving}
                className="rounded-md border px-5 py-2 font-mono text-sm transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: "var(--vermillion-wash)",
                  borderColor: "var(--vermillion)",
                  color: "var(--vermillion-glow)",
                }}
              >
                {saving ? "Saving..." : "Save Session"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session List */}
      {loading ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-sm"
          style={{ color: "var(--parchment-dim)" }}
        >
          Loading...
        </motion.p>
      ) : sessions.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-sm py-8 text-center"
          style={{ color: "var(--parchment-dim)" }}
        >
          No sessions yet. Log your first one.
        </motion.p>
      ) : (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [...ease] }}
        >
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4, ease: [...ease] }}
            >
              <Link
                href={`/dashboard/tt/log/${s.id}`}
                className="block rounded-lg border p-4 transition-colors hover:opacity-80"
                style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-mono text-sm" style={{ color: "var(--parchment)" }}>
                      {formatDate(s.date)}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                        {s.duration}min
                      </span>
                      <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                        {s.blade}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.peakMode != null && (
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-xs"
                        style={{
                          backgroundColor: "var(--ink-deep)",
                          borderColor: "var(--ink-mid)",
                          color: "var(--parchment-muted)",
                          border: "1px solid",
                        }}
                      >
                        M{s.peakMode} {MODE_NAMES[s.peakMode]}
                      </span>
                    )}
                    {s.mode1Respected !== null && s.mode1Respected !== undefined && (
                      <span
                        className="font-mono text-xs"
                        style={{
                          color: s.mode1Respected ? "var(--gold-seal)" : "var(--vermillion)",
                        }}
                      >
                        {s.mode1Respected ? "✓ M1" : "✗ M1"}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
