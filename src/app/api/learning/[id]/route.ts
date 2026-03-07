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
    const track = await prisma.learningTrack.update({
      where: { id },
      data: {
        ...(typeof body.title === "string"
          ? { title: body.title.trim() }
          : {}),
        ...(typeof body.type === "string" ? { type: body.type } : {}),
        ...(typeof body.progress === "number"
          ? { progress: Math.min(100, Math.max(0, body.progress)) }
          : {}),
      },
    });

    return NextResponse.json(track);
  } catch (err) {
    console.error("[learning] Update error:", err);
    return NextResponse.json(
      { error: "Track not found or update failed" },
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
    await prisma.learningTrack.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[learning] Delete error:", err);
    return NextResponse.json(
      { error: "Track not found" },
      { status: 404 }
    );
  }
}
