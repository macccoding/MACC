import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/lib/kemi/agent";
import { requireAuth } from "@/lib/auth";
import type { KemiMessage } from "@/lib/kemi/types";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  // Parse body
  let message: string;
  let history: KemiMessage[];

  try {
    const body = await request.json();
    message = body.message;
    history = body.history ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate message
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  try {
    const result = await processMessage(message.trim(), history);
    return NextResponse.json({
      content: result.content,
      model: result.model,
    });
  } catch (err) {
    console.error("[kemi] Agent error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
