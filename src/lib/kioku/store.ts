import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "./slugify";
import { todayJamaica } from "@/lib/kemi/utils";
import type { ExtractionResult } from "./types";

// ---------------------------------------------------------------------------
// Node operations
// ---------------------------------------------------------------------------

/**
 * Upsert a node by slug. Creates with the given tags and fields,
 * or merges tags and fields into the existing node.
 */
export async function upsertNode(
  name: string,
  tags: string[] = [],
  fields: Record<string, unknown> = {},
): Promise<{ id: string; name: string; slug: string; tags: string[]; notes: string }> {
  const slug = slugify(name);

  const existing = await prisma.node.findUnique({ where: { slug } });

  if (existing) {
    const mergedTags = [...new Set([...existing.tags, ...tags])];
    const existingFields = (existing.fields as Record<string, unknown>) ?? {};
    const mergedFields = { ...existingFields, ...fields };

    const updated = await prisma.node.update({
      where: { slug },
      data: {
        tags: mergedTags,
        fields: mergedFields as Prisma.InputJsonValue,
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      tags: updated.tags,
      notes: updated.notes,
    };
  }

  const created = await prisma.node.create({
    data: {
      name,
      slug,
      tags,
      fields: fields as Prisma.InputJsonValue,
    },
  });
  return {
    id: created.id,
    name: created.name,
    slug: created.slug,
    tags: created.tags,
    notes: created.notes,
  };
}

// ---------------------------------------------------------------------------
// Note operations
// ---------------------------------------------------------------------------

/**
 * Append text to an existing node's notes.
 * Looks up the node by name, appends with newline separator.
 */
export async function appendNote(name: string, text: string): Promise<void> {
  const node = await prisma.node.findFirst({ where: { name } });
  if (!node) return;

  const newNotes = node.notes ? `${node.notes}\n${text}` : text;

  await prisma.node.update({
    where: { id: node.id },
    data: { notes: newNotes },
  });
}

// ---------------------------------------------------------------------------
// Link operations
// ---------------------------------------------------------------------------

/**
 * Create BOTH forward AND reverse links between two nodes.
 * Uses upsert on the compound unique (sourceNodeId, targetNodeId, relation).
 */
export async function createBidirectionalLink(
  source: string,
  target: string,
  relation: string,
): Promise<void> {
  const [sourceNode, targetNode] = await Promise.all([
    prisma.node.findFirst({ where: { name: source } }),
    prisma.node.findFirst({ where: { name: target } }),
  ]);

  if (!sourceNode || !targetNode) return;

  // Forward link: source -> target
  await prisma.link.upsert({
    where: {
      sourceNodeId_targetNodeId_relation: {
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        relation,
      },
    },
    create: {
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
      relation,
    },
    update: {},
  });

  // Reverse link: target -> source
  await prisma.link.upsert({
    where: {
      sourceNodeId_targetNodeId_relation: {
        sourceNodeId: targetNode.id,
        targetNodeId: sourceNode.id,
        relation,
      },
    },
    create: {
      sourceNodeId: targetNode.id,
      targetNodeId: sourceNode.id,
      relation,
    },
    update: {},
  });
}

// ---------------------------------------------------------------------------
// Recall tracking
// ---------------------------------------------------------------------------

/**
 * Update node_recall for all nodes mentioned in an extraction.
 * Uses upsert to handle first-time vs. subsequent surfacing.
 */
export async function recordSurfacedNodes(
  extraction: ExtractionResult,
): Promise<void> {
  const now = new Date();

  // Collect all node names that were "surfaced" in this interaction
  const surfaced = new Set<string>();
  for (const n of extraction.nodes) surfaced.add(n.name);
  for (const u of extraction.updates) surfaced.add(u.node);
  for (const lnk of extraction.links) {
    surfaced.add(lnk.source);
    surfaced.add(lnk.target);
  }

  for (const name of Array.from(surfaced)) {
    const node = await prisma.node.findFirst({ where: { name } });
    if (!node) continue;

    await prisma.nodeRecall.upsert({
      where: { nodeId: node.id },
      create: {
        nodeId: node.id,
        lastSurfaced: now,
        surfaceCount: 1,
      },
      update: {
        lastSurfaced: now,
        surfaceCount: { increment: 1 },
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Journal helper
// ---------------------------------------------------------------------------

/**
 * Append a log line to today's journal entry.
 * Uses Jamaica timezone for the date, upserts so there's one entry per day.
 */
export async function journalLog(line: string): Promise<void> {
  const today = todayJamaica();

  const existing = await prisma.journal.findUnique({
    where: { date: today },
  });

  if (existing) {
    const newContent = existing.content
      ? `${existing.content}\n${line}`
      : line;
    await prisma.journal.update({
      where: { id: existing.id },
      data: { content: newContent },
    });
  } else {
    await prisma.journal.create({
      data: { date: today, content: line },
    });
  }
}
