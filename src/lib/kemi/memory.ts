import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

async function embedText(content: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });
  return res.data[0].embedding;
}

export async function remember(
  content: string,
  memoryType: string = "conversation",
  metadata: Record<string, unknown> = {},
  sourceChannel?: string,
  importance: number = 0.5,
): Promise<string | null> {
  try {
    const embedding = await embedText(content);
    const vectorStr = `[${embedding.join(",")}]`;
    const result = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO memory_entries (id, content, embedding, "memoryType", metadata, "sourceChannel", importance, "createdAt")
       VALUES (gen_random_uuid(), $1, $2::vector, $3, $4::jsonb, $5, $6, NOW())
       RETURNING id`,
      content,
      vectorStr,
      memoryType,
      JSON.stringify(metadata),
      sourceChannel,
      importance,
    );
    return result[0]?.id ?? null;
  } catch (e) {
    console.error("Memory store failed:", e);
    return null;
  }
}

export async function recall(
  query: string,
  limit: number = 5,
  filterType?: string,
  threshold: number = 0.7,
): Promise<Array<{ id: string; content: string; similarity: number; memoryType: string }>> {
  try {
    const embedding = await embedText(query);
    const vectorStr = `[${embedding.join(",")}]`;

    // Build query with optional type filter
    const typeClause = filterType
      ? `AND "memoryType" = $4`
      : "";
    const params: unknown[] = [vectorStr, threshold, limit];
    if (filterType) params.push(filterType);

    const results = await prisma.$queryRawUnsafe<
      { id: string; content: string; memoryType: string; similarity: number }[]
    >(
      `SELECT id, content, "memoryType", 1 - (embedding <=> $1::vector) as similarity
       FROM memory_entries
       WHERE embedding IS NOT NULL
       ${typeClause}
       AND 1 - (embedding <=> $1::vector) > $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      ...params,
    );

    // Fire-and-forget: update access timestamps
    if (results.length > 0) {
      const ids = results.map((r) => r.id);
      prisma.$executeRawUnsafe(
        `UPDATE memory_entries SET "accessCount" = "accessCount" + 1, "lastAccessedAt" = NOW() WHERE id = ANY($1::text[])`,
        ids,
      ).catch(() => {});
    }

    return results;
  } catch (e) {
    console.error("Memory recall failed:", e);
    return [];
  }
}

export async function deleteExpiredMemories(): Promise<number> {
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM memory_entries WHERE "expiresAt" IS NOT NULL AND "expiresAt" < NOW()`,
  );
  return result;
}
