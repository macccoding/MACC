import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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

  try {
    const habit = await prisma.habit.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
        ...(typeof body.frequency === "string"
          ? { frequency: body.frequency }
          : {}),
        ...(typeof body.streakProtection === "boolean"
          ? { streakProtection: body.streakProtection }
          : {}),
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
