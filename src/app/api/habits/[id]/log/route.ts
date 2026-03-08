import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let dateInput: string | undefined;
  let value: number | undefined;
  let skipped: boolean | undefined;
  let note: string | undefined;

  try {
    const body = await request.json();
    dateInput = body.date;
    if (typeof body.value === "number") value = body.value;
    if (typeof body.skipped === "boolean") skipped = body.skipped;
    if (typeof body.note === "string") note = body.note;
  } catch {
    // No body or invalid JSON — default to today with no extras
  }

  const hasExtras =
    value !== undefined || skipped !== undefined || note !== undefined;

  // Parse date, default to today
  const logDate = dateInput ? new Date(dateInput) : new Date();
  logDate.setHours(0, 0, 0, 0);

  try {
    // Check if log exists for this habit + date
    const existing = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId: id,
          date: logDate,
        },
      },
    });

    if (existing) {
      if (hasExtras) {
        // Check if any provided field is actually different
        const updates: Record<string, unknown> = {};
        if (value !== undefined && value !== existing.value) updates.value = value;
        if (skipped !== undefined && skipped !== existing.skipped) {
          updates.skipped = skipped;
          updates.completed = !skipped;
        }
        if (note !== undefined && note !== existing.note) updates.note = note;

        if (Object.keys(updates).length > 0) {
          const updated = await prisma.habitLog.update({
            where: { id: existing.id },
            data: updates,
          });
          return NextResponse.json({ toggled: true, log: updated });
        }

        // All fields same — treat as no-op, return current
        return NextResponse.json({ toggled: true, log: existing });
      }

      // No extras — simple toggle off (delete)
      await prisma.habitLog.delete({ where: { id: existing.id } });
      return NextResponse.json({ toggled: false });
    }

    // No existing log — create one
    const completed = skipped ? false : true;
    const log = await prisma.habitLog.create({
      data: {
        habitId: id,
        date: logDate,
        completed,
        value: value ?? 1,
        skipped: skipped ?? false,
        ...(note ? { note } : {}),
      },
    });

    return NextResponse.json({ toggled: true, log });
  } catch (err) {
    console.error("[habits] Toggle log error:", err);
    return NextResponse.json(
      { error: "Failed to toggle habit log" },
      { status: 500 }
    );
  }
}
