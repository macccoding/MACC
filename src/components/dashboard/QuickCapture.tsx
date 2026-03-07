"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!value.trim()) return;
      try {
        await fetch("/api/captures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value.trim() }),
        });
      } catch (err) {
        console.error("Capture failed:", err);
      }
      setValue("");
      setOpen(false);
    },
    [value]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-ink-dark/40 border border-sumi-gray-dark/20 text-sumi-gray text-xs hover:border-sumi-gray-dark/40 transition-colors"
      >
        <span className="font-mono tracking-wider">Capture</span>
        <kbd className="text-[9px] font-mono bg-ink-mid/30 px-1.5 py-0.5 rounded text-sumi-gray-light">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-start justify-center pt-[18vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-ink-black/50 backdrop-blur-sm" />

            <motion.form
              onSubmit={handleSubmit}
              className="relative z-10 w-full max-w-lg mx-4"
              initial={{ y: -8, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -8, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Capture a thought, link, idea..."
                className="w-full px-5 py-4 bg-ink-dark border border-sumi-gray-dark/30 rounded-xl text-parchment placeholder:text-sumi-gray font-serif outline-none focus:border-vermillion/30 transition-colors"
                style={{ fontSize: "var(--text-body)" }}
              />
              <p className="text-center mt-3 text-sumi-gray-dark font-mono" style={{ fontSize: "var(--text-micro)" }}>
                Enter to capture &middot; Esc to close
              </p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
