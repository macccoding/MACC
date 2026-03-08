import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const node = await prisma.node.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!node) {
      return NextResponse.json(
        { error: "Node not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(node);
  } catch (err) {
    console.error("[kioku/nodes/id] Get error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
