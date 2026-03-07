import { MODEL_HAIKU, MODEL_SONNET } from "./config";

// ---------------------------------------------------------------------------
// Complexity scoring
// ---------------------------------------------------------------------------

const SIMPLE_PATTERNS = [
  /^(hi|hey|hello|yo|sup|good\s(morning|afternoon|evening))\b/i,
  /^what\s+(time|day|date)\s+is\s+it/i,
  /^(ok|okay|sure|thanks|thank\s+you|got\s+it|cool|bet|aight)\b/i,
  /^(create|add|make|set|show|list|check|get|open|delete|remove)\s+\w+$/i,
];

const COMPLEX_PATTERNS = [
  /\b(analy[sz]e|evaluat\w*|assess|break\s+down|deep\s+dive)\b/i,
  /\b(compar\w*|contrast|versus|vs\.?|differ\w*)\b/i,
  /\b(strateg\w*|plan\s+out|roadmap|prioriti[sz]e|optimiz\w*)\b/i,
  /\b(research|look\s+into|investigate|find\s+out)\b.*\b(summari[sz]e|report|brief)\b/i,
  /\b(restructur\w*|reorgani[sz]e|refactor|overhaul|redesign)\b/i,
];

export type Complexity = "simple" | "moderate" | "complex";

/**
 * Score how complex a user message is.
 *
 * Returns "simple" for greetings, acknowledgments, and short single-verb commands.
 * Returns "complex" for analytical, multi-part, or research tasks.
 * Falls back to "moderate" for everything in between.
 */
export function scoreComplexity(text: string): Complexity {
  const trimmed = text.trim();

  // Simple pattern match
  if (SIMPLE_PATTERNS.some((p) => p.test(trimmed))) return "simple";

  // Complex pattern match
  if (COMPLEX_PATTERNS.some((p) => p.test(trimmed))) return "complex";

  // Word-count heuristics
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length <= 8) return "simple";
  if (words.length >= 30) return "complex";

  // Conjunction heuristic — 2+ conjunctions suggests multi-part request
  const conjunctions = (
    trimmed.match(/\b(and|also|then|plus|as\s+well)\b/gi) || []
  ).length;
  if (conjunctions >= 2) return "complex";

  return "moderate";
}

// ---------------------------------------------------------------------------
// Intent classification
// ---------------------------------------------------------------------------

export type Intent = "task" | "comms" | "calendar" | "memory" | "general";

const INTENT_KEYWORDS: Record<Intent, RegExp[]> = {
  task: [
    /\b(task|todo|to-do|reminder|deadline|assign|priority|overdue|due)\b/i,
    /\b(create|add|finish|complete|done|check\s*off)\b.*\b(task|todo|item)\b/i,
  ],
  comms: [
    /\b(email|e-mail|text|message|whatsapp|call|reply|respond|send|draft)\b/i,
    /\b(inbox|unread|notification)\b/i,
  ],
  calendar: [
    /\b(calendar|schedule|meetings?|appointments?|events?|book|slot|availability)\b/i,
    /\b(reschedule|cancel)\b.*\b(meetings?|appointments?|events?)\b/i,
  ],
  memory: [
    /\b(remember|recall|note|jot|save|store|forget|forgot)\b/i,
    /\b(what\s+did\s+i|where\s+did\s+i|when\s+did\s+i)\b/i,
  ],
  general: [], // fallback — always matches last
};

/**
 * Classify a user message into an intent bucket.
 */
export function classifyIntent(text: string): Intent {
  for (const [intent, patterns] of Object.entries(INTENT_KEYWORDS) as [
    Intent,
    RegExp[],
  ][]) {
    if (intent === "general") continue;
    if (patterns.some((p) => p.test(text))) return intent;
  }
  return "general";
}

// ---------------------------------------------------------------------------
// Model selection
// ---------------------------------------------------------------------------

/**
 * Pick the right model based on message complexity.
 * Simple messages get Haiku (fast + cheap); everything else gets Sonnet.
 */
export function selectModel(text: string): string {
  const complexity = scoreComplexity(text);
  return complexity === "simple" ? MODEL_HAIKU : MODEL_SONNET;
}
