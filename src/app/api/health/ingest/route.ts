import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  // API key auth (not cookie-based — used by Health Auto Export webhook)
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.HEALTH_INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let date: string;
  let metrics: {
    steps?: number;
    calories?: number;
    heartRate?: number;
    sleep?: number;
    [key: string]: unknown;
  };

  try {
    const body = await request.json();
    date = body.date;
    metrics = body.metrics || {};
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

  const { steps, calories, heartRate, sleep, ...rest } = metrics;
  const extraData = rest as Prisma.InputJsonValue;

  try {
    const snapshot = await prisma.healthSnapshot.upsert({
      where: { date: normalized },
      create: {
        date: normalized,
        ...(steps != null ? { steps: Math.round(steps) } : {}),
        ...(calories != null ? { calories: Math.round(calories) } : {}),
        ...(heartRate != null ? { heartRate: Math.round(heartRate) } : {}),
        ...(sleep != null ? { sleep } : {}),
        data: extraData,
      },
      update: {
        ...(steps != null ? { steps: Math.round(steps) } : {}),
        ...(calories != null ? { calories: Math.round(calories) } : {}),
        ...(heartRate != null ? { heartRate: Math.round(heartRate) } : {}),
        ...(sleep != null ? { sleep } : {}),
        data: extraData,
      },
    });

    return NextResponse.json({ ingested: true, id: snapshot.id });
  } catch (err) {
    console.error("[health/ingest] Upsert error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
