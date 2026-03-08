export type ModelTier = "haiku" | "sonnet" | "opus";

const OPUS_KEYWORDS = [
  "review",
  "plan",
  "strategy",
  "analyze",
  "analyse",
  "reflect",
  "deep dive",
  "architecture",
  "evaluate",
  "compare",
  "pros and cons",
  "career",
  "life",
];

const HAIKU_PATTERNS = [
  /^(hi|hey|hello|yo|sup|gm|morning|evening)\b/i,
  /^(what|how|when|where)\s+(is|are|was|were)\b/i,
  /^(show|get|check|list)\s+\w+$/i,
];

export function routeModel(message: string): { model: string; tier: ModelTier } {
  const lower = message.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).length;

  if (OPUS_KEYWORDS.some((kw) => lower.includes(kw)) && wordCount > 5) {
    return { model: "claude-opus-4-6", tier: "opus" };
  }

  if (wordCount <= 8 || HAIKU_PATTERNS.some((p) => p.test(lower))) {
    return { model: "claude-haiku-4-5-20251001", tier: "haiku" };
  }

  return { model: "claude-sonnet-4-5-20250514", tier: "sonnet" };
}
