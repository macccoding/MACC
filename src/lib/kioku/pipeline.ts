/**
 * Pipeline orchestrator — Extract -> Store.
 *
 * Central processing module that wires together entity extraction (via Claude),
 * node/link storage (via Prisma), and message history.
 * Ported from standalone Kioku app with adaptations for Me.io.
 */

import { prisma } from "@/lib/prisma";
import { extract } from "./extractor";
import {
  upsertNode,
  appendNote,
  createBidirectionalLink,
  recordSurfacedNodes,
  journalLog,
} from "./store";
import type {
  ExtractionResult,
  ProcessResult,
  CuriosityEntry,
} from "./types";

// ----------------------------------------------------------------
// Module-level curiosity queue (persists across calls within process)
// ----------------------------------------------------------------

export const curiosityQueue: CuriosityEntry[] = [];

// ----------------------------------------------------------------
// Public entry points
// ----------------------------------------------------------------

/**
 * Full pipeline for a text chat message.
 * Saves user message, extracts entities, stores nodes/links,
 * saves assistant reply, records surfaced nodes.
 */
export async function processText(message: string): Promise<ProcessResult> {
  // Save user message
  await prisma.message.create({
    data: { role: "user", content: message },
  });

  // Extract
  const extraction = await runExtraction(message);

  // Store nodes / links / updates
  const [created, updated] = await store(extraction);

  // Store curiosity entries
  curiosityQueue.push(...extraction.curiosity);

  // Save assistant reply
  await prisma.message.create({
    data: {
      role: "assistant",
      content: extraction.reply,
      followUp: extraction.follow_up,
      createdNodes: created,
      updatedNodes: updated,
    },
  });

  // Record surfaced nodes (nudge tracking)
  await recordSurfacedNodes(extraction);

  return {
    reply: extraction.reply,
    follow_up: extraction.follow_up,
    created,
    updated,
    source_type: "chat",
  };
}

/**
 * Extraction-only mode — no reply, no message saving.
 * Used by Kemi for background knowledge extraction from user input.
 */
export async function processExtractOnly(
  text: string,
): Promise<{ created: string[]; updated: string[] }> {
  const extraction = await runExtraction(text);
  const [created, updated] = await store(extraction);
  await recordSurfacedNodes(extraction);
  return { created, updated };
}

// ----------------------------------------------------------------
// Context builders
// ----------------------------------------------------------------

/**
 * Serialize all nodes into a context string for the extractor.
 * Format: [[NodeName]] tags=[...] | links=[rel->[[Target]], ...] | notes="preview"
 */
export async function buildVaultContext(): Promise<string> {
  const nodes = await prisma.node.findMany({
    include: {
      sourceLinks: { include: { targetNode: true } },
    },
    orderBy: { name: "asc" },
  });

  const lines = ["Existing nodes in the vault:\n"];

  for (const node of nodes) {
    const parts = [`[[${node.name}]] tags=${JSON.stringify(node.tags)}`];

    if (node.sourceLinks.length > 0) {
      const linkStrs = node.sourceLinks.map(
        (l) => `${l.relation}\u2192[[${l.targetNode.name}]]`,
      );
      parts.push(`links=[${linkStrs.join(", ")}]`);
    }

    if (node.notes) {
      const preview = node.notes.slice(0, 100).replace(/\n/g, " ");
      parts.push(`notes="${preview}"`);
    }

    lines.push(parts.join(" | "));
  }

  return lines.join("\n");
}

/**
 * Load recent messages and format as conversation turns for Claude.
 * User messages become { role: "user" }, assistant messages become
 * { role: "assistant" } with the extraction JSON format.
 */
export async function buildHistory(
  limit = 20,
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const total = await prisma.message.count();
  if (total === 0) return [];

  const skip = Math.max(0, total - limit);
  const recent = await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
    skip,
    take: limit,
  });

  const history: { role: "user" | "assistant"; content: string }[] = [];

  for (const msg of recent) {
    if (msg.role === "user") {
      history.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      const assistantJson = JSON.stringify({
        nodes: [],
        links: [],
        updates: [],
        reply: msg.content,
        follow_up: msg.followUp ?? "",
        curiosity: [],
      });
      history.push({ role: "assistant", content: assistantJson });
    }
  }

  return history;
}

/**
 * Find stale nodes that haven't been surfaced recently.
 * Uses raw SQL because it joins across @@map-ed tables.
 */
