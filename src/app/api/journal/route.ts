import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") || "30", 10) || 30),
    100
  );

  try {
    const entries = await prisma.journal.findMany({
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(entries);
  } catch (err) {
    console.error("[journal] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
