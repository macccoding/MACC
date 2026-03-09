"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useGarden, type GardenNode } from "@/hooks/useGarden";
import {
  drawSumiNode,
  drawSumiEdge,
  drawInkWashBackground,
  drawNodeLabel,
  positionSeed,
  invalidateBgCache,
} from "@/lib/kioku/sumi";
import { THEMES } from "@/lib/kioku/theme";

// ── Props ─────────────────────────────────────────────────────────────

interface GardenProps {
  onSelectNode?: (slug: string) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────

export default function Garden({ onSelectNode, className }: GardenProps) {
  const {
    nodes,
    edges,
    width,
    height,
    canvasRef,
    containerRef,
    selectedNode,
    setSelectedNode,
    searchQuery,
    setSearchQuery,
    loading,
    tick,
  } = useGarden();

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Kioku is always dark-themed
  const isDark = true;

  // Invalidate background cache when dimensions change
  useEffect(() => {
    invalidateBgCache();
  }, [width, height]);

  // ── Main draw loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background: ink-wash atmosphere
    drawInkWashBackground(ctx, width, height, isDark);

    // Edges: sumi-e brush strokes
    for (const edge of edges) {
      const source = edge.source as GardenNode;
      const target = edge.target as GardenNode;
      if (source.x == null || target.x == null) continue;
      drawSumiEdge(ctx, source.x, source.y!, target.x!, target.y!, 0.5);
    }

    // Nodes: sumi-e brush circles + labels
    for (const node of nodes) {
      if (node.x == null || node.y == null) continue;

      const isHighlighted =
        searchQuery &&
        node.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;
      const isDimmed = searchQuery && !isHighlighted;

      if (isDimmed) ctx.globalAlpha = 0.3;

      drawSumiNode(
        ctx,
        node.x,
        node.y,
        node.radius,
        node.tags[0] || "memory",
        node.glow,
        isHovered || isSelected || !!isHighlighted,
        positionSeed(node.x, node.y),
      );

      // Show label for hovered, selected, large nodes, or highlighted
      if (
        isHovered ||
        isSelected ||
        !!isHighlighted ||
        node.radius > 16
      ) {
        drawNodeLabel(ctx, node.x, node.y, node.name, node.radius, undefined, isDark);
      }

      if (isDimmed) ctx.globalAlpha = 1;
    }
  }, [nodes, edges, tick, width, height, hoveredNode, searchQuery, selectedNode, canvasRef, isDark]);

  // ── Hit detection ───────────────────────────────────────────────────
  const findNodeAt = useCallback(
    (x: number, y: number, radiusMultiplier = 1): GardenNode | null => {
      for (const node of nodes) {
        if (node.x == null || node.y == null) continue;
        const dx = x - node.x;
        const dy = y - node.y;
        const hitRadius = Math.max(node.radius, 22) * radiusMultiplier;
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          return node;
        }
      }
      return null;
    },
    [nodes],
  );

  // ── Mouse events ────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const found = findNodeAt(x, y);
      setHoveredNode(found?.id ?? null);
      canvas.style.cursor = found ? "pointer" : "default";
    },
    [findNodeAt, canvasRef],
  );

  const handleClick = useCallback(() => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      // Find the node to get its slug
      const node = nodes.find((n) => n.id === hoveredNode);
      if (node && onSelectNode) {
        onSelectNode(node.slug);
      }
    }
  }, [hoveredNode, nodes, onSelectNode, setSelectedNode]);

  // ── Touch handling (mobile) ─────────────────────────────────────────
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      touchStartRef.current = { x, y, time: Date.now() };
      const found = findNodeAt(x, y, 1.8);
      setHoveredNode(found?.id ?? null);
    },
    [findNodeAt, canvasRef],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const found = findNodeAt(x, y, 1.8);
      setHoveredNode(found?.id ?? null);
    },
    [findNodeAt, canvasRef],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      if (!start) {
        setHoveredNode(null);
        return;
      }
      const touch = e.changedTouches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const duration = Date.now() - start.time;
      const dx = x - start.x;
      const dy = y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (duration < 300 && distance < 15) {
        const found = findNodeAt(x, y, 1.8);
        if (found) {
          setSelectedNode(found.id);
          if (onSelectNode) {
            onSelectNode(found.slug);
          }
        }
      }
      touchStartRef.current = null;
      setTimeout(() => setHoveredNode(null), 200);
    },
    [findNodeAt, onSelectNode, setSelectedNode, canvasRef],
  );

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${className ?? ""}`}
    >
      {/* Search overlay */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search nodes..."
          aria-label="Search memory nodes"
          className="px-3 py-1.5 text-sm rounded-md border bg-[var(--kioku-bg-raised,#222226)] text-[var(--kioku-text,#E8E0D4)] border-[var(--kioku-border,rgba(232,224,212,0.10))] placeholder:text-[var(--kioku-muted,#6B6B73)] focus:outline-none focus:ring-1 focus:ring-[var(--kioku-accent,#E04D2E)] w-48"
        />
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span
            className="text-sm"
            style={{ color: THEMES.dark.muted }}
          >
            Loading garden...
          </span>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Memory garden visualization"
        style={{
          width,
          height,
          touchAction: "manipulation",
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
