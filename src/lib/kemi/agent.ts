import Anthropic from "@anthropic-ai/sdk";
import { selectModel } from "./router";
import { getSystemPromptParts } from "./system-prompt";
import { buildContext } from "./context";
import {
  MAX_CONVERSATION_HISTORY,
  MAX_OUTPUT_TOKENS,
  MAX_TOOL_ITERATIONS,
} from "./config";
import type { KemiMessage, KemiResponse } from "./types";

const anthropic = new Anthropic();

/**
 * Process a user message through the Kemi agent.
 *
 * 1. Selects model via router (Haiku for simple, Sonnet otherwise)
 * 2. Builds dynamic context (timestamp, task/memory keywords)
 * 3. Assembles system prompt with cache control on the static personality block
 * 4. Trims conversation history to MAX_CONVERSATION_HISTORY
 * 5. Calls Claude with tool-use loop (tools not yet implemented)
 * 6. Returns text response with model and usage info
 */
export async function processMessage(
  userMessage: string,
  history: KemiMessage[] = []
): Promise<KemiResponse> {
  // 1. Select model based on message complexity
  const model = selectModel(userMessage);

  // 2. Build dynamic context
  const dynamicContext = await buildContext(userMessage);

  // 3. Get system prompt parts
  const [personality, context] = getSystemPromptParts(dynamicContext);

  // 4. Trim history to limit
  const trimmedHistory = history.slice(-MAX_CONVERSATION_HISTORY);

  // 5. Build messages array
  const messages: Anthropic.MessageParam[] = [
    ...trimmedHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  // 6. Call Claude
  let response = await anthropic.messages.create({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: "text" as const,
        text: personality,
        cache_control: { type: "ephemeral" as const },
      },
      { type: "text" as const, text: context },
    ],
    messages,
  });

  // 7. Tool use loop
  let iterations = 0;
  while (
    response.stop_reason === "tool_use" &&
    iterations < MAX_TOOL_ITERATIONS
  ) {
    iterations++;

    // Extract tool use blocks
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    // Build tool results (not yet implemented)
    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
      (block) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: "Tool not yet implemented",
      })
    );

    // Continue conversation with tool results
    messages.push({ role: "assistant" as const, content: response.content });
    messages.push({ role: "user" as const, content: toolResults });

    response = await anthropic.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: "text" as const,
          text: personality,
          cache_control: { type: "ephemeral" as const },
        },
        { type: "text" as const, text: context },
      ],
      messages,
    });
  }

  // 8. Extract text content
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  const content = textBlock?.text ?? "I couldn't generate a response.";

  return {
    content,
    model: response.model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
