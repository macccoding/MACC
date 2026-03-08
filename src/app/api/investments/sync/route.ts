import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { syncAllPrices } from "@/lib/investments/price-sync";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const result = await syncAllPrices();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[investments] Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
