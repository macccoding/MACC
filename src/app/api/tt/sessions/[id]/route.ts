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
    const session = await prisma.tTSession.findUnique({
      where: { id },
      include: { drills: true },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch (err) {
    console.error("[tt/sessions/[id]] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, duration, blade, location, mode1Respected, peakMode, energyLevel, notes, drills } = body as {
    date?: string;
    duration?: number;
    blade?: string;
    location?: string;
    mode1Respected?: boolean;
    peakMode?: number;
    energyLevel?: number;
    notes?: string;
    drills?: Array<{
      name: string;
      category: string;
      technique?: string;
      rating?: number;
      notes?: string;
    }>;
  };

  try {
    const existing = await prisma.tTSession.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const session = await prisma.tTSession.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date) } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(blade ? { blade } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(mode1Respected !== undefined ? { mode1Respected } : {}),
        ...(peakMode !== undefined ? { peakMode } : {}),
        ...(energyLevel !== undefined ? { energyLevel } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(drills !== undefined
          ? {
              drills: {
                deleteMany: {},
                create: drills.map((d) => ({
                  name: d.name,
                  category: d.category,
                  ...(d.technique ? { technique: d.technique } : {}),
                  ...(d.rating !== undefined ? { rating: d.rating } : {}),
                  ...(d.notes ? { notes: d.notes } : {}),
                })),
              },
            }
          : {}),
      },
      include: { drills: true },
    });
    return NextResponse.json(session);
  } catch (err) {
    console.error("[tt/sessions/[id]] PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const existing = await prisma.tTSession.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.tTSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[tt/sessions/[id]] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
