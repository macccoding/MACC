"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KnowledgeGraph } from "@/components/dashboard/KnowledgeGraph";

type NodeRecall = {
  id: string;
  nodeId: string;
  lastSurfaced: string;
  surfaceCount: number;
};

type LinkedNode = {
  id: string;
  name: string;
  slug: string;
};

type SourceLink = {
  id: string;
  relation: string;
  targetNode: LinkedNode;
};

type KnowledgeNode = {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  recalls: NodeRecall[];
  sourceLinks: SourceLink[];
};

type TypeFilter = "all" | "person" | "topic" | "concept" | "place" | "project";

const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Person", value: "person" },
  { label: "Topic", value: "topic" },
  { label: "Concept", value: "concept" },
  { label: "Place", value: "place" },
  { label: "Project", value: "project" },
];

const TAG_COLORS: Record<string, string> = {
  person: "text-blue-400 bg-blue-400/10",
  topic: "text-green-400 bg-green-400/10",
  concept: "text-purple-400 bg-purple-400/10",
  place: "text-amber-400 bg-amber-400/10",
  project: "text-vermillion bg-vermillion/10",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

type ViewMode = "list" | "graph";

export default function KnowledgePage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [newName, setNewName] = useState("");
  const [newTags, setNewTags] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const qs = params.toString();
      const res = await fetch(`/api/kioku/nodes${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data);
      }
    } catch (err) {
      console.error("Failed to fetch nodes:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchNodes();
  }

  async function addNode(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const tags = newTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    try {
      const res = await fetch("/api/kioku/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), tags }),
      });
      if (res.ok) {
        setNewName("");
        setNewTags("");
        fetchNodes();
      }
    } catch (err) {
      console.error("Failed to add node:", err);
    }
  }

  function getTagColor(tag: string): string {
    return TAG_COLORS[tag] || "text-sumi-gray-light bg-sumi-gray/10";
  }

  function getSurfaceCount(node: KnowledgeNode): number {
    if (node.recalls.length === 0) return 0;
    return node.recalls[0].surfaceCount;
  }

  function getConnectedNodes(node: KnowledgeNode): string[] {
    return node.sourceLinks.map((link) => link.targetNode.name);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="flex items-center justify-between">
          <h1
            className="text-ink-black font-light"
            style={{ fontSize: "var(--text-heading)" }}
          >
            Knowledge
          </h1>
          <div className="flex gap-1 bg-parchment-warm/40 border border-sumi-gray/20 rounded-lg p-0.5">
            {(["list", "graph"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono tracking-wide uppercase transition-colors ${
                  viewMode === mode
                    ? "bg-vermillion/15 text-vermillion"
                    : "text-sumi-gray-light hover:text-ink-black"
                }`}
              >
                {mode === "list" ? "List" : "Graph"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sumi-gray-light text-sm mt-1">
          People, ideas, and connections.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.form
        onSubmit={handleSearch}
        className="flex gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search knowledge..."
          className="flex-1 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <button
          type="submit"
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Search
        </button>
      </motion.form>

      {/* Type Filter Pills */}
      <motion.div
        className="flex gap-2 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
      >
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`font-mono tracking-[0.12em] uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${
              typeFilter === f.value
                ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
                : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray-light hover:border-sumi-gray/20 hover:text-sumi-gray"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Add Node Form */}
      <motion.form
        onSubmit={addNode}
        className="flex gap-3 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Node name..."
          className="flex-1 min-w-[200px] bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <input
          type="text"
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          placeholder="Tags (comma-separated)..."
          className="w-full sm:w-56 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Add
        </button>
      </motion.form>

      {/* Graph View */}
      {viewMode === "graph" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
        >
          <KnowledgeGraph />
        </motion.div>
      )}

      {/* Node Cards */}
      {viewMode === "list" && <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              Loading...
            </motion.div>
          ) : nodes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              {search
                ? "No nodes match your search."
                : "No knowledge nodes yet."}
            </motion.div>
          ) : (
            nodes.map((node, i) => {
              const connected = getConnectedNodes(node);
              const surfaceCount = getSurfaceCount(node);

              return (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  transition={{
                    delay: i * 0.04,
                    duration: 0.4,
                    ease,
                  }}
                  className="group bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/20 transition-colors duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Name + Tag Badges */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3
                          className="text-ink-black font-medium leading-snug"
                          style={{ fontSize: "var(--text-body)" }}
                        >
                          {node.name}
                        </h3>
                        {node.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase shrink-0 ${getTagColor(tag)}`}
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Notes preview */}
                      {node.notes && (
                        <p
                          className="text-sumi-gray-light mt-2 leading-relaxed"
                          style={{ fontSize: "var(--text-body)" }}
                        >
                          {truncate(node.notes, 150)}
                        </p>
                      )}

                      {/* Connected nodes */}
                      {connected.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-sumi-gray font-mono tracking-[0.08em] uppercase"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Connected:
                          </span>
                          {connected.map((name) => (
                            <span
                              key={name}
                              className="text-sumi-gray-light bg-sumi-gray/5 px-2 py-0.5 rounded-full"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Surface count */}
                      {surfaceCount > 0 && (
                        <div className="mt-2">
                          <span
                            className="text-sumi-gray font-mono tracking-[0.08em]"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Surfaced {surfaceCount}{" "}
                            {surfaceCount === 1 ? "time" : "times"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>}
    </div>
  );
}
