import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { mapHealthPayload } from "@/lib/health/ingest-mapper";

function getHealthValue(
  healthKey: string,
  snapshot: { steps: number | null; calories: number | null; heartRate: number | null; sleep: number | null },
  extraData: Record<string, unknown>
): number | null {
  switch (healthKey) {
    case "steps": return snapshot.steps;
    case "calories": return snapshot.calories;
    case "sleep": return snapshot.sleep;
    case "exerciseMinutes": return typeof extraData.exerciseMinutes === "number" ? extraData.exerciseMinutes : null;
    case "standHours": return typeof extraData.standHours === "number" ? extraData.standHours : null;
    default: return null;
  }
}

export async function POST(request: NextRequest) {
  // API key auth (not cookie-based — used by Health Auto Export webhook)
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.HEALTH_INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract date — try top-level `date`, then pull from first metric's data
  let dateStr: string | undefined = body.date as string | undefined;

  if (!dateStr) {
    // Health Auto Export format: { data: { metrics: [{ name, data: [{ date, qty }] }] } }
    const metrics = (body.data as Record<string, unknown>)?.metrics;
    if (Array.isArray(metrics)) {
      for (const m of metrics) {
        const firstEntry = m?.data?.[0];
        if (firstEntry?.date) {
          dateStr = firstEntry.date;
          break;
        }
      }
    }
  }

  if (!dateStr) {
    // Fall back to today if Health Auto Export sends no date at all
    const now = new Date();
    dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  // Normalize to midnight UTC
  const normalized = new Date(dateStr);
  normalized.setUTCHours(0, 0, 0, 0);

  // Use the field mapper to handle Health Auto Export's structured format
  const mapped = mapHealthPayload(body as Parameters<typeof mapHealthPayload>[0]);
  const { steps, calories, heartRate, sleep, data: extraData } = mapped;

  try {
    const snapshot = await prisma.healthSnapshot.upsert({
      where: { date: normalized },
      create: {
        date: normalized,
        ...(steps != null ? { steps } : {}),
        ...(calories != null ? { calories } : {}),
        ...(heartRate != null ? { heartRate } : {}),
        ...(sleep != null ? { sleep } : {}),
        data: extraData as Prisma.InputJsonValue,
      },
      update: {
        ...(steps != null ? { steps } : {}),
        ...(calories != null ? { calories } : {}),
        ...(heartRate != null ? { heartRate } : {}),
        ...(sleep != null ? { sleep } : {}),
        data: extraData as Prisma.InputJsonValue,
      },
    });

    // Auto-populate health-linked habit logs
    try {
      const healthHabits = await prisma.habit.findMany({
        where: { healthKey: { not: null }, archived: false },
      });

      for (const habit of healthHabits) {
        const value = getHealthValue(habit.healthKey!, snapshot, extraData as Record<string, unknown>);
        if (value === null) continue;

        await prisma.habitLog.upsert({
          where: {
            habitId_date: { habitId: habit.id, date: normalized },
          },
          create: {
            habitId: habit.id,
            date: normalized,
            completed: value >= habit.targetValue,
            value,
          },
          update: {
            completed: value >= habit.targetValue,
            value,
          },
        });
      }
    } catch (err) {
      console.error("[health/ingest] Auto-populate habits error:", err);
    }

    return NextResponse.json({ ingested: true, id: snapshot.id });
  } catch (err) {
    console.error("[health/ingest] Upsert error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