export async function buildNudgeContext(): Promise<string> {
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const surfacedCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<
    {
      name: string;
      tags: string[];
      updatedAt: Date;
      lastSurfaced: Date | null;
    }[]
  >`
    SELECT n.name, n.tags, n."updatedAt", nr."lastSurfaced"
    FROM "nodes" n
    LEFT JOIN "node_recalls" nr ON n.id = nr."nodeId"
    WHERE n."updatedAt" <= ${staleCutoff}
      AND (nr."lastSurfaced" IS NULL OR nr."lastSurfaced" <= ${surfacedCutoff})
    ORDER BY n."updatedAt" ASC
    LIMIT 5
  `;

  if (rows.length === 0) return "";

  const lines = [
    "Nodes you haven't discussed recently (consider weaving in):\n",
  ];

  for (const row of rows) {
    const tagStr =
      row.tags && row.tags.length > 0 ? row.tags.join(", ") : "untagged";
    const lastSurfaced = row.lastSurfaced
      ? row.lastSurfaced.toISOString().split("T")[0]
      : "never";
    const updatedStr = row.updatedAt.toISOString().split("T")[0];
    lines.push(
      `- [[${row.name}]] [${tagStr}] last updated ${updatedStr}, last surfaced ${lastSurfaced}`,
    );
  }

  return lines.join("\n");
}

// ----------------------------------------------------------------
// Recap helpers (public — used by digest/recap generation)
// ----------------------------------------------------------------

/**
 * Build a detailed vault summary for recap generation.
 */
export async function buildRecapVaultSummary(): Promise<string> {
  const nodes = await prisma.node.findMany({
    include: {
      sourceLinks: { include: { targetNode: true } },
    },
    orderBy: { name: "asc" },
  });

  if (nodes.length === 0) return "No nodes in the vault yet.";

  const lines: string[] = [];
  for (const node of nodes) {
    const parts = [`- ${node.name} [${node.tags.join(", ")}]`];
    if (node.sourceLinks.length > 0) {
      const linkStrs = node.sourceLinks.map(
        (l) => `${l.targetNode.name} (${l.relation})`,
      );
      parts.push(`  Links: ${linkStrs.join(", ")}`);
    }
    if (node.notes) {
      const preview = node.notes.slice(0, 200).replace(/\n/g, " ").trim();
      parts.push(`  Notes: ${preview}`);
    }
    parts.push(`  Updated: ${node.updatedAt.toISOString()}`);
    lines.push(parts.join("\n"));
  }

  return lines.join("\n\n");
}

/**
 * Build a summary of recent conversations for recap.
 */
export async function buildRecapMessagesSummary(
  limit = 50,
): Promise<string> {
  const total = await prisma.message.count();
  if (total === 0) return "No conversation history yet.";

  const skip = Math.max(0, total - limit);
  const recent = await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
    skip,
    take: limit,
  });

  if (recent.length === 0) return "No conversation history yet.";

  const lines: string[] = [];
  for (const msg of recent) {
    const roleLabel = msg.role === "user" ? "User" : "Kioku";
    const contentPreview = msg.content.slice(0, 300).replace(/\n/g, " ").trim();
    lines.push(`- ${roleLabel}: ${contentPreview}`);
    if (msg.role === "assistant" && msg.followUp) {
      lines.push(`  Follow-up: ${msg.followUp}`);
    }
    if (msg.createdNodes.length > 0) {
      lines.push(`  Created: ${msg.createdNodes.join(", ")}`);
    }
    if (msg.updatedNodes.length > 0) {
      lines.push(`  Updated: ${msg.updatedNodes.join(", ")}`);
    }
  }

  return lines.join("\n");
}

// ----------------------------------------------------------------
// Internal pipeline stages
// ----------------------------------------------------------------

/**
 * Run entity extraction with full vault + nudge context and message history.
 */
async function runExtraction(text: string): Promise<ExtractionResult> {
  const vaultContext = await buildVaultContext();
  const nudgeContext = await buildNudgeContext();
  const history = await buildHistory();

  let fullContext = vaultContext;
  if (nudgeContext) {
    fullContext += "\n\n" + nudgeContext;
  }

  return extract(text, fullContext, history);
}

/**
 * Store nodes, links, and updates from an extraction result.
 * Returns [created, updated] node name arrays.
 */
async function store(
  extraction: ExtractionResult,
): Promise<[string[], string[]]> {
  const created: string[] = [];
  const updated: string[] = [];

  // Create new nodes (upsert to handle re-extraction gracefully)
  for (const extracted of extraction.nodes) {
    await upsertNode(extracted.name, extracted.tags, extracted.fields);
    created.push(extracted.name);
    await journalLog(
      `Created node: ${extracted.name} [${extracted.tags.join(", ")}]`,
    );
  }

  // Apply updates (append to notes)
  for (const update of extraction.updates) {
    await appendNote(update.node, update.append);
    if (!updated.includes(update.node)) {
      updated.push(update.node);
    }
    await journalLog(`Updated node: ${update.node}`);
  }

  // Wire links (bidirectionally)
  for (const link of extraction.links) {
    await createBidirectionalLink(link.source, link.target, link.rel);

    if (!updated.includes(link.source) && !created.includes(link.source)) {
      updated.push(link.source);
    }
    if (!updated.includes(link.target) && !created.includes(link.target)) {
      updated.push(link.target);
    }

    await journalLog(`Link: ${link.source} \u2014[${link.rel}]\u2192 ${link.target}`);
  }

  return [created, updated];
}
