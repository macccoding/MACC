import { prisma } from "@/lib/prisma";
import type { MemoryResult } from "./types";

/**
 * Text-based recall: search nodes by name/notes matching query words.
 * Vector search will be added once embeddings are configured.
 *
 * Splits the query into words >2 chars, searches nodes whose name or notes
 * contain any of those words (case-insensitive). Records surfacing via
 * NodeRecall upsert (increment surfaceCount). Returns MemoryResult[] sorted
 * by relevance (number of matching words).
 */
export async function recall(
  query: string,
  limit: number = 2
): Promise<MemoryResult[]> {
  // Split query into meaningful words
  const words = query
    .split(/\s+/)
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 2);

  if (words.length === 0) return [];

  // Build OR conditions for each word against name and notes
  const orConditions = words.flatMap((word) => [
    { name: { contains: word, mode: "insensitive" as const } },
    { notes: { contains: word, mode: "insensitive" as const } },
  ]);

  const nodes = await prisma.node.findMany({
    where: { OR: orConditions, status: "active" },
    take: limit * 3, // fetch extra to allow scoring and re-ranking
  });

  if (nodes.length === 0) return [];

  // Score by number of matching words (simple text relevance)
  const scored = nodes.map((node) => {
    const text = `${node.name} ${node.notes}`.toLowerCase();
    const matchCount = words.filter((w) => text.includes(w)).length;
    const similarity = matchCount / words.length;

    const content = node.notes
      ? `${node.name}: ${node.notes.slice(0, 200)}`
      : node.name;

    return { nodeId: node.id, content, similarity };
  });

  // Sort by similarity descending, take limit
  scored.sort((a, b) => b.similarity - a.similarity);
  const top = scored.slice(0, limit);

  // Record surfacing via NodeRecall upsert
  await Promise.all(
    top.map((item) =>
      prisma.nodeRecall.upsert({
        where: { nodeId: item.nodeId },
        update: {
          lastSurfaced: new Date(),
          surfaceCount: { increment: 1 },
        },
        create: {
          nodeId: item.nodeId,
          lastSurfaced: new Date(),
          surfaceCount: 1,
        },
      })
    )
  );

  return top.map(({ content, similarity }) => ({ content, similarity }));
}
