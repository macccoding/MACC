"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const MOOD_LABELS = [
  { value: 1, kanji: "怒", label: "Awful", color: "text-red-500" },
  { value: 2, kanji: "憂", label: "Low", color: "text-orange-500" },
  { value: 3, kanji: "平", label: "Okay", color: "text-yellow-600" },
  { value: 4, kanji: "楽", label: "Good", color: "text-green-600" },
  { value: 5, kanji: "喜", label: "Great", color: "text-emerald-600" },
];

const ENERGY_LABELS = [
  { value: 1, label: "Drained" },
  { value: 2, label: "Low" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Energized" },
  { value: 5, label: "Peak" },
];

interface MoodCheckInProps {
  onComplete?: () => void;
  compact?: boolean;
}

export function MoodCheckIn({ onComplete, compact }: MoodCheckInProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSave() {
    if (mood === null || energy === null) return;
    setSaving(true);
    try {
      await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, energy, note: note.trim() || undefined }),
      });
      setDone(true);
      onComplete?.();
    } catch {
      // silently fail
    }
    setSaving(false);
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 text-center"
      >
        <p className="text-vermillion text-sm font-serif">Check-in saved</p>
      </motion.div>
    );
  }

  return (
    <div className={`bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl ${compact ? "p-3" : "p-4"}`}>
      <p className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light text-[10px] mb-3">
        How are you feeling?
      </p>

      {/* Mood selector */}
      <div className="mb-3">
        <p className="text-[10px] text-sumi-gray-light mb-1.5">Mood</p>
        <div className="flex gap-1.5 justify-between">
          {MOOD_LABELS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                mood === m.value
                  ? `bg-parchment-warm border border-vermillion/30 ${m.color}`
                  : "text-sumi-gray-light hover:text-ink-black hover:bg-parchment-warm/50"
              }`}
            >
              <span className="text-lg font-serif">{m.kanji}</span>
              <span className="text-[9px]">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy selector */}
      <div className="mb-3">
        <p className="text-[10px] text-sumi-gray-light mb-1.5">Energy</p>
        <div className="flex gap-1">
          {ENERGY_LABELS.map((e) => (
            <button
              key={e.value}
              onClick={() => setEnergy(e.value)}
              className={`flex-1 py-1.5 rounded text-[10px] transition-all ${
                energy === e.value
                  ? "bg-vermillion text-white"
                  : energy !== null && e.value <= energy
                    ? "bg-vermillion/20 text-vermillion"
                    : "bg-parchment-warm/60 text-sumi-gray-light hover:bg-parchment-warm"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      {!compact && (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note..."
          className="w-full bg-parchment-warm/60 border border-sumi-gray/15 rounded-lg px-3 py-2 text-sm text-ink-black placeholder-sumi-gray-light outline-none focus:border-vermillion/30 mb-3"
        />
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={mood === null || energy === null || saving}
        className="w-full py-2 rounded-lg text-sm font-medium bg-vermillion text-white hover:bg-vermillion/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving..." : "Log Check-in"}
      </button>
    </div>
  );
}
