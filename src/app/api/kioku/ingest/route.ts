import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processText } from "@/lib/kioku/pipeline";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const context = formData.get("context");

    if (!context || typeof context !== "string" || context.trim().length === 0) {
      return NextResponse.json(
        { error: "Context text is required" },
        { status: 400 }
      );
    }

    const result = await processText(context.trim());

    return NextResponse.json({
      reply: result.reply,
      follow_up: result.follow_up,
      created: result.created,
      updated: result.updated,
    });
  } catch (err) {
    console.error("[kioku/ingest] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
