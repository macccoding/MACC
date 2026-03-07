"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Blueprint = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: string;
  createdAt: string;
};

const STATUS_CYCLE: Record<string, string> = {
  active: "completed",
  completed: "paused",
  paused: "active",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-vermillion/15 border-vermillion/30 text-vermillion",
  completed: "bg-gold-seal/15 border-gold-seal/30 text-gold-seal",
  paused: "bg-sumi-gray/15 border-sumi-gray/30 text-sumi-gray",
};

function stripPrefix(desc: string | null): string {
  if (!desc) return "";
  return desc.replace(/^\[blueprint\]\s*/, "");
}

function formatDeadline(deadline: string | null): string | null {
  if (!deadline) return null;
  return new Date(deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function categorize(blueprints: Blueprint[]) {
  const now = Date.now();
  const day = 86_400_000;

  const quarter: Blueprint[] = [];
  const year: Blueprint[] = [];
  const someday: Blueprint[] = [];

  for (const b of blueprints) {
    if (!b.deadline) {
      someday.push(b);
      continue;
    }
    const diff = new Date(b.deadline).getTime() - now;
    if (diff <= 90 * day) {
      quarter.push(b);
    } else if (diff <= 365 * day) {
      year.push(b);
    } else {
      someday.push(b);
    }
  }

  return { quarter, year, someday };
}

export default function BlueprintPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBlueprints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blueprint");
      if (res.ok) {
        const data = await res.json();
        setBlueprints(data);
      }
    } catch (err) {
      console.error("Failed to fetch blueprints:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlueprints();
  }, [fetchBlueprints]);

  async function addBlueprint(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          ...(newDeadline ? { deadline: newDeadline } : {}),
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDeadline("");
        fetchBlueprints();
      }
    } catch (err) {
      console.error("Failed to add blueprint:", err);
    }
  }

  async function cycleStatus(id: string, currentStatus: string) {
    const next = STATUS_CYCLE[currentStatus] || "active";
    try {
      const res = await fetch(`/api/blueprint/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) fetchBlueprints();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function deleteBlueprint(id: string) {
    try {
      const res = await fetch(`/api/blueprint/${id}`, { method: "DELETE" });
      if (res.ok) fetchBlueprints();
    } catch (err) {
      console.error("Failed to delete blueprint:", err);
    }
  }

  const { quarter, year, someday } = categorize(blueprints);

  const columns = [
    { key: "quarter", label: "This Quarter", items: quarter },
    { key: "year", label: "This Year", items: year },
    { key: "someday", label: "Someday", items: someday },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Blueprint
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          The architecture of your life.
        </p>
      </motion.div>

      {/* Add Form */}
      <motion.form
        onSubmit={addBlueprint}
        className="flex gap-3 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New milestone..."
          className="flex-1 min-w-[200px] bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <input
          type="date"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
          className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black focus:outline-none focus:border-vermillion/30 transition-colors duration-300 "
          style={{ fontSize: "var(--text-body)" }}
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Add
        </button>
      </motion.form>

      {/* Kanban Columns */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sumi-gray-light text-sm py-8 text-center"
        >
          Loading...
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {columns.map((col) => (
            <div key={col.key} className="space-y-3">
              {/* Column Header */}
              <h2
                className="font-mono tracking-[0.12em] uppercase text-sumi-gray border-b border-sumi-gray/20 pb-2"
                style={{ fontSize: "var(--text-micro)" }}
              >
                {col.label}
                <span className="ml-2 text-sumi-gray-light">
                  {col.items.length}
                </span>
              </h2>

              {/* Cards */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {col.items.length === 0 ? (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sumi-gray-light text-sm py-6 text-center"
                    >
                      Nothing here yet.
                    </motion.p>
                  ) : (
                    col.items.map((bp, i) => (
                      <motion.div
                        key={bp.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          y: -8,
                          transition: { duration: 0.2 },
                        }}
                        transition={{
                          delay: i * 0.04,
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="group bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/20 transition-colors duration-300"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`text-ink-black font-light leading-snug ${
                                bp.status === "completed"
                                  ? "line-through opacity-50"
                                  : ""
                              }`}
                              style={{ fontSize: "var(--text-body)" }}
                            >
                              {bp.title}
                            </h3>
                            {stripPrefix(bp.description) && (
                              <p className="text-sumi-gray-light text-sm mt-1 leading-relaxed">
                                {stripPrefix(bp.description)}
                              </p>
                            )}
                            {bp.deadline && (
                              <p
                                className="font-mono tracking-[0.08em] text-sumi-gray mt-2"
                                style={{ fontSize: "var(--text-micro)" }}
                              >
                                {formatDeadline(bp.deadline)}
                              </p>
                            )}
                          </div>

                          {/* Delete (hover) */}
                          <button
                            onClick={() => deleteBlueprint(bp.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 shrink-0"
                            title="Delete"
                          >
                            &times;
                          </button>
                        </div>

                        {/* Status Badge */}
                        <button
                          onClick={() => cycleStatus(bp.id, bp.status)}
                          className={`mt-3 inline-block font-mono tracking-[0.12em] uppercase px-3 py-1 rounded-full border transition-all duration-300 hover:opacity-80 ${
                            STATUS_COLORS[bp.status] || STATUS_COLORS.active
                          }`}
                          style={{ fontSize: "var(--text-micro)" }}
                          title="Click to cycle status"
                        >
                          {bp.status}
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
