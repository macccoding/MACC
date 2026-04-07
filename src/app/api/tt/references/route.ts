import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const shot = request.nextUrl.searchParams.get("shot");

  try {
    const references = await prisma.tTTechniqueReference.findMany({
      where: shot ? { shot } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(references);
  } catch (err) {
    console.error("[tt/references] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { shot, playerName, mechanicsBreakdown, extractionNotes, comparisonNotes, videoLinks } = body as {
    shot?: string;
    playerName?: string;
    mechanicsBreakdown?: string;
    extractionNotes?: string;
    comparisonNotes?: string;
    videoLinks?: unknown;
  };

  if (!shot) return NextResponse.json({ error: "shot is required" }, { status: 400 });
  if (!playerName) return NextResponse.json({ error: "playerName is required" }, { status: 400 });

  try {
    const ref = await prisma.tTTechniqueReference.create({
      data: {
        shot,
        playerName,
        ...(mechanicsBreakdown ? { mechanicsBreakdown } : {}),
        ...(extractionNotes ? { extractionNotes } : {}),
        ...(comparisonNotes ? { comparisonNotes } : {}),
        ...(videoLinks !== undefined ? { videoLinks: videoLinks as Prisma.InputJsonValue } : {}),
      },
    });
    return NextResponse.json(ref, { status: 201 });
  } catch (err) {
    console.error("[tt/references] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, shot, playerName, mechanicsBreakdown, extractionNotes, comparisonNotes, videoLinks } = body as {
    id?: string;
    shot?: string;
    playerName?: string;
    mechanicsBreakdown?: string;
    extractionNotes?: string;
    comparisonNotes?: string;
    videoLinks?: unknown;
  };

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    const existing = await prisma.tTTechniqueReference.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const ref = await prisma.tTTechniqueReference.update({
      where: { id },
      data: {
        ...(shot ? { shot } : {}),
        ...(playerName ? { playerName } : {}),
        ...(mechanicsBreakdown !== undefined ? { mechanicsBreakdown } : {}),
        ...(extractionNotes !== undefined ? { extractionNotes } : {}),
        ...(comparisonNotes !== undefined ? { comparisonNotes } : {}),
        ...(videoLinks !== undefined ? { videoLinks: videoLinks as Prisma.InputJsonValue } : {}),
      },
    });
    return NextResponse.json(ref);
  } catch (err) {
    console.error("[tt/references] PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
