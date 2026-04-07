import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const periods = await prisma.tTPeriodPhase.findMany({
      orderBy: { startMonth: "asc" },
    });
    return NextResponse.json(periods);
  } catch (err) {
    console.error("[tt/periods] GET error:", err);
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

  const { name, startMonth, endMonth, focusAreas, targets, reviewNotes } = body as {
    name?: string;
    startMonth?: string;
    endMonth?: string;
    focusAreas?: unknown;
    targets?: unknown;
    reviewNotes?: string;
  };

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!startMonth) return NextResponse.json({ error: "startMonth is required" }, { status: 400 });
  if (!endMonth) return NextResponse.json({ error: "endMonth is required" }, { status: 400 });
  if (focusAreas === undefined) return NextResponse.json({ error: "focusAreas is required" }, { status: 400 });
  if (targets === undefined) return NextResponse.json({ error: "targets is required" }, { status: 400 });

  try {
    const period = await prisma.tTPeriodPhase.create({
      data: {
        name,
        startMonth: new Date(startMonth),
        endMonth: new Date(endMonth),
        focusAreas: focusAreas as Prisma.InputJsonValue,
        targets: targets as Prisma.InputJsonValue,
        ...(reviewNotes ? { reviewNotes } : {}),
      },
    });
    return NextResponse.json(period, { status: 201 });
  } catch (err) {
    console.error("[tt/periods] POST error:", err);
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

  const { id, reviewNotes, focusAreas, targets } = body as {
    id?: string;
    reviewNotes?: string;
    focusAreas?: unknown;
    targets?: unknown;
  };

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    const existing = await prisma.tTPeriodPhase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const period = await prisma.tTPeriodPhase.update({
      where: { id },
      data: {
        ...(reviewNotes !== undefined ? { reviewNotes } : {}),
        ...(focusAreas !== undefined ? { focusAreas: focusAreas as Prisma.InputJsonValue } : {}),
        ...(targets !== undefined ? { targets: targets as Prisma.InputJsonValue } : {}),
      },
    });
    return NextResponse.json(period);
  } catch (err) {
    console.error("[tt/periods] PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
