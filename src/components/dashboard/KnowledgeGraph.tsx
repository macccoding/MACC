"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface GraphNode {
  id: string;
  name: string;
  tags: string[];
  recalls: { surfaceCount: number }[];
  // simulation positions
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: string;
}

interface KnowledgeGraphProps {
  onSelectNode?: (nodeId: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  person: "#60a5fa",
  topic: "#4ade80",
  concept: "#c084fc",
  place: "#fbbf24",
  project: "#e24b3f",
};

function getNodeColor(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  }
  return "#8b8b8b";
}

function getNodeRadius(recalls: { surfaceCount: number }[]): number {
  const count = recalls[0]?.surfaceCount ?? 0;
  return Math.min(6 + count * 1.5, 18);
}

// Simple force simulation (no D3 dependency)
function simulate(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  iterations: number = 120,
) {
  // Initialize positions randomly
  for (const node of nodes) {
    if (node.x === undefined) node.x = width / 2 + (Math.random() - 0.5) * width * 0.6;
    if (node.y === undefined) node.y = height / 2 + (Math.random() - 0.5) * height * 0.6;
    node.vx = 0;
    node.vy = 0;
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const alpha = 0.3;

  for (let tick = 0; tick < iterations; tick++) {
    const decay = 1 - tick / iterations;

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = (b.x ?? 0) - (a.x ?? 0);
        let dy = (b.y ?? 0) - (a.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (300 * decay) / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        a.vx! -= dx;
        a.vy! -= dy;
        b.vx! += dx;
        b.vy! += dy;
      }
    }

    // Attraction along links
    for (const link of links) {
      const source = nodeMap.get(link.sourceNodeId);
      const target = nodeMap.get(link.targetNodeId);
      if (!source || !target) continue;
      let dx = (target.x ?? 0) - (source.x ?? 0);
      let dy = (target.y ?? 0) - (source.y ?? 0);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 80) * 0.05 * decay;
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      source.vx! += dx;
      source.vy! += dy;
      target.vx! -= dx;
      target.vy! -= dy;
    }

    // Center gravity
    for (const node of nodes) {
      node.vx! += (width / 2 - (node.x ?? 0)) * 0.01 * decay;
      node.vy! += (height / 2 - (node.y ?? 0)) * 0.01 * decay;
    }

    // Apply velocities
    for (const node of nodes) {
      node.vx! *= 0.6;
      node.vy! *= 0.6;
      node.x = (node.x ?? 0) + node.vx! * alpha;
      node.y = (node.y ?? 0) + node.vy! * alpha;
      // Bounds
      node.x = Math.max(20, Math.min(width - 20, node.x));
      node.y = Math.max(20, Math.min(height - 20, node.y));
    }
  }

  return nodes;
}

export function KnowledgeGraph({ onSelectNode }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 600, h: 400 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(height, 350) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/kioku/graph")
      .then((r) => r.json())
      .then((data) => {
        const simulated = simulate(
          data.nodes as GraphNode[],
          data.links as GraphLink[],
          dimensions.width,
          dimensions.height,
        );
        setNodes([...simulated]);
        setLinks(data.links);
        setViewBox({ x: 0, y: 0, w: dimensions.width, h: dimensions.height });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dimensions.width, dimensions.height]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const scale = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((v) => {
        const cx = v.x + v.w / 2;
        const cy = v.y + v.h / 2;
        const nw = v.w * scale;
        const nh = v.h * scale;
        return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
      });
    },
    [],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      vx: 0,
      vy: 0,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragStart.current.x = e.clientX;
      dragStart.current.y = e.clientY;
      setViewBox((v) => ({
        ...v,
        x: v.x - dx * (v.w / dimensions.width),
        y: v.y - dy * (v.h / dimensions.height),
      }));
    },
    [dragging, dimensions],
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="animate-spin h-8 w-8 border-2 border-vermillion border-t-transparent rounded-full" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-sumi-gray-light text-sm">
        No knowledge nodes to visualize.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-[400px] bg-parchment-warm/20 border border-sumi-gray/20 rounded-xl overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Links */}
        {links.map((link) => {
          const source = nodeMap.get(link.sourceNodeId);
          const target = nodeMap.get(link.targetNodeId);
          if (!source || !target) return null;
          const isHovered =
            hoveredNode === link.sourceNodeId || hoveredNode === link.targetNodeId;
          return (
            <line
              key={link.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={isHovered ? "#e24b3f" : "#d4d0c8"}
              strokeWidth={isHovered ? 1.5 : 0.8}
              strokeOpacity={isHovered ? 0.8 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const r = getNodeRadius(node.recalls);
          const color = getNodeColor(node.tags);
          const isHovered = hoveredNode === node.id;
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectNode?.(node.id)}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? r + 3 : r}
                fill={color}
                fillOpacity={isHovered ? 0.9 : 0.7}
                stroke={isHovered ? "#e24b3f" : "none"}
                strokeWidth={isHovered ? 2 : 0}
              />
              <text
                x={node.x}
                y={(node.y ?? 0) + r + 12}
                textAnchor="middle"
                fill={isHovered ? "#1a1a1a" : "#8b8b8b"}
                fontSize={isHovered ? 11 : 9}
                fontFamily="var(--font-serif)"
              >
                {node.name.length > 16 ? node.name.slice(0, 14) + "…" : node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (() => {
          const node = nodeMap.get(hoveredNode);
          if (!node) return null;
          const connCount = links.filter(
            (l) => l.sourceNodeId === node.id || l.targetNodeId === node.id,
          ).length;
          return (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-3 bg-parchment border border-sumi-gray/20 rounded-lg p-3 shadow-sm max-w-[200px]"
            >
              <p className="text-sm font-medium text-ink-black">{node.name}</p>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {node.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full"
                    style={{ color: TAG_COLORS[t] || "#8b8b8b", backgroundColor: (TAG_COLORS[t] || "#8b8b8b") + "20" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-sumi-gray-light mt-1.5">
                {connCount} connection{connCount !== 1 ? "s" : ""} · surfaced{" "}
                {node.recalls[0]?.surfaceCount ?? 0}×
              </p>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-3 text-[9px] font-mono text-sumi-gray-light">
        {Object.entries(TAG_COLORS).map(([tag, color]) => (
          <div key={tag} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}
