import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let query: string;

  try {
    const body = await request.json();
    query = body.query;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Query is required" },
      { status: 400 }
    );
  }

  const searchTerms = query.trim().split(/\s+/).filter((t) => t.length > 0);

  try {
    const orConditions = searchTerms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { notes: { contains: term, mode: "insensitive" as const } },
      { tags: { has: term.toLowerCase() } },
    ]);

    const nodes = await prisma.node.findMany({
      where: { OR: orConditions },
      include: {
        recalls: true,
        sourceLinks: {
          take: 5,
          include: {
            targetNode: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        targetLinks: {
          take: 5,
          include: {
            sourceNode: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(nodes);
  } catch (err) {
    console.error("[kioku/search] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
