import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { routeModel } from "@/lib/kemi/model-router";
import { getRelevantContext } from "@/lib/kemi/context-manager";
import { buildSystemPrompt } from "@/lib/kemi/system-prompt-builder";
import { KEMI_TOOLS } from "@/lib/kemi/tools";
import { executeTool } from "@/lib/kemi/tool-executor";
import { truncateToolResult } from "@/lib/kemi/utils";
import { remember } from "@/lib/kemi/memory";
import { getPreference } from "@/lib/kemi/preferences";
import type { KemiMessage } from "@/lib/kemi/types";

const anthropic = new Anthropic();

const MAX_TOOL_ROUNDS = 10;
const MAX_HISTORY = 20;
const MAX_OUTPUT_TOKENS = 4096;

/**
 * Multi-channel entry point for Kemi.
 * Used by the web chat route, Telegram webhook, and future channels.
 *
 * 1. Routes model via message complexity
 * 2. Fetches relevant context (habits, health, portfolio, etc.)
 * 3. Builds system prompt from soul files + context
 * 4. Loads conversation history (web: passed in, other channels: from DB)
 * 5. Runs Claude with tool loop (max 10 rounds)
 * 6. Saves messages to ConversationMessage table (fire-and-forget)
 * 7. Embeds conversation to memory if substantial (fire-and-forget)
 * 8. Returns response text
 */
export async function processKemiMessage(
  message: string,
  channel: string = "web",
  isVoiceNote: boolean = false,
  originalVoiceText?: string,
  history?: Array<{ role: string; content: string }>,
  conversationId?: string,
): Promise<string> {
  // Kill switch — highest priority check
  const killSwitch = await getPreference<boolean>("kill_switch", false);
  if (killSwitch) {
    return "I'm currently paused by the kill switch. All autonomous actions are suspended until Mike re-enables me.";
  }

  // Build the user message, prepending voice note context if applicable
  const prefix =
    isVoiceNote && originalVoiceText
      ? `[Voice note transcription]: ${originalVoiceText}\n\n`
      : "";
  const userMessage = (prefix ? prefix + message : message).trim();

  // 1. Route model
  const { model, tier } = routeModel(userMessage);

  // 2. Get relevant context
  const contextBlocks = await getRelevantContext(userMessage);

  // 3. Build system prompt
  const systemPrompt = buildSystemPrompt(contextBlocks);

  // 4. Load conversation history
  let conversationHistory: KemiMessage[];

  if (channel === "web" && history && history.length > 0) {
    // Web channel with client-side history: use it
    conversationHistory = history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
  } else {
    // All channels (including web with no history): load from DB
    const dbMessages = await prisma.conversationMessage.findMany({
      where: { channel },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY,
    });
    // Reverse to chronological order
    conversationHistory = dbMessages.reverse().map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
  }

  // 5. Build messages array
  const trimmedHistory = conversationHistory.slice(-MAX_HISTORY);
  const messages: Anthropic.MessageParam[] = [
    ...trimmedHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  // 6. Initial Claude call with tools
  let response = await anthropic.messages.create({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    tools: KEMI_TOOLS,
    messages,
  });

  // 7. Tool use loop (max 10 rounds)
  let rounds = 0;
  while (response.stop_reason === "tool_use" && rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    // Extract tool_use blocks
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    // Execute each tool
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        try {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
          );
          const resultStr = JSON.stringify(result);
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: truncateToolResult(resultStr),
          };
        } catch (err) {
          console.error(`[kemi] Tool error (${block.name}):`, err);
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify({
              error: `Tool execution failed: ${err instanceof Error ? err.message : "Unknown error"}`,
            }),
            is_error: true,
          };
        }
      }),
    );

    // Feed results back
    messages.push({ role: "assistant" as const, content: response.content });
    messages.push({ role: "user" as const, content: toolResults });

    response = await anthropic.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      tools: KEMI_TOOLS,
      messages,
    });
  }

  // 8. Extract final text response
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
  const content = textBlock?.text ?? "I couldn't generate a response.";

  // 9. Save to KemiConversation (fire-and-forget, for web channel backward compat)
  if (channel === "web") {
    const conversationMessages = [
      ...trimmedHistory,
      { role: "user" as const, content: userMessage },
      { role: "assistant" as const, content },
    ] as unknown as Prisma.InputJsonValue;

    if (conversationId) {
      prisma.kemiConversation
        .update({
          where: { id: conversationId },
          data: { messages: conversationMessages },
        })
        .catch((err: unknown) =>
          console.error("[kemi] Failed to update conversation:", err),
        );
    } else {
      prisma.kemiConversation
        .create({
          data: {
            messages: conversationMessages,
            context: tier,
          },
        })
        .catch((err: unknown) =>
          console.error("[kemi] Failed to save conversation:", err),
        );
    }
  }

  // 10. Save to ConversationMessage table (fire-and-forget, all channels)
  Promise.all([
    prisma.conversationMessage.create({
      data: {
        channel,
        role: "user",
        content: userMessage,
        isVoiceNote,
        originalVoiceText: originalVoiceText ?? null,
      },
    }),
    prisma.conversationMessage.create({
      data: {
        channel,
        role: "assistant",
        content,
      },
    }),
  ]).catch((err: unknown) =>
    console.error("[kemi] Failed to save conversation messages:", err),
  );

  // 11. Fire-and-forget memory embedding if message is substantial
  if (userMessage.length >= 50) {
    const memoryContent = `User (${channel}): ${userMessage}\nKemi: ${content}`;
    remember(memoryContent, "conversation", { channel, tier }, channel).catch(
      (err: unknown) =>
        console.error("[kemi] Failed to embed conversation memory:", err),
    );
  }

  return content;
}
