import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const center = searchParams.get("center");
  const depth = Math.min(parseInt(searchParams.get("depth") || "2", 10), 4);

  try {
    if (center) {
      // BFS subgraph from center node
      const visited = new Set<string>();
      let frontier = [center];
      visited.add(center);

      for (let d = 0; d < depth && frontier.length > 0; d++) {
        const links = await prisma.link.findMany({
          where: {
            OR: [
              { sourceNodeId: { in: frontier } },
              { targetNodeId: { in: frontier } },
            ],
          },
        });

        const nextFrontier: string[] = [];
        for (const link of links) {
          if (!visited.has(link.sourceNodeId)) {
            visited.add(link.sourceNodeId);
            nextFrontier.push(link.sourceNodeId);
          }
          if (!visited.has(link.targetNodeId)) {
            visited.add(link.targetNodeId);
            nextFrontier.push(link.targetNodeId);
          }
        }
        frontier = nextFrontier;
      }

      const nodeIds = Array.from(visited);

      const [nodes, links] = await Promise.all([
        prisma.node.findMany({
          where: { id: { in: nodeIds } },
          include: { recalls: true },
        }),
        prisma.link.findMany({
          where: {
            AND: [
              { sourceNodeId: { in: nodeIds } },
              { targetNodeId: { in: nodeIds } },
            ],
          },
        }),
      ]);

      return NextResponse.json({ nodes, links });
    }

    // Default: 50 most recent nodes with their inter-links
    const nodes = await prisma.node.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { recalls: true },
    });

    const nodeIds = nodes.map((n) => n.id);

    const links = await prisma.link.findMany({
      where: {
        AND: [
          { sourceNodeId: { in: nodeIds } },
          { targetNodeId: { in: nodeIds } },
        ],
      },
    });

    return NextResponse.json({ nodes, links });
  } catch (err) {
    console.error("[kioku/graph] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
