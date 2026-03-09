import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

  try {
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          role: true,
          content: true,
          followUp: true,
          createdNodes: true,
          updatedNodes: true,
          createdAt: true,
        },
      }),
      prisma.message.count(),
    ]);

    return NextResponse.json({ messages, total });
  } catch (err) {
    console.error("[kioku/messages] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
