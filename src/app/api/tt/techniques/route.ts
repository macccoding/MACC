import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const ratings = await prisma.tTTechniqueRating.findMany({
      orderBy: { date: "desc" },
    });

    // Group by shot, keep only latest per shot
    const byShot = new Map<string, typeof ratings[0]>();
    for (const r of ratings) {
      if (!byShot.has(r.shot)) byShot.set(r.shot, r);
    }

    return NextResponse.json(Array.from(byShot.values()));
  } catch (err) {
    console.error("[tt/techniques] GET error:", err);
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

  const { shot, rating, date, notes } = body as {
    shot?: string;
    rating?: number;
    date?: string;
    notes?: string;
  };

  if (!shot) return NextResponse.json({ error: "shot is required" }, { status: 400 });
  if (typeof rating !== "number") return NextResponse.json({ error: "rating is required" }, { status: 400 });

  try {
    const entry = await prisma.tTTechniqueRating.create({
      data: {
        shot,
        rating,
        date: date ? new Date(date) : new Date(),
        ...(notes ? { notes } : {}),
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[tt/techniques] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
