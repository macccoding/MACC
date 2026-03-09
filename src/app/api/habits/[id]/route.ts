import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const VALID_TYPES = ["daily", "frequency", "quantity", "negative", "timed"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate type if provided
  if (body.type !== undefined && !VALID_TYPES.includes(body.type as string)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const habit = await prisma.habit.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
        ...(typeof body.type === "string" ? { type: body.type } : {}),
        ...(typeof body.targetValue === "number" ? { targetValue: body.targetValue } : {}),
        ...(typeof body.frequencyPerPeriod === "number" ? { frequencyPerPeriod: body.frequencyPerPeriod } : {}),
        ...(typeof body.period === "string" ? { period: body.period } : {}),
        ...(typeof body.color === "string" ? { color: body.color } : {}),
        ...(typeof body.icon === "string" ? { icon: body.icon } : {}),
        ...(typeof body.sortOrder === "number" ? { sortOrder: body.sortOrder } : {}),
        ...(typeof body.archived === "boolean" ? { archived: body.archived } : {}),
        ...(typeof body.frequency === "string" ? { frequency: body.frequency } : {}),
        ...(typeof body.streakProtection === "boolean"
          ? { streakProtection: body.streakProtection }
          : {}),
        ...(typeof body.healthKey === "string" ? { healthKey: body.healthKey } : {}),
      },
    });

    return NextResponse.json(habit);
  } catch (err) {
    console.error("[habits] Update error:", err);
    return NextResponse.json(
      { error: "Habit not found or update failed" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[habits] Delete error:", err);
    return NextResponse.json(
      { error: "Habit not found" },
      { status: 404 }
    );
  }
}
