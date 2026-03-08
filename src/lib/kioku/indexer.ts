import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { MODEL_HAIKU } from "@/lib/kemi/config";

const anthropic = new Anthropic();

type ExtractedEntity = { name: string; type: string };
type ExtractionResult = { entities: ExtractedEntity[]; concepts: string[] };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function extractEntities(
  text: string
): Promise<ExtractionResult> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Extract named entities and concepts from this text. Return JSON only.

Text: "${text.slice(0, 1000)}"

Format: {"entities": [{"name": "...", "type": "person|topic|concept|place|project"}], "concepts": ["..."]}`,
        },
      ],
    });
    const out =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(out);
    return { entities: parsed.entities || [], concepts: parsed.concepts || [] };
  } catch {
    return { entities: [], concepts: [] };
  }
}

export async function indexContent(
  text: string,
  source: string
): Promise<{ nodesCreated: number; linksCreated: number }> {
  const { entities, concepts } = await extractEntities(text);
  let nodesCreated = 0;
  let linksCreated = 0;

  const allEntities = [
    ...entities,
    ...concepts.map((c) => ({ name: c, type: "concept" })),
  ];

  const nodeIds: string[] = [];

  for (const entity of allEntities) {
    const slug = slugify(entity.name);
    if (!slug) continue;

    let node = await prisma.node.findUnique({ where: { slug } });

    if (!node) {
      node = await prisma.node.findFirst({
        where: { name: { contains: entity.name, mode: "insensitive" } },
      });
    }

    if (!node) {
      node = await prisma.node.create({
        data: {
          name: entity.name,
          slug,
          tags: [entity.type, source],
          notes: `First seen in ${source}`,
        },
      });
      nodesCreated++;
    }

    nodeIds.push(node.id);

    await prisma.nodeRecall.upsert({
      where: { nodeId: node.id },
      create: {
        nodeId: node.id,
        lastSurfaced: new Date(),
        surfaceCount: 1,
      },
      update: {
        lastSurfaced: new Date(),
        surfaceCount: { increment: 1 },
      },
    });
  }

  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      try {
        await prisma.link.create({
          data: {
            sourceNodeId: nodeIds[i],
            targetNodeId: nodeIds[j],
            relation: `co-occurrence:${source}`,
          },
        });
        linksCreated++;
      } catch {
        // Unique constraint — link already exists
      }
    }
  }

  return { nodesCreated, linksCreated };
}
