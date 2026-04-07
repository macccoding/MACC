import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const sp = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10), 200);
  const offset = parseInt(sp.get("offset") ?? "0", 10);

  try {
    const sessions = await prisma.tTSession.findMany({
      include: { drills: true },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("[tt/sessions] GET error:", err);
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

  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });
  if (typeof duration !== "number") return NextResponse.json({ error: "duration is required" }, { status: 400 });
  if (!blade) return NextResponse.json({ error: "blade is required" }, { status: 400 });

  try {
    const session = await prisma.tTSession.create({
      data: {
        date: new Date(date),
        duration,
        blade,
        ...(location ? { location } : {}),
        ...(mode1Respected !== undefined ? { mode1Respected } : {}),
        ...(peakMode !== undefined ? { peakMode } : {}),
        ...(energyLevel !== undefined ? { energyLevel } : {}),
        ...(notes ? { notes } : {}),
        ...(drills?.length
          ? {
              drills: {
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
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[tt/sessions] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
