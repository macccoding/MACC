"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_COMMANDS, type Command } from "@/lib/command-palette/registry";
import { fuzzyScore } from "@/lib/command-palette/fuzzy-search";
import { recordUsage, getFrecencyScore } from "@/lib/command-palette/frecency";
import { VoiceButton } from "@/components/dashboard/VoiceButton";

const ease = [0.22, 1, 0.36, 1] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Open/close handlers
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const customHandler = () => setOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener("open-quickcapture", customHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-quickcapture", customHandler);
    };
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter and rank commands
  const results = useMemo(() => {
    if (!query.trim()) {
      // No query: show all sorted by frecency
      return [...ALL_COMMANDS].sort(
        (a, b) => getFrecencyScore(b.id) - getFrecencyScore(a.id)
      );
    }

    const scored = ALL_COMMANDS.map((cmd) => {
      const labelScore = fuzzyScore(query, cmd.label);
      const keywordScore = (cmd.keywords || []).reduce(
        (max, kw) => Math.max(max, fuzzyScore(query, kw)),
        0
      );
      const best = Math.max(labelScore, keywordScore * 0.85);
      const frecency = getFrecencyScore(cmd.id);
      return { cmd, score: best + frecency * 0.1 };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map((s) => s.cmd);
  }, [query]);

  // Determine if this is a natural language query (no command match or long text)
  const isNaturalLanguage =
    query.trim().length > 0 &&
    (results.length === 0 || query.trim().length > 40);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, isNaturalLanguage]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const executeCommand = useCallback(
    async (cmd: Command) => {
      recordUsage(cmd.id);

      if (cmd.type === "navigation" && cmd.href) {
        setOpen(false);
        router.push(cmd.href);
        return;
      }

      if (cmd.type === "action" && cmd.id === "act-capture") {
        // Submit as capture
        if (query.trim()) {
          await fetch("/api/captures", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: query.trim() }),
          });
        }
        setOpen(false);
        return;
      }

      if (cmd.type === "action" && cmd.kemiAction) {
        // Open Kemi chat with prefilled action
        setOpen(false);
        window.dispatchEvent(
          new CustomEvent("open-kemi", { detail: { prefill: cmd.label } })
        );
        return;
      }
    },
    [query, router]
  );

  const sendToKemi = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      setOpen(false);
      window.dispatchEvent(
        new CustomEvent("open-kemi", { detail: { prefill: query.trim() } })
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems = results.length + (isNaturalLanguage ? 1 : 0);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % Math.max(totalItems, 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) =>
            i <= 0 ? Math.max(totalItems - 1, 0) : i - 1
          );
          break;
        case "Tab":
          e.preventDefault();
          setActiveIndex((i) =>
            e.shiftKey
              ? i <= 0
                ? Math.max(totalItems - 1, 0)
                : i - 1
              : (i + 1) % Math.max(totalItems, 1)
          );
          break;
        case "Enter":
          e.preventDefault();
          // If NL fallthrough is active and selected
          if (isNaturalLanguage && activeIndex === results.length) {
            sendToKemi();
            return;
          }
          if (results[activeIndex]) {
            executeCommand(results[activeIndex]);
          } else if (isNaturalLanguage) {
            sendToKemi();
          }
          break;
      }
    },
    [results, activeIndex, isNaturalLanguage, executeCommand, sendToKemi]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Command palette"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-parchment-warm/40 border border-sumi-gray/20 text-sumi-gray text-xs hover:border-sumi-gray/40 transition-colors"
      >
        <span className="font-mono tracking-wider">Command</span>
        <kbd className="text-[9px] font-mono bg-parchment-warm/30 px-1.5 py-0.5 rounded text-sumi-gray-light">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] sm:pt-[16vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              className="absolute inset-0 bg-parchment/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="relative z-10 w-full max-w-lg mx-4 bg-parchment-warm border border-sumi-gray/20 rounded-xl shadow-lg overflow-hidden"
              initial={{ y: -12, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -12, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease }}
            >
              {/* Search input */}
              <div className="flex items-center border-b border-sumi-gray/10 px-4">
                <span className="text-sumi-gray-light text-sm mr-2">⌘</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command, page, or ask Kemi..."
                  className="flex-1 py-3.5 bg-transparent text-ink-black placeholder:text-sumi-gray/60 font-serif outline-none"
                  style={{ fontSize: "var(--text-body)" }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <VoiceButton
                  onTranscript={(text) => setQuery(text)}
                  className="mr-1"
                />
                {loading && (
                  <span className="text-sumi-gray text-xs animate-pulse">
                    ...
                  </span>
                )}
              </div>

              {/* Results list */}
              <div
                ref={listRef}
                className="max-h-[320px] overflow-y-auto overscroll-contain py-1.5"
                role="listbox"
              >
                {results.length === 0 && !isNaturalLanguage && (
                  <div className="px-4 py-6 text-center text-sumi-gray text-sm font-serif">
                    No results
                  </div>
                )}

                {results.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    data-active={i === activeIndex}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activeIndex
                        ? "bg-vermillion/8 text-ink-black"
                        : "text-ink-black/80 hover:bg-parchment/60"
                    }`}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-serif ${
                        cmd.type === "navigation"
                          ? "bg-sumi-gray/8 text-sumi-gray"
                          : "bg-vermillion/10 text-vermillion"
                      }`}
                    >
                      {cmd.icon || "·"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{cmd.label}</span>
                      {cmd.description && (
                        <span className="ml-2 text-xs text-sumi-gray">
                          {cmd.description}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-sumi-gray/50 font-mono">
                      {cmd.type === "navigation" ? "Go" : "Action"}
                    </span>
                  </button>
                ))}

                {/* Natural language fallthrough — ask Kemi */}
                {isNaturalLanguage && (
                  <button
                    role="option"
                    aria-selected={activeIndex === results.length}
                    data-active={activeIndex === results.length}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-sumi-gray/10 transition-colors ${
                      activeIndex === results.length
                        ? "bg-vermillion/8 text-ink-black"
                        : "text-ink-black/80 hover:bg-parchment/60"
                    }`}
                    onClick={sendToKemi}
                    onMouseEnter={() => setActiveIndex(results.length)}
                  >
                    <span className="w-7 h-7 flex items-center justify-center rounded-md bg-vermillion/10 text-vermillion text-xs font-serif">
                      K
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">Ask Kemi</span>
                      <span className="ml-2 text-xs text-sumi-gray truncate">
                        &ldquo;{query.trim().slice(0, 50)}
                        {query.trim().length > 50 ? "..." : ""}&rdquo;
                      </span>
                    </div>
                    <span className="text-[10px] text-sumi-gray/50 font-mono">
                      AI
                    </span>
                  </button>
                )}
              </div>

              {/* Footer hints */}
              <div className="hidden sm:flex items-center justify-center gap-4 px-4 py-2 border-t border-sumi-gray/10">
                <span className="text-[10px] text-sumi-gray/50 font-mono">
                  ↑↓ navigate
                </span>
                <span className="text-[10px] text-sumi-gray/50 font-mono">
                  ↵ select
                </span>
                <span className="text-[10px] text-sumi-gray/50 font-mono">
                  esc close
                </span>
              </div>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="sm:hidden w-full py-2.5 text-sumi-gray font-mono border-t border-sumi-gray/10 active:bg-parchment-warm transition-colors"
                style={{ fontSize: "var(--text-micro)" }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
