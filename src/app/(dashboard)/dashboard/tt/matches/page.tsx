"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

const inputClass =
  "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] placeholder:text-[var(--parchment-dim)] focus:border-[var(--vermillion)] focus:outline-none";
const labelClass = "block font-mono text-xs text-[var(--parchment-muted)] mb-1";

type GameScore = { you: string; them: string };

type TTMatch = {
  id: string;
  date: string;
  opponent: string;
  result: string;
  blade: string;
  tournament?: string | null;
  peakMode?: number | null;
  scores?: unknown;
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function calcResult(games: GameScore[]): "W" | "L" | "?" {
  const valid = games.filter((g) => g.you !== "" && g.them !== "");
  if (valid.length === 0) return "?";
  const wins = valid.filter((g) => parseInt(g.you) > parseInt(g.them)).length;
  const losses = valid.length - wins;
  if (wins > losses) return "W";
  if (losses > wins) return "L";
  return "?";
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<TTMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [date, setDate] = useState(todayStr());
  const [opponent, setOpponent] = useState("");
  const [blade, setBlade] = useState("FZD ALC");
  const [tournament, setTournament] = useState("");
  const [games, setGames] = useState<GameScore[]>([{ you: "", them: "" }]);
  const [opponentStyle, setOpponentStyle] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [whatBroke, setWhatBroke] = useState("");
  const [servesUsed, setServesUsed] = useState("");
  const [receiveNotes, setReceiveNotes] = useState("");
  const [tacticalNotes, setTacticalNotes] = useState("");
  const [peakMode, setPeakMode] = useState("2");

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    setLoading(true);
    try {
      const res = await fetch("/api/tt/matches?limit=100");
      if (res.ok) setMatches(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  function addGame() {
    setGames((prev) => [...prev, { you: "", them: "" }]);
  }

  function updateGame(i: number, field: "you" | "them", val: string) {
    setGames((prev) => prev.map((g, idx) => (idx === i ? { ...g, [field]: val } : g)));
  }

  function resetForm() {
    setDate(todayStr());
    setOpponent("");
    setBlade("FZD ALC");
    setTournament("");
    setGames([{ you: "", them: "" }]);
    setOpponentStyle("");
    setWhatWorked("");
    setWhatBroke("");
    setServesUsed("");
    setReceiveNotes("");
    setTacticalNotes("");
    setPeakMode("2");
  }

  async function saveMatch() {
    if (!date || !opponent || !blade) return;
    const result = calcResult(games);
    if (result === "?") return;
    setSaving(true);
    try {
      const validGames = games.filter((g) => g.you !== "" && g.them !== "").map((g) => ({
        you: parseInt(g.you),
        them: parseInt(g.them),
      }));
      const res = await fetch("/api/tt/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          opponent: opponent.trim(),
          result,
          blade,
          tournament: tournament.trim() || undefined,
          scores: validGames.length > 0 ? validGames : undefined,
          opponentNotes: opponentStyle.trim() || undefined,
          whatWorked: whatWorked.trim() || undefined,
          whatBroke: whatBroke.trim() || undefined,
          servesUsed: servesUsed.trim() || undefined,
          receiveNotes: receiveNotes.trim() || undefined,
          tacticalNotes: tacticalNotes.trim() || undefined,
          peakMode: peakMode ? parseInt(peakMode) : undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        await fetchMatches();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  const autoResult = calcResult(games);

  return (
    <div className="max-w-2xl space-y-6">
      <motion.div
        className="flex items-end justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [...ease] }}
      >
        <h1 className="font-mono text-2xl font-light" style={{ color: "var(--parchment)" }}>
          戦 — Match Journal
        </h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md border px-4 py-2 font-mono text-sm transition-colors hover:opacity-80"
            style={{
              backgroundColor: "var(--vermillion-wash)",
              borderColor: "var(--vermillion)",
              color: "var(--vermillion-glow)",
            }}
          >
            New Match
          </button>
        )}
      </motion.div>

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
                New Match
              </span>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Opponent</label>
                <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Name" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Blade</label>
                <select value={blade} onChange={(e) => setBlade(e.target.value)} className={inputClass}>
                  <option>FZD ALC</option>
                  <option>Q968</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tournament</label>
                <input type="text" value={tournament} onChange={(e) => setTournament(e.target.value)} placeholder="Optional" className={inputClass} />
              </div>
            </div>

            {/* Scores */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>Scores</span>
                  {autoResult !== "?" && (
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: autoResult === "W" ? "var(--gold-seal)" : "var(--vermillion)" }}
                    >
                      {autoResult}
                    </span>
                  )}
                </div>
                <button onClick={addGame} className="font-mono text-xs" style={{ color: "var(--vermillion-glow)" }}>
                  + Add game
                </button>
              </div>
              {games.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-mono text-xs w-8 shrink-0" style={{ color: "var(--parchment-dim)" }}>G{i + 1}</span>
                  <input
                    type="number"
                    value={g.you}
                    onChange={(e) => updateGame(i, "you", e.target.value)}
                    placeholder="You"
                    className={inputClass}
                    min={0}
                  />
                  <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>—</span>
                  <input
                    type="number"
                    value={g.them}
                    onChange={(e) => updateGame(i, "them", e.target.value)}
                    placeholder="Them"
                    className={inputClass}
                    min={0}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>Opponent Style</label>
              <input type="text" value={opponentStyle} onChange={(e) => setOpponentStyle(e.target.value)} placeholder="Penhold looper, defender..." className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>What Worked</label>
                <textarea value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} rows={3} placeholder="..." className={inputClass + " resize-none"} />
              </div>
              <div>
                <label className={labelClass}>What Broke</label>
                <textarea value={whatBroke} onChange={(e) => setWhatBroke(e.target.value)} rows={3} placeholder="..." className={inputClass + " resize-none"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Serves Used</label>
                <input type="text" value={servesUsed} onChange={(e) => setServesUsed(e.target.value)} placeholder="Pendulum, reverse..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Receive Notes</label>
                <input type="text" value={receiveNotes} onChange={(e) => setReceiveNotes(e.target.value)} placeholder="..." className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tactical Notes for Next Time</label>
              <textarea value={tacticalNotes} onChange={(e) => setTacticalNotes(e.target.value)} rows={3} placeholder="..." className={inputClass + " resize-none"} />
            </div>

            <div>
              <label className={labelClass}>Peak Mode</label>
              <select value={peakMode} onChange={(e) => setPeakMode(e.target.value)} className={inputClass}>
                {[1, 2, 3, 4].map((m) => (
                  <option key={m} value={m}>{m} — {MODE_NAMES[m]}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="rounded-md border px-4 py-2 font-mono text-sm"
                style={{ borderColor: "var(--ink-mid)", color: "var(--parchment-dim)" }}
              >
                Cancel
              </button>
              <button
                onClick={saveMatch}
                disabled={!date || !opponent || !blade || autoResult === "?" || saving}
                className="rounded-md border px-5 py-2 font-mono text-sm disabled:opacity-40"
                style={{ backgroundColor: "var(--vermillion-wash)", borderColor: "var(--vermillion)", color: "var(--vermillion-glow)" }}
              >
                {saving ? "Saving..." : "Save Match"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="font-mono text-sm" style={{ color: "var(--parchment-dim)" }}>Loading...</p>
      ) : matches.length === 0 ? (
        <p className="font-mono text-sm py-8 text-center" style={{ color: "var(--parchment-dim)" }}>
          No matches logged yet.
        </p>
      ) : (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [...ease] }}
        >
          {matches.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35, ease: [...ease] }}
            >
              <a
                href={`/dashboard/tt/matches/${m.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--ink-dark)", borderColor: "var(--ink-mid)" }}
              >
                <span
                  className="font-mono text-2xl font-light tabular-nums w-8 shrink-0"
                  style={{ color: m.result === "W" ? "var(--gold-seal)" : "var(--vermillion)" }}
                >
                  {m.result}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate" style={{ color: "var(--parchment)" }}>
                    {m.opponent}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                      {formatDate(m.date)}
                    </span>
                    <span className="font-mono text-xs" style={{ color: "var(--parchment-dim)" }}>
                      {m.blade}
                    </span>
                    {m.tournament && (
                      <span className="font-mono text-xs" style={{ color: "var(--parchment-muted)" }}>
                        {m.tournament}
                      </span>
                    )}
                  </div>
                </div>
                {m.peakMode != null && (
                  <span
                    className="font-mono text-xs shrink-0 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: "var(--ink-deep)", border: "1px solid var(--ink-mid)", color: "var(--parchment-muted)" }}
                  >
                    M{m.peakMode}
                  </span>
                )}
              </a>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
