import Anthropic from "@anthropic-ai/sdk";
import { MODEL_HAIKU } from "@/lib/kemi/config";
import type { ExtractedEntity } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a name to a URL-safe slug.
 * Lowercase, replace non-alphanumeric runs with hyphens, trim leading/trailing hyphens.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parse the LLM extraction response into validated triples.
 * Strips markdown code fences, parses JSON, and filters out any triples
 * with empty fields. Returns [] on any parse error.
 */
export function parseExtractionResponse(text: string): ExtractedEntity[] {
  try {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item: Record<string, unknown>) =>
        typeof item.subject === "string" &&
        typeof item.predicate === "string" &&
        typeof item.object === "string" &&
        item.subject.trim().length > 0 &&
        item.predicate.trim().length > 0 &&
        item.object.trim().length > 0
    ) as ExtractedEntity[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Entity extraction
// ---------------------------------------------------------------------------

const EXTRACTION_PROMPT = `Extract factual knowledge triples from the following text.
Return a JSON array of objects with "subject", "predicate", and "object" fields.
Use lowercase_underscore format for predicates (e.g. "lives_in", "works_at", "owns").
Only extract concrete facts — skip opinions, questions, and hypotheticals.
Return an empty array [] if no facts are found.

Text:
`;

/**
 * Call Haiku to extract {subject, predicate, object} triples from text.
 */
export async function extractEntities(
  text: string
): Promise<ExtractedEntity[]> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: EXTRACTION_PROMPT + text,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  if (!textBlock) return [];

  return parseExtractionResponse(textBlock.text);
}
