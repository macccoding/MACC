import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const days = parseInt(
    request.nextUrl.searchParams.get("days") || "30",
    10
  );
  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const sessions = await prisma.focusSession.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (err) {
    console.error("[focus] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

  const { type, durationMinutes, label, goalId, learningTrackId } = body as {
    type?: string;
    durationMinutes?: number;
    label?: string;
    goalId?: string;
    learningTrackId?: string;
  };

  if (typeof durationMinutes !== "number" || durationMinutes <= 0) {
    return NextResponse.json(
      { error: "durationMinutes must be a positive number" },
      { status: 400 }
    );
  }

  try {
    const session = await prisma.focusSession.create({
      data: {
        type: type || "pomodoro",
        durationMinutes,
        status: "active",
        ...(label ? { label } : {}),
        ...(goalId ? { goalId } : {}),
        ...(learningTrackId ? { learningTrackId } : {}),
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[focus] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status, actualMinutes } = body as {
    id?: string;
    status?: string;
    actualMinutes?: number;
  };

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  if (status !== "completed" && status !== "cancelled") {
    return NextResponse.json(
      { error: 'status must be "completed" or "cancelled"' },
      { status: 400 }
    );
  }

  try {
    const session = await prisma.focusSession.update({
      where: { id },
      data: {
        status,
        endedAt: new Date(),
        ...(typeof actualMinutes === "number" ? { actualMinutes } : {}),
      },
    });

    return NextResponse.json(session);
  } catch (err) {
    console.error("[focus] Update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
