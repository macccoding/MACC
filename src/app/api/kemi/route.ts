import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processKemiMessage } from "@/lib/kemi/agent";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  // 1. Parse body
  let message: string;
  let history: Array<{ role: string; content: string }>;
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
      { status: 400 },
    );
  }

  try {
    // 2. Process via shared agent
    const content = await processKemiMessage(
      message.trim(),
      "web",
      false,
      undefined,
      history,
      conversationId,
    );

    // 3. Return response
    return NextResponse.json({ content });
  } catch (err) {
    console.error("[kemi] Agent error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
