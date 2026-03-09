import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateInsights } from "@/lib/kioku/insights";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const insights = await generateInsights();

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[kioku/insights] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
