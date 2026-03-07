import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  try {
    const snapshots = await prisma.financialSnapshot.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(snapshots);
  } catch (err) {
    console.error("[finances] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let date: string;
  let data: Prisma.InputJsonValue;

  try {
    const body = await request.json();
    date = body.date;
    data = body.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!date || !data || typeof data !== "object") {
    return NextResponse.json(
      { error: "date and data are required" },
      { status: 400 }
    );
  }

  // Normalize to midnight
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  try {
    const snapshot = await prisma.financialSnapshot.upsert({
      where: { date: normalized },
      create: { date: normalized, data },
      update: { data },
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (err) {
    console.error("[finances] Upsert error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
