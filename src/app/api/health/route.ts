import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "14", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  try {
    const snapshots = await prisma.healthSnapshot.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(snapshots);
  } catch (err) {
    console.error("[health] List error:", err);
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
  let steps: number | undefined;
  let calories: number | undefined;
  let heartRate: number | undefined;
  let sleep: number | undefined;
  let data: Prisma.InputJsonValue | undefined;

  try {
    const body = await request.json();
    date = body.date;
    steps = body.steps;
    calories = body.calories;
    heartRate = body.heartRate;
    sleep = body.sleep;
    data = body.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json(
      { error: "Date is required" },
      { status: 400 }
    );
  }

  // Normalize to midnight UTC
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);

  try {
    const snapshot = await prisma.healthSnapshot.upsert({
      where: { date: normalized },
      create: {
        date: normalized,
        ...(steps != null ? { steps } : {}),
        ...(calories != null ? { calories } : {}),
        ...(heartRate != null ? { heartRate } : {}),
        ...(sleep != null ? { sleep } : {}),
        ...(data ? { data } : {}),
      },
      update: {
        ...(steps != null ? { steps } : {}),
        ...(calories != null ? { calories } : {}),
        ...(heartRate != null ? { heartRate } : {}),
        ...(sleep != null ? { sleep } : {}),
        ...(data ? { data } : {}),
      },
    });

    return NextResponse.json(snapshot, { status: 200 });
  } catch (err) {
    console.error("[health] Upsert error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
