const MAX_CONTEXT_CHARS = 1800;

const TASK_KEYWORDS = [
  "task",
  "todo",
  "to-do",
  "reminder",
  "deadline",
  "overdue",
  "priority",
  "due",
];

const MEMORY_KEYWORDS = [
  "remember",
  "recall",
  "forgot",
  "forget",
  "note",
  "saved",
  "what did i",
  "where did i",
  "when did i",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return true if `text` contains any of the `keywords` (case-insensitive).
 */
export function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Append a section to the parts array if the total character budget allows it.
 * Returns the new running total.
 */
function appendWithBudget(
  parts: string[],
  section: string,
  currentLen: number
): number {
  if (currentLen + section.length > MAX_CONTEXT_CHARS) return currentLen;
  parts.push(section);
  return currentLen + section.length;
}

/**
 * Format the current time in Jamaica (America/Jamaica, UTC-5).
 */
export function formatJamaicaTime(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Jamaica",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

/**
 * Build a dynamic context string for the system prompt.
 *
 * Includes a Jamaica timestamp, and conditionally appends task/memory
 * sections when the user message matches relevant keywords.
 *
 * TODO: Wire up DB queries for tasks and Kioku recall once those modules land.
 */
export async function buildContext(userMessage: string): Promise<string> {
  const parts: string[] = [];
  let len = 0;

  // Always include timestamp
  const timestamp = `Current time in Jamaica: ${formatJamaicaTime()}`;
  len = appendWithBudget(parts, timestamp, len);

  // Task context (placeholder)
  if (matchesAny(userMessage, TASK_KEYWORDS)) {
    const taskSection = "\n\n[Tasks: no active tasks loaded yet]";
    len = appendWithBudget(parts, taskSection, len);
  }

  // Memory context (placeholder)
  if (matchesAny(userMessage, MEMORY_KEYWORDS)) {
    const memorySection = "\n\n[Memory: Kioku recall not yet connected]";
    len = appendWithBudget(parts, memorySection, len);
    void len; // suppress unused-variable warning
  }

  return parts.join("");
}
