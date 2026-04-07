import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shot: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { shot } = await params;
  const decodedShot = decodeURIComponent(shot);

  try {
    const [ratings, references, recentDrills] = await Promise.all([
      prisma.tTTechniqueRating.findMany({
        where: { shot: decodedShot },
        orderBy: { date: "asc" },
      }),
      prisma.tTTechniqueReference.findMany({
        where: { shot: decodedShot },
        orderBy: { createdAt: "desc" },
      }),
      prisma.tTDrill.findMany({
        where: { technique: decodedShot },
        include: {
          session: {
            select: { date: true, blade: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({ shot: decodedShot, ratings, references, recentDrills });
  } catch (err) {
    console.error("[tt/techniques/[shot]] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
