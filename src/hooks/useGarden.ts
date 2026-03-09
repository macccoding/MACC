"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { getAccentForTags } from "@/lib/kioku/sumi";

// ── Types ─────────────────────────────────────────────────────────────

/** API response shape from /api/kioku/graph */
interface GraphApiNode {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  updatedAt: string;
  sourceLinks?: unknown[];
  targetLinks?: unknown[];
  recalls?: unknown[];
}

interface GraphApiLink {
  sourceNodeId: string;
  targetNodeId: string;
  relation: string;
}

interface GraphApiResponse {
  nodes: GraphApiNode[];
  links: GraphApiLink[];
}

export interface GardenNode extends SimulationNodeDatum {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  linkCount: number;
  updatedAt: string;
  radius: number;
  color: string;
  glow: number;
}

export interface GardenEdge extends SimulationLinkDatum<GardenNode> {
  rel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Recency glow: recently updated nodes glow brighter, fading over 7 days. */
function getNodeGlow(updatedAt: string): number {
  const now = Date.now();
  const then = new Date(updatedAt).getTime();
  const daysSince = (now - then) / (1000 * 60 * 60 * 24);
  if (daysSince < 1) return 1.0;
  if (daysSince < 7) return 0.7;
  if (daysSince < 30) return 0.4;
  return 0.15;
}

/** Radius scales with link count. */
function getNodeRadius(linkCount: number): number {
  return Math.max(12, Math.min(30, 12 + linkCount * 3));
}

/** Count links for each node from the links array. */
function buildLinkCounts(
  nodes: GraphApiNode[],
  links: GraphApiLink[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const n of nodes) counts.set(n.id, 0);
  for (const l of links) {
    counts.set(l.sourceNodeId, (counts.get(l.sourceNodeId) ?? 0) + 1);
    counts.set(l.targetNodeId, (counts.get(l.targetNodeId) ?? 0) + 1);
  }
  return counts;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useGarden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<GardenNode, GardenEdge> | null>(null);
  const nodesRef = useRef<GardenNode[]>([]);
  const edgesRef = useRef<GardenEdge[]>([]);

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Window / container resize ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) {
        setWidth(w);
        setHeight(h);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ── Idle animation tick (~2fps for brush-stroke jitter) ──
  const frameRef = useRef(0);
  const animateFrame = useCallback(() => {
    frameRef.current += 1;
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(animateFrame, 500);
    return () => clearInterval(interval);
  }, [animateFrame]);

  // ── Fetch graph data and initialize simulation ──
  useEffect(() => {
    let cancelled = false;

    async function fetchAndSimulate() {
      setLoading(true);
      try {
        const res = await fetch("/api/kioku/graph");
        if (!res.ok) throw new Error(`Graph API ${res.status}`);
        const data: GraphApiResponse = await res.json();

        if (cancelled) return;

        const linkCounts = buildLinkCounts(data.nodes, data.links);

        const nodes: GardenNode[] = data.nodes.map((n) => {
          const lc = linkCounts.get(n.id) ?? 0;
          return {
            id: n.id,
            name: n.name,
            slug: n.slug,
            tags: n.tags,
            linkCount: lc,
            updatedAt: n.updatedAt,
            radius: getNodeRadius(lc),
            color: getAccentForTags(n.tags),
            glow: getNodeGlow(n.updatedAt),
          };
        });

        const nodeMap = new Map(nodes.map((n) => [n.id, n]));

        const edges: GardenEdge[] = data.links
          .filter(
            (l) => nodeMap.has(l.sourceNodeId) && nodeMap.has(l.targetNodeId),
          )
          .map((l) => ({
            source: nodeMap.get(l.sourceNodeId)!,
            target: nodeMap.get(l.targetNodeId)!,
            rel: l.relation,
          }));

        // Stop any existing simulation
        if (simRef.current) simRef.current.stop();

        nodesRef.current = nodes;
        edgesRef.current = edges;

        const sim = forceSimulation(nodes)
          .force(
            "link",
            forceLink<GardenNode, GardenEdge>(edges)
              .id((d) => d.id)
              .distance(100),
          )
          .force("charge", forceManyBody().strength(-150))
          .force("center", forceCenter(width / 2, height / 2))
          .force(
            "collide",
            forceCollide<GardenNode>().radius((d) => d.radius + 8),
          )
          .on("tick", () => setTick((t) => t + 1));

        simRef.current = sim;
      } catch (err) {
        console.error("[useGarden] Failed to fetch graph:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAndSimulate();

    return () => {
      cancelled = true;
      if (simRef.current) simRef.current.stop();
    };
    // Re-fetch when dimensions change significantly (simulation needs re-centering)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  return {
    nodes: nodesRef.current,
    edges: edgesRef.current,
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
  };
}
