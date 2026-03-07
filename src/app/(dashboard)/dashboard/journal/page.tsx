"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type JournalEntry = {
  id?: string;
  date: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const PROMPTS = [
  "What's weighing on you?",
  "What went well today?",
  "What are you avoiding?",
  "What would make tomorrow great?",
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function preview(content: string, max = 120): string {
  const clean = content.replace(/\n+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + "...";
}

export default function JournalPage() {
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(300, el.scrollHeight) + "px";
  }, []);

  // Save to API
  const save = useCallback(
    async (text: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/journal/today", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          // Refresh past entries to reflect updated today
          fetchEntries();
        }
      } catch (err) {
        console.error("Failed to save journal:", err);
        setSaveStatus("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Debounced save
  const debouncedSave = useCallback(
    (text: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaveStatus("idle");
      timerRef.current = setTimeout(() => {
        save(text);
      }, 2000);
    },
    [save]
  );

  // Handle content change
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedSave(newContent);
    resizeTextarea();
  }

  // Save immediately on blur
  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (content.trim()) {
      save(content);
    }
  }

  // Append reflection prompt
  function appendPrompt(prompt: string) {
    const suffix = `\n\n## ${prompt}\n\n`;
    const newContent = content + suffix;
    setContent(newContent);
    debouncedSave(newContent);
    // Focus and move cursor to end
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = newContent.length;
        resizeTextarea();
      }
    });
  }

  // Fetch today's entry
  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch("/api/journal/today");
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || "");
        requestAnimationFrame(resizeTextarea);
      }
    } catch (err) {
      console.error("Failed to fetch today's entry:", err);
    }
  }, [resizeTextarea]);

  // Fetch past entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/journal?limit=14");
      if (res.ok) {
        const data: JournalEntry[] = await res.json();
        // Filter out today's entry from the list
        const todayStr = new Date().toISOString().slice(0, 10);
        setEntries(data.filter((e) => e.date.slice(0, 10) !== todayStr));
      }
    } catch (err) {
      console.error("Failed to fetch journal entries:", err);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchToday(), fetchEntries()]);
      setLoading(false);
    }
    init();
  }, [fetchToday, fetchEntries]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Journal
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          Write to think. Think to grow.
        </p>
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-parchment-dim text-sm py-12 text-center"
        >
          Loading...
        </motion.div>
      ) : (
        <>
          {/* Today's Entry */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Start writing..."
              className="w-full bg-transparent text-parchment font-serif resize-none focus:outline-none placeholder:text-parchment-dim/30"
              style={{
                fontSize: "var(--text-subheading)",
                lineHeight: 1.8,
                minHeight: 300,
              }}
            />

            {/* Save indicator */}
            <div className="mt-2 h-5">
              <AnimatePresence mode="wait">
                {saveStatus !== "idle" && (
                  <motion.span
                    key={saveStatus}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-sumi-gray"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {saveStatus === "saving" ? "Saving..." : "Saved"}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Reflection Prompts */}
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease }}
          >
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => appendPrompt(prompt)}
                className="bg-ink-dark/40 border border-sumi-gray-dark/12 text-parchment-dim rounded-full px-4 py-1.5 font-mono tracking-[0.04em] hover:border-vermillion/30 hover:text-parchment-muted transition-all duration-300"
                style={{ fontSize: "var(--text-micro)" }}
              >
                {prompt}
              </button>
            ))}
          </motion.div>

          {/* Divider */}
          {entries.length > 0 && (
            <motion.div
              className="border-t border-sumi-gray-dark/12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />
          )}

          {/* Previous Entries */}
          {entries.length > 0 && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease }}
            >
              <h2
                className="font-mono tracking-[0.12em] uppercase text-parchment-dim mb-4"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Previous Entries
              </h2>

              {entries.map((entry) => {
                const isExpanded = expandedId === entry.id;
                return (
                  <motion.div
                    key={entry.id || entry.date}
                    layout
                    className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : (entry.id ?? null))
                      }
                      className="w-full text-left p-4 flex items-start gap-4 hover:bg-ink-dark/60 transition-colors duration-200"
                    >
                      <span
                        className="font-mono text-parchment-muted shrink-0 mt-0.5"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {formatDate(entry.date)}
                      </span>
                      <span
                        className="text-parchment-dim text-sm leading-relaxed"
                        style={{ fontSize: "var(--text-small)" }}
                      >
                        {isExpanded ? "" : preview(entry.content)}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div
                              className="text-parchment font-serif whitespace-pre-wrap leading-relaxed"
                              style={{ fontSize: "var(--text-body)" }}
                            >
                              {entry.content}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
