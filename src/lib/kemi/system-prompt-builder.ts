import { SOUL, CONTEXT_MIKE, CONTEXT_PEOPLE } from "./soul";
import { getMoodContext } from "./mood";
import { AUTONOMY_RULES } from "./autonomy";
import type { ContextBlock } from "./context-manager";
import { formatJamaicaTime } from "./context";

/**
 * Assemble the full Kemi system prompt from soul files, mood, autonomy rules,
 * live context blocks, and tool instructions.
 */
export function buildSystemPrompt(contextBlocks: ContextBlock[]): string {
  const sections: string[] = [];

  // Core identity
  sections.push(SOUL);

  // Mike's profile
  sections.push(CONTEXT_MIKE);

  // Key people
  sections.push(CONTEXT_PEOPLE);

  // Time-based mood
  sections.push(getMoodContext());

  // Autonomy rules
  sections.push(AUTONOMY_RULES);

  // Current timestamp
  sections.push(`## Current Time\n\n${formatJamaicaTime()}`);

  // Live data context
  if (contextBlocks.length > 0) {
    const contextSection = contextBlocks
      .map((block) => `### ${block.label}\n${block.content}`)
      .join("\n\n");
    sections.push(`## Live Data Context\n\n${contextSection}`);
  }

  // Tool usage instructions
  sections.push(`## Tool Usage

You have access to tools that read and write to Mike's Life OS dashboard.
Use them to answer questions with real data — never guess or hallucinate numbers.
When Mike asks about habits, goals, finances, etc., call the relevant tool first.
When logging or creating data, confirm what you did.
Keep tool calls efficient — don't fetch data you don't need.`);

  return sections.join("\n\n---\n\n");
}
