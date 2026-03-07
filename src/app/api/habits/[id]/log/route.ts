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
  try {
    const body = await request.json();
    dateInput = body.date;
  } catch {
    // No body or invalid JSON — default to today
  }

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
      // Toggle off — delete the log
      await prisma.habitLog.delete({ where: { id: existing.id } });
      return NextResponse.json({ toggled: false });
    } else {
      // Toggle on — create the log
      const log = await prisma.habitLog.create({
        data: {
          habitId: id,
          date: logDate,
          completed: true,
        },
      });
      return NextResponse.json({ toggled: true, log });
    }
  } catch (err) {
    console.error("[habits] Toggle log error:", err);
    return NextResponse.json(
      { error: "Failed to toggle habit log" },
      { status: 500 }
    );
  }
}
