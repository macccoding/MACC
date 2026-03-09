import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const includeRelations = {
  recalls: true,
  sourceLinks: {
    include: {
      targetNode: {
        select: { id: true, name: true, slug: true, tags: true },
      },
    },
  },
  targetLinks: {
    include: {
      sourceNode: {
        select: { id: true, name: true, slug: true, tags: true },
      },
    },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    // Try by id first, then by slug
    let node = await prisma.node.findUnique({
      where: { id },
      include: includeRelations,
    });

    if (!node) {
      node = await prisma.node.findUnique({
        where: { slug: id },
        include: includeRelations,
      });
    }

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Format connections for the frontend
    const connections = [
      ...node.sourceLinks.map((l) => ({
        relation: l.relation,
        direction: "outgoing" as const,
        node: l.targetNode,
      })),
      ...node.targetLinks.map((l) => ({
        relation: l.relation,
        direction: "incoming" as const,
        node: l.sourceNode,
      })),
    ];

    const recall = node.recalls[0] ?? null;

    return NextResponse.json({
      node: {
        id: node.id,
        name: node.name,
        slug: node.slug,
        tags: node.tags,
        fields: node.fields,
        notes: node.notes,
        status: node.status,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        connections,
        recall: recall
          ? { surfaceCount: recall.surfaceCount, lastSurfaced: recall.lastSurfaced }
          : null,
      },
    });
  } catch (err) {
    console.error("[kioku/nodes] Get error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
