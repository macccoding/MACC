import { prisma } from "@/lib/prisma";
import type { Insight } from "./types";

/**
 * Find pairs of nodes that share a tag but have no link between them.
 * Suggests potential connections the user might want to make explicit.
 */
async function findUnconnectedClusters(): Promise<Insight[]> {
  const insights: Insight[] = [];

  // Get all nodes with their tags and links
  const nodes = await prisma.node.findMany({
    select: {
      name: true,
      tags: true,
      sourceLinks: { select: { targetNode: { select: { name: true } } } },
      targetLinks: { select: { sourceNode: { select: { name: true } } } },
    },
  });

  // Group by tag
  const tagGroups: Record<string, string[]> = {};
  for (const node of nodes) {
    for (const tag of node.tags) {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push(node.name);
    }
  }

  // Build link lookup
  const linkedTo: Record<string, Set<string>> = {};
  for (const node of nodes) {
    const connections = new Set<string>();
    for (const link of node.sourceLinks) connections.add(link.targetNode.name);
    for (const link of node.targetLinks) connections.add(link.sourceNode.name);
    linkedTo[node.name] = connections;
  }

  // Find unconnected pairs sharing tags
  for (const [tag, members] of Object.entries(tagGroups)) {
    if (members.length < 2) continue;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i],
          b = members[j];
        const aLinksB = linkedTo[a]?.has(b) ?? false;
        const bLinksA = linkedTo[b]?.has(a) ?? false;
        if (!aLinksB && !bLinksA) {
          insights.push({
            kind: "unconnected_cluster",
            description: `${a} and ${b} share the [${tag}] tag but aren't linked — is there a connection?`,
            relatedNodes: [a, b],
          });
        }
      }
    }
  }

  return insights;
}

/**
 * Find nodes that haven't been updated in N days.
 * Prompts the user to revisit or archive stale knowledge.
 */
async function findStaleThreads(
  staleDays: number = 30,
): Promise<Insight[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - staleDays);

  const staleNodes = await prisma.node.findMany({
    where: { updatedAt: { lt: cutoff } },
    select: { name: true, updatedAt: true },
  });

  return staleNodes.map((node) => ({
    kind: "stale_thread" as const,
    description: `${node.name} hasn't been touched since ${node.updatedAt.toISOString().split("T")[0]} — still relevant?`,
    relatedNodes: [node.name],
  }));
}

/**
 * Find tags that appear on N or more nodes — emerging themes
 * in the knowledge graph worth paying attention to.
 */
async function findEmergingThemes(
  threshold: number = 3,
): Promise<Insight[]> {
  const nodes = await prisma.node.findMany({
    select: { name: true, tags: true },
  });

  const tagCounts: Record<string, string[]> = {};
  for (const node of nodes) {
    for (const tag of node.tags) {
      if (!tagCounts[tag]) tagCounts[tag] = [];
      tagCounts[tag].push(node.name);
    }
  }

  const insights: Insight[] = [];
  const sorted = Object.entries(tagCounts).sort(
    (a, b) => b[1].length - a[1].length,
  );

  for (const [tag, members] of sorted) {
    if (members.length >= threshold) {
      insights.push({
        kind: "emerging_theme",
        description: `[${tag}] appears on ${members.length} nodes: ${members.slice(0, 5).join(", ")} — emerging theme?`,
        relatedNodes: members,
      });
    }
  }

  return insights;
}

/**
 * Run all three insight generators in parallel and return combined results.
 */
export async function generateInsights(): Promise<Insight[]> {
  const [clusters, stale, themes] = await Promise.all([
    findUnconnectedClusters(),
    findStaleThreads(),
    findEmergingThemes(),
  ]);
  return [...clusters, ...stale, ...themes];
}
