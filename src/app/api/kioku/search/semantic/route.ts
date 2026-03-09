import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    // MVP: fall back to text search (semantic embeddings TBD)
    const results = await prisma.node.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        tags: true,
        notes: true,
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[kioku/search/semantic] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
