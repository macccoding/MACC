import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const equipment = await prisma.tTEquipmentLog.findMany({
      orderBy: { dateStarted: "desc" },
    });
    return NextResponse.json(equipment);
  } catch (err) {
    console.error("[tt/equipment] GET error:", err);
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

  const { item, type, dateStarted, side, blade, dateEnded, satisfaction, pros, cons, verdict, revisitConditions, notes } = body as {
    item?: string;
    type?: string;
    dateStarted?: string;
    side?: string;
    blade?: string;
    dateEnded?: string;
    satisfaction?: number;
    pros?: string;
    cons?: string;
    verdict?: string;
    revisitConditions?: string;
    notes?: string;
  };

  if (!item) return NextResponse.json({ error: "item is required" }, { status: 400 });
  if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });
  if (!dateStarted) return NextResponse.json({ error: "dateStarted is required" }, { status: 400 });

  try {
    const entry = await prisma.tTEquipmentLog.create({
      data: {
        item,
        type,
        dateStarted: new Date(dateStarted),
        ...(side ? { side } : {}),
        ...(blade ? { blade } : {}),
        ...(dateEnded ? { dateEnded: new Date(dateEnded) } : {}),
        ...(satisfaction !== undefined ? { satisfaction } : {}),
        ...(pros ? { pros } : {}),
        ...(cons ? { cons } : {}),
        ...(verdict ? { verdict } : {}),
        ...(revisitConditions ? { revisitConditions } : {}),
        ...(notes ? { notes } : {}),
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[tt/equipment] POST error:", err);
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

  const { id, item, type, dateStarted, side, blade, dateEnded, satisfaction, pros, cons, verdict, revisitConditions, notes } = body as {
    id?: string;
    item?: string;
    type?: string;
    dateStarted?: string;
    side?: string;
    blade?: string;
    dateEnded?: string;
    satisfaction?: number;
    pros?: string;
    cons?: string;
    verdict?: string;
    revisitConditions?: string;
    notes?: string;
  };

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    const existing = await prisma.tTEquipmentLog.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const entry = await prisma.tTEquipmentLog.update({
      where: { id },
      data: {
        ...(item ? { item } : {}),
        ...(type ? { type } : {}),
        ...(dateStarted ? { dateStarted: new Date(dateStarted) } : {}),
        ...(side !== undefined ? { side } : {}),
        ...(blade !== undefined ? { blade } : {}),
        ...(dateEnded !== undefined ? { dateEnded: dateEnded ? new Date(dateEnded) : null } : {}),
        ...(satisfaction !== undefined ? { satisfaction } : {}),
        ...(pros !== undefined ? { pros } : {}),
        ...(cons !== undefined ? { cons } : {}),
        ...(verdict !== undefined ? { verdict } : {}),
        ...(revisitConditions !== undefined ? { revisitConditions } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });
    return NextResponse.json(entry);
  } catch (err) {
    console.error("[tt/equipment] PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
