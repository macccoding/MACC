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

  let notes: string;
  let duration: number | undefined;

  try {
    const body = await request.json();
    notes = body.notes ?? "";
    duration =
      typeof body.duration === "number" ? body.duration : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const log = await prisma.learningLog.create({
      data: {
        trackId: id,
        notes: typeof notes === "string" ? notes.trim() : "",
        ...(duration !== undefined ? { duration } : {}),
      },
    });

    // Touch the track's updatedAt
    await prisma.learningTrack.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("[learning] Log error:", err);
    return NextResponse.json(
      { error: "Track not found or log failed" },
      { status: 404 }
    );
  }
}
