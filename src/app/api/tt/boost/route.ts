import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const logs = await prisma.tTBoostLog.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(logs);
  } catch (err) {
    console.error("[tt/boost] GET error:", err);
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

  const { rubber, blade, side, booster, date, notes } = body as {
    rubber?: string;
    blade?: string;
    side?: string;
    booster?: string;
    date?: string;
    notes?: string;
  };

  if (!rubber) return NextResponse.json({ error: "rubber is required" }, { status: 400 });
  if (!blade) return NextResponse.json({ error: "blade is required" }, { status: 400 });
  if (!side) return NextResponse.json({ error: "side is required" }, { status: 400 });
  if (!booster) return NextResponse.json({ error: "booster is required" }, { status: 400 });
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  try {
    const entry = await prisma.tTBoostLog.create({
      data: {
        rubber,
        blade,
        side,
        booster,
        date: new Date(date),
        ...(notes ? { notes } : {}),
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[tt/boost] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
