"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─────────────────────────────────────────────────────── */

type EntryType = "reflection" | "capture" | "note";

type JournalEntry = {
  id: string;
  type: EntryType;
  title: string | null;
  body: string;
  prompt: string | null;
  tags: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
};

type FilterTab = "all" | EntryType;

/* ─── Constants ─────────────────────────────────────────────────── */

const ease = [0.22, 1, 0.36, 1] as const;

const PROMPTS = [
  "What's weighing on you?",
  "What went well today?",
  "What are you avoiding?",
  "What would make tomorrow great?",
];

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reflection", label: "Reflections" },
  { key: "capture", label: "Captures" },
  { key: "note", label: "Notes" },
];

const TYPE_BADGE: Record<EntryType, string> = {
  reflection: "bg-vermillion/10 text-vermillion",
  capture: "bg-gold-seal/10 text-gold-seal",
  note: "bg-sumi-gray/10 text-sumi-gray",
};

/* ─── Helpers ───────────────────────────────────────────────────── */

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateHeader(dateStr: string): string {
  const today = todayDateStr();
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yesterdayStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, "0")}-${String(yest.getDate()).padStart(2, "0")}`;

  if (dateStr === today) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function preview(text: string, max = 120): string {
  const clean = text.replace(/\n+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + "...";
}

function groupByDate(entries: JournalEntry[]): [string, JournalEntry[]][] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const key = e.date.slice(0, 10);
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }
  return Array.from(map.entries());
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function JournalPage() {
  /* --- Prompt & reflection state --- */
  const [promptText, setPromptText] = useState("");
  const [reflectionBody, setReflectionBody] = useState("");
  const [todayReflection, setTodayReflection] = useState<JournalEntry | null>(null);
  const [reflectionExpanded, setReflectionExpanded] = useState(false);
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const reflectionRef = useRef<HTMLTextAreaElement>(null);

  /* --- Quick capture --- */
  const [captureText, setCaptureText] = useState("");
  const [captureSaving, setCaptureSaving] = useState(false);

  /* --- Feed state --- */
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- Editing state --- */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState("");

  /* --- New note modal --- */
  const [showNewNote, setShowNewNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteTags, setNoteTags] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  /* ── Auto-resize textarea ── */
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(120, el.scrollHeight) + "px";
  }, []);

  /* ── Fetch prompt ── */
  const fetchPrompt = useCallback(async () => {
    try {
      const res = await fetch("/api/journal/prompt");
      if (res.ok) {
        const data = await res.json();
        setPromptText(data.prompt || "");
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Check for today's reflection ── */
  const checkTodayReflection = useCallback(async () => {
    try {
      const res = await fetch("/api/journal?type=reflection&days=1&limit=10");
      if (!res.ok) return;
      const data: JournalEntry[] = await res.json();
      const today = todayDateStr();
      const match = data.find((e) => e.date.slice(0, 10) === today);
      setTodayReflection(match || null);
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Fetch entries ── */
  const fetchEntries = useCallback(
    async (typeFilter?: FilterTab, searchQuery?: string) => {
      const params = new URLSearchParams({ days: "90", limit: "50" });
      const t = typeFilter ?? filter;
      const s = searchQuery ?? search;
      if (t !== "all") params.set("type", t);
      if (s.trim()) params.set("search", s.trim());

      try {
        const res = await fetch(`/api/journal?${params.toString()}`);
        if (res.ok) {
          const data: JournalEntry[] = await res.json();
          setEntries(data);
        }
      } catch {
        /* ignore */
      }
    },
    [filter, search]
  );

  /* ── Init ── */
  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchPrompt(), checkTodayReflection(), fetchEntries()]);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Save reflection ── */
  async function saveReflection() {
    if (!reflectionBody.trim()) return;
    setReflectionSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reflection",
          body: reflectionBody.trim(),
          prompt: promptText || undefined,
        }),
      });
      if (res.ok) {
        setReflectionBody("");
        await Promise.all([checkTodayReflection(), fetchEntries()]);
      }
    } catch {
      /* ignore */
    } finally {
      setReflectionSaving(false);
    }
  }

  /* ── Quick capture submit ── */
  async function submitCapture() {
    if (!captureText.trim()) return;
    setCaptureSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "capture", body: captureText.trim() }),
      });
      if (res.ok) {
        setCaptureText("");
        await fetchEntries();
      }
    } catch {
      /* ignore */
    } finally {
      setCaptureSaving(false);
    }
  }

  /* ── Filter change ── */
  function handleFilterChange(tab: FilterTab) {
    setFilter(tab);
    setExpandedId(null);
    setEditingId(null);
    fetchEntries(tab, search);
  }

  /* ── Debounced search ── */
  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchEntries(filter, value);
    }, 300);
  }

  /* ── Start editing ── */
  function startEditing(entry: JournalEntry) {
    setEditingId(entry.id);
    setEditTitle(entry.title || "");
    setEditBody(entry.body);
    setEditTags((entry.tags || []).join(", "));
  }

  /* ── Save edit ── */
  async function saveEdit(id: string) {
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          body: editBody.trim(),
          tags: editTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchEntries();
      }
    } catch {
      /* ignore */
    }
  }

  /* ── Delete entry ── */
  async function deleteEntry(id: string) {
    if (!window.confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExpandedId(null);
        setEditingId(null);
        await Promise.all([checkTodayReflection(), fetchEntries()]);
      }
    } catch {
      /* ignore */
    }
  }

  /* ── Save new note ── */
  async function saveNote() {
    if (!noteBody.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          title: noteTitle.trim() || undefined,
          body: noteBody.trim(),
          tags: noteTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowNewNote(false);
        setNoteTitle("");
        setNoteBody("");
        setNoteTags("");
        await fetchEntries();
      }
    } catch {
      /* ignore */
    } finally {
      setNoteSaving(false);
    }
  }

  /* ── Append prompt to reflection ── */
  function appendPrompt(prompt: string) {
    const suffix = todayReflection ? "" : `${reflectionBody ? "\n\n" : ""}## ${prompt}\n\n`;
    const newBody = reflectionBody + suffix;
    setReflectionBody(newBody);
    requestAnimationFrame(() => {
      const el = reflectionRef.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = newBody.length;
        autoResize(el);
      }
    });
  }

  /* ── Grouped entries ── */
  const grouped = groupByDate(entries);

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* ── Header + New Note button ── */}
      <motion.div
        className="flex items-end justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <div>
          <h1
            className="text-ink-black font-light"
            style={{ fontSize: "var(--text-heading)" }}
          >
            Journal
          </h1>
          <p className="text-sumi-gray-light text-sm mt-1">
            Write to think. Think to grow.
          </p>
        </div>
        <button
          onClick={() => setShowNewNote(true)}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
          style={{ fontSize: "var(--text-micro)" }}
        >
          New Note
        </button>
      </motion.div>

      {/* ── New Note Modal ── */}
      <AnimatePresence>
        {showNewNote && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                style={{ fontSize: "var(--text-micro)" }}
              >
                New Note
              </span>
              <button
                onClick={() => setShowNewNote(false)}
                className="text-sumi-gray-light hover:text-sumi-gray transition-colors"
              >
                &times;
              </button>
            </div>
            <input
              type="text"
              placeholder="Title (optional)"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
              style={{ fontSize: "var(--text-body)" }}
            />
            <textarea
              placeholder="Write your note..."
              value={noteBody}
              onChange={(e) => {
                setNoteBody(e.target.value);
                autoResize(e.target);
              }}
              className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 resize-none"
              style={{ fontSize: "var(--text-body)", minHeight: 120 }}
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={noteTags}
              onChange={(e) => setNoteTags(e.target.value)}
              className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
              style={{ fontSize: "var(--text-small)" }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewNote(false)}
                className="border border-sumi-gray/20 text-sumi-gray-light rounded-xl px-4 py-2 font-mono tracking-[0.08em] hover:border-sumi-gray/30 transition-all duration-300"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={!noteBody.trim() || noteSaving}
                className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-50"
                style={{ fontSize: "var(--text-micro)" }}
              >
                {noteSaving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sumi-gray-light text-sm py-12 text-center"
        >
          Loading...
        </motion.div>
      ) : (
        <>
          {/* ── Today's Prompt Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
          >
            {todayReflection ? (
              /* --- Summary card --- */
              <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4">
                <span
                  className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  Today&apos;s reflection
                </span>
                <button
                  onClick={() => setReflectionExpanded(!reflectionExpanded)}
                  className="block w-full text-left mt-2"
                >
                  <p
                    className="text-ink-black leading-relaxed"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    {reflectionExpanded
                      ? todayReflection.body
                      : preview(todayReflection.body, 120)}
                  </p>
                </button>
                <AnimatePresence>
                  {reflectionExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      {todayReflection.prompt && (
                        <p
                          className="text-sumi-gray-light italic mt-2"
                          style={{ fontSize: "var(--text-small)" }}
                        >
                          Prompt: {todayReflection.prompt}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* --- Write reflection --- */
              <div className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 space-y-3">
                {promptText && (
                  <p
                    className="italic text-sumi-gray-light"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    {promptText}
                  </p>
                )}
                <textarea
                  ref={reflectionRef}
                  value={reflectionBody}
                  onChange={(e) => {
                    setReflectionBody(e.target.value);
                    autoResize(e.target);
                  }}
                  placeholder="Reflect on your day..."
                  className="w-full bg-transparent text-ink-black resize-none focus:outline-none placeholder:text-sumi-gray-light/30"
                  style={{
                    fontSize: "var(--text-body)",
                    lineHeight: 1.8,
                    minHeight: 120,
                  }}
                />
                <div className="flex justify-end">
                  <button
                    onClick={saveReflection}
                    disabled={!reflectionBody.trim() || reflectionSaving}
                    className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-50"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {reflectionSaving ? "Saving..." : "Save Reflection"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Quick Capture Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitCapture();
                }
              }}
              placeholder="Capture a thought..."
              className="flex-1 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
              style={{ fontSize: "var(--text-body)" }}
            />
            <button
              onClick={submitCapture}
              disabled={!captureText.trim() || captureSaving}
              className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-50 shrink-0"
              style={{ fontSize: "var(--text-micro)" }}
            >
              {captureSaving ? "..." : "Send"}
            </button>
          </motion.div>

          {/* ── Filter Tabs + Search ── */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease }}
          >
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`px-3 py-1.5 rounded-full font-mono tracking-[0.04em] transition-all duration-300 ${
                    filter === tab.key
                      ? "bg-vermillion/15 border border-vermillion/30 text-vermillion"
                      : "border border-sumi-gray/20 text-sumi-gray-light hover:border-sumi-gray/30"
                  }`}
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search entries..."
              className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
              style={{ fontSize: "var(--text-body)" }}
            />
          </motion.div>

          {/* ── Entry Feed grouped by date ── */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease }}
          >
            {grouped.length === 0 && (
              <p className="text-sumi-gray-light text-sm text-center py-8">
                No entries yet.
              </p>
            )}

            {grouped.map(([dateKey, dateEntries]) => (
              <div key={dateKey} className="space-y-2">
                <h2
                  className="font-mono tracking-[0.08em] text-sumi-gray"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  {formatDateHeader(dateKey)}
                </h2>

                {dateEntries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const isEditing = editingId === entry.id;

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl overflow-hidden"
                    >
                      {/* Entry header (clickable) */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.id)
                        }
                        className="w-full text-left p-4 hover:bg-parchment-warm/60 transition-colors duration-200"
                      >
                        <div className="flex items-start gap-3">
                          {/* Type badge */}
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full font-mono tracking-[0.04em] ${TYPE_BADGE[entry.type]}`}
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {entry.type}
                          </span>

                          <div className="flex-1 min-w-0">
                            {/* Title or first line */}
                            {entry.title ? (
                              <p
                                className="text-ink-black font-light truncate"
                                style={{ fontSize: "var(--text-body)" }}
                              >
                                {entry.title}
                              </p>
                            ) : null}

                            {/* Preview */}
                            {!isExpanded && (
                              <p
                                className="text-sumi-gray-light leading-relaxed mt-0.5"
                                style={{ fontSize: "var(--text-small)" }}
                              >
                                {preview(entry.body)}
                              </p>
                            )}
                          </div>

                          {/* Relative time */}
                          <span
                            className="font-mono text-sumi-gray-light shrink-0"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {relativeTime(entry.createdAt)}
                          </span>
                        </div>
                      </button>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0 space-y-3">
                              {isEditing ? (
                                /* --- Edit mode --- */
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) =>
                                      setEditTitle(e.target.value)
                                    }
                                    placeholder="Title (optional)"
                                    className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
                                    style={{ fontSize: "var(--text-body)" }}
                                  />
                                  <textarea
                                    value={editBody}
                                    onChange={(e) => {
                                      setEditBody(e.target.value);
                                      autoResize(e.target);
                                    }}
                                    className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black focus:outline-none focus:border-vermillion/30 resize-none"
                                    style={{
                                      fontSize: "var(--text-body)",
                                      minHeight: 100,
                                    }}
                                  />
                                  <input
                                    type="text"
                                    value={editTags}
                                    onChange={(e) =>
                                      setEditTags(e.target.value)
                                    }
                                    placeholder="Tags (comma-separated)"
                                    className="w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30"
                                    style={{ fontSize: "var(--text-small)" }}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="border border-sumi-gray/20 text-sumi-gray-light rounded-xl px-4 py-2 font-mono tracking-[0.08em] hover:border-sumi-gray/30 transition-all duration-300"
                                      style={{ fontSize: "var(--text-micro)" }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => saveEdit(entry.id)}
                                      className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
                                      style={{ fontSize: "var(--text-micro)" }}
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* --- View mode --- */
                                <>
                                  <div
                                    className="text-ink-black whitespace-pre-wrap leading-relaxed"
                                    style={{ fontSize: "var(--text-body)" }}
                                  >
                                    {entry.body}
                                  </div>

                                  {entry.tags && entry.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {entry.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="bg-sumi-gray/10 text-sumi-gray rounded-full px-2 py-0.5 font-mono"
                                          style={{
                                            fontSize: "var(--text-micro)",
                                          }}
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {entry.prompt && (
                                    <p
                                      className="text-sumi-gray-light italic"
                                      style={{ fontSize: "var(--text-small)" }}
                                    >
                                      Prompt: {entry.prompt}
                                    </p>
                                  )}

                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => startEditing(entry)}
                                      className="border border-sumi-gray/20 text-sumi-gray-light rounded-xl px-4 py-1.5 font-mono tracking-[0.08em] hover:border-sumi-gray/30 hover:text-sumi-gray transition-all duration-300"
                                      style={{ fontSize: "var(--text-micro)" }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteEntry(entry.id)}
                                      className="border border-vermillion/20 text-vermillion/60 rounded-xl px-4 py-1.5 font-mono tracking-[0.08em] hover:border-vermillion/40 hover:text-vermillion transition-all duration-300"
                                      style={{ fontSize: "var(--text-micro)" }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </motion.div>

          {/* ── Reflection Prompt Pills ── */}
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease }}
          >
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => appendPrompt(prompt)}
                className="bg-parchment-warm/40 border border-sumi-gray/20 text-sumi-gray-light rounded-full px-4 py-1.5 font-mono tracking-[0.04em] hover:border-vermillion/30 hover:text-sumi-gray transition-all duration-300"
                style={{ fontSize: "var(--text-micro)" }}
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
