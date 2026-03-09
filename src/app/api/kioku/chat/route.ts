import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processText } from "@/lib/kioku/pipeline";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let text: string;

  try {
    const body = await request.json();
    text = body.text;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Text is required" },
      { status: 400 }
    );
  }

  try {
    const result = await processText(text.trim());

    return NextResponse.json({
      reply: result.reply,
      follow_up: result.follow_up,
      created: result.created,
      updated: result.updated,
    });
  } catch (err) {
    console.error("[kioku/chat] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
