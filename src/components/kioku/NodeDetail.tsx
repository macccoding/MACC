"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { NODE_COLORS, NODE_COLOR_DEFAULT, getNodeColor } from "@/lib/kioku/theme";

// ── Types ────────────────────────────────────────────────────────────

interface Connection {
  relation: string;
  direction: "outgoing" | "incoming";
  node: { id: string; name: string; slug: string; tags?: string[] };
}

interface NodeData {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  fields: Record<string, unknown> | null;
  notes: string | null;
  connections: Connection[];
  recall: { surfaceCount: number; lastSurfaced: string } | null;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  notes: string | null;
}

interface NodeDetailProps {
  slug: string | null;
  onClose: () => void;
  onNodeClick?: (slug: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function InkDivider() {
  return (
    <div
      className="my-5 h-px"
      style={{
        background:
          "linear-gradient(to right, transparent, var(--kioku-border), transparent)",
      }}
    />
  );
}

function SectionHeader({
  japanese,
  english,
}: {
  japanese: string;
  english: string;
}) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <span
        className="text-sm tracking-wider"
        style={{
          color: "var(--kioku-text)",
          fontFamily: "'Noto Serif JP', serif",
        }}
      >
        {japanese}
      </span>
      <span
        className="text-xs tracking-widest uppercase"
        style={{ color: "var(--kioku-muted)" }}
      >
        {english}
      </span>
    </div>
  );
}

function getTagColor(tags: string[]): string {
  return getNodeColor(tags);
}

// ── Component ────────────────────────────────────────────────────────

export default function NodeDetail({ slug, onClose, onNodeClick }: NodeDetailProps) {
  const [node, setNode] = useState<NodeData | null>(null);
  const [related, setRelated] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Drag-to-close state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Fetch node data ─────────────────────────────────────────────

  useEffect(() => {
    if (!slug) {
      setNode(null);
      setRelated([]);
      return;
    }

    let cancelled = false;

    async function fetchNode() {
      setLoading(true);
      try {
        const res = await fetch(`/api/kioku/nodes/${encodeURIComponent(slug!)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setNode(data.node);

          // Fetch related nodes
          if (data.node?.name) {
            const searchRes = await fetch(
              `/api/kioku/search?q=${encodeURIComponent(data.node.name)}`
            );
            if (searchRes.ok && !cancelled) {
              const searchData = await searchRes.json();
              const filtered = (searchData.results || []).filter(
                (r: SearchResult) => r.slug !== data.node.slug
              );
              setRelated(filtered);
            }
          }
        }
      } catch (err) {
        console.error("[NodeDetail] Fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNode();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── Lock body scroll when open ──────────────────────────────────

  useEffect(() => {
    if (slug) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [slug]);

  // ── Drag handlers ───────────────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const delta = Math.max(0, currentY - dragStartY.current);
    setDragY(delta);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  // ── Mouse drag handlers (for desktop) ───────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
    setIsDragging(true);

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = Math.max(0, ev.clientY - dragStartY.current);
      setDragY(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragY((currentDragY) => {
        if (currentDragY > 100) {
          onClose();
        }
        return 0;
      });
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [onClose]);

  // ── Render ──────────────────────────────────────────────────────

  if (!slug) return null;

  const backdropOpacity = Math.max(0, 0.85 - dragY * 0.003);
  const fields =
    node?.fields && typeof node.fields === "object"
      ? Object.entries(node.fields as Record<string, unknown>)
      : [];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          backgroundColor: "var(--kioku-bg)",
          opacity: backdropOpacity,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl"
        style={{
          backgroundColor: "var(--kioku-bg)",
          border: "1px solid var(--kioku-border)",
          borderBottom: "none",
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease",
          animation: dragY === 0 && !isDragging ? "slideUp 0.3s ease forwards" : undefined,
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "var(--kioku-muted)", opacity: 0.4 }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ color: "var(--kioku-muted)" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-5 pb-8">
          {loading ? (
            <div
              className="text-center py-12 text-sm"
              style={{ color: "var(--kioku-muted)" }}
            >
              Loading...
            </div>
          ) : node ? (
            <>
              {/* Node name */}
              <h2
                className="text-xl font-light mt-2 mb-2"
                style={{
                  color: "var(--kioku-text)",
                  fontFamily: "'Noto Serif JP', serif",
                }}
              >
                {node.name}
              </h2>

              {/* Tag badges */}
              {node.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {node.tags.map((tag) => {
                    const color =
                      NODE_COLORS[tag.toLowerCase() as keyof typeof NODE_COLORS] ||
                      NODE_COLOR_DEFAULT;
                    return (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 rounded-full tracking-wide"
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Recall info */}
              {node.recall && (
                <div
                  className="text-xs mb-4"
                  style={{ color: "var(--kioku-muted)" }}
                >
                  Surfaced {node.recall.surfaceCount}{" "}
                  {node.recall.surfaceCount === 1 ? "time" : "times"}
                </div>
              )}

              {/* Connections */}
              {node.connections.length > 0 && (
                <>
                  <InkDivider />
                  <SectionHeader japanese={"\u7E4B\u304C\u308A"} english="Connections" />
                  <div className="space-y-2">
                    {node.connections.map((conn, i) => (
                      <button
                        key={`${conn.node.slug}-${i}`}
                        onClick={() => onNodeClick?.(conn.node.slug)}
                        className="flex items-center gap-2 w-full text-left group cursor-pointer"
                      >
                        <span
                          className="text-xs tracking-wide"
                          style={{ color: "var(--kioku-muted)" }}
                        >
                          {conn.direction === "outgoing" ? "\u2192" : "\u2190"}
                        </span>
                        <span
                          className="text-sm transition-colors group-hover:opacity-80"
                          style={{ color: "var(--kioku-accent)" }}
                        >
                          {conn.node.name}
                        </span>
                        {conn.relation && (
                          <span
                            className="text-xs italic"
                            style={{ color: "var(--kioku-muted)" }}
                          >
                            {conn.relation}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Attributes */}
              {fields.length > 0 && (
                <>
                  <InkDivider />
                  <SectionHeader japanese={"\u5C5E\u6027"} english="Attributes" />
                  <div className="space-y-1.5">
                    {fields.map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span
                          className="shrink-0"
                          style={{ color: "var(--kioku-muted)" }}
                        >
                          {key}:
                        </span>
                        <span style={{ color: "var(--kioku-text)" }}>
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Story / Notes */}
              {node.notes && (
                <>
                  <InkDivider />
                  <SectionHeader japanese={"\u7269\u8A9E"} english="Story" />
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      color: "var(--kioku-text)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {node.notes}
                  </div>
                </>
              )}

              {/* Related */}
              {related.length > 0 && (
                <>
                  <InkDivider />
                  <SectionHeader japanese={"\u7E01"} english="Related" />
                  <div className="space-y-2">
                    {related.map((r) => {
                      const color = getTagColor(r.tags);
                      return (
                        <button
                          key={r.slug}
                          onClick={() => onNodeClick?.(r.slug)}
                          className="flex items-center gap-2 w-full text-left cursor-pointer"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span
                            className="text-sm transition-opacity hover:opacity-80"
                            style={{ color: "var(--kioku-text)" }}
                          >
                            {r.name}
                          </span>
                          {r.tags.length > 0 && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--kioku-muted)" }}
                            >
                              {r.tags[0]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            <div
              className="text-center py-12 text-sm"
              style={{ color: "var(--kioku-muted)" }}
            >
              Node not found.
            </div>
          )}
        </div>
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
