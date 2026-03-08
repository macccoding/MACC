import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@/generated/prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { routeModel } from "@/lib/kemi/model-router";
import { getRelevantContext } from "@/lib/kemi/context-manager";
import { buildSystemPrompt } from "@/lib/kemi/system-prompt-builder";
import { KEMI_TOOLS } from "@/lib/kemi/tools";
import { executeTool } from "@/lib/kemi/tool-executor";
import type { KemiMessage } from "@/lib/kemi/types";

const anthropic = new Anthropic();

const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY = 20;
const MAX_OUTPUT_TOKENS = 4096;

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  // 1. Parse body
  let message: string;
  let history: KemiMessage[];
  let conversationId: string | undefined;

  try {
    const body = await request.json();
    message = body.message;
    history = body.history ?? [];
    conversationId = body.conversationId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const userMessage = message.trim();

  try {
    // 2. Route model
    const { model, tier } = routeModel(userMessage);

    // 3. Get relevant context
    const contextBlocks = await getRelevantContext(userMessage);

    // 4. Build system prompt
    const systemPrompt = buildSystemPrompt(contextBlocks);

    // 5. Build messages array
    const trimmedHistory = history.slice(-MAX_HISTORY);
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

    // 7. Tool use loop (max 5 rounds)
    let rounds = 0;
    while (response.stop_reason === "tool_use" && rounds < MAX_TOOL_ROUNDS) {
      rounds++;

      // Extract tool_use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      // Execute each tool
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          try {
            const result = await executeTool(
              block.name,
              block.input as Record<string, unknown>
            );
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
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
        })
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
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const content = textBlock?.text ?? "I couldn't generate a response.";

    // 9. Save conversation (fire-and-forget)
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
          console.error("[kemi] Failed to update conversation:", err)
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
          console.error("[kemi] Failed to save conversation:", err)
        );
    }

    // 10. Return response
    return NextResponse.json({
      content,
      model: response.model,
    });
  } catch (err) {
    console.error("[kemi] Agent error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
