import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";
import { mapHealthPayload } from "@/lib/health/ingest-mapper";

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
  // Webhook auth: x-api-key header OR session cookie
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.HEALTH_INGEST_KEY;
  const isWebhook = apiKey && expectedKey && apiKey === expectedKey;

  console.log("[health] auth debug:", {
    hasApiKey: !!apiKey,
    hasExpectedKey: !!expectedKey,
    expectedKeyLength: expectedKey?.length,
    apiKeyLength: apiKey?.length,
    match: apiKey === expectedKey,
  });

  if (!isWebhook) {
    const authError = requireAuth(request);
    if (authError) return authError;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Webhook path: use field mapper for Health Auto Export payloads
  if (isWebhook) {
    const mapped = mapHealthPayload(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const snapshot = await prisma.healthSnapshot.upsert({
        where: { date: today },
        create: {
          date: today,
          steps: mapped.steps,
          calories: mapped.calories,
          heartRate: mapped.heartRate,
          sleep: mapped.sleep,
          data: mapped.data,
        },
        update: {
          ...(mapped.steps !== null ? { steps: mapped.steps } : {}),
          ...(mapped.calories !== null ? { calories: mapped.calories } : {}),
          ...(mapped.heartRate !== null ? { heartRate: mapped.heartRate } : {}),
          ...(mapped.sleep !== null ? { sleep: mapped.sleep } : {}),
          ...(Object.keys(mapped.data).length > 0 ? { data: mapped.data } : {}),
        },
      });
      return NextResponse.json(snapshot, { status: 201 });
    } catch (err) {
      console.error("[health] Ingest error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }

  // Manual entry path: explicit fields
  const date = body.date as string | undefined;
  const steps = body.steps as number | undefined;
  const calories = body.calories as number | undefined;
  const heartRate = body.heartRate as number | undefined;
  const sleep = body.sleep as number | undefined;
  const data = body.data as Prisma.InputJsonValue | undefined;

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
