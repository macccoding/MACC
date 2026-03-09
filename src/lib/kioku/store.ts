import { prisma } from "@/lib/prisma";
import { slugify } from "./extract";
import type { ExtractedEntity } from "./types";

// ---------------------------------------------------------------------------
// Node operations
// ---------------------------------------------------------------------------

/**
 * Upsert a node by slug. Creates with the given tags, or merges tags
 * into the existing node (deduped).
 */
export async function upsertNode(
  name: string,
  tags: string[] = []
): Promise<{ id: string; name: string; slug: string; tags: string[]; notes: string }> {
  const slug = slugify(name);

  const existing = await prisma.node.findUnique({ where: { slug } });

  if (existing) {
    const mergedTags = [...new Set([...existing.tags, ...tags])];
    const updated = await prisma.node.update({
      where: { slug },
      data: { tags: mergedTags },
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
    data: { name, slug, tags },
  });
  return {
    id: created.id,
    name: created.name,
    slug: created.slug,
    tags: created.tags,
    notes: created.notes,
  };
}

/**
 * Append a note to a node, separated by "---".
 */
export async function appendNote(slug: string, note: string): Promise<void> {
  const node = await prisma.node.findUnique({ where: { slug } });
  if (!node) return;

  const newNotes = node.notes ? `${node.notes}\n---\n${note}` : note;

  await prisma.node.update({
    where: { slug },
    data: { notes: newNotes },
  });
}

// ---------------------------------------------------------------------------
// Link operations
// ---------------------------------------------------------------------------

/**
 * Create a link between two nodes by slug, upserting by the compound unique
 * (sourceNodeId, targetNodeId, relation).
 */
export async function createLink(
  sourceSlug: string,
  targetSlug: string,
  relation: string
): Promise<void> {
  const [source, target] = await Promise.all([
    prisma.node.findUnique({ where: { slug: sourceSlug } }),
    prisma.node.findUnique({ where: { slug: targetSlug } }),
  ]);

  if (!source || !target) return;

  await prisma.link.upsert({
    where: {
      sourceNodeId_targetNodeId_relation: {
        sourceNodeId: source.id,
        targetNodeId: target.id,
        relation,
      },
    },
    update: {},
    create: {
      sourceNodeId: source.id,
      targetNodeId: target.id,
      relation,
    },
  });
}

// ---------------------------------------------------------------------------
// Batch processing
// ---------------------------------------------------------------------------

/**
 * Process an array of extracted entities: upsert source + target nodes
 * and create links between them.
 */
export async function processEntities(
  entities: ExtractedEntity[]
): Promise<void> {
  for (const entity of entities) {
    await upsertNode(entity.subject, ["entity"]);
    await upsertNode(entity.object, ["entity"]);
    await createLink(
      slugify(entity.subject),
      slugify(entity.object),
      entity.predicate
    );
  }
}
