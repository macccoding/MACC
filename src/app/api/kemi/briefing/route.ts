import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateBriefing } from "@/lib/kemi/briefing";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const briefing = await generateBriefing();
    return NextResponse.json({ briefing });
  } catch (err) {
    console.error("[kemi/briefing] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
