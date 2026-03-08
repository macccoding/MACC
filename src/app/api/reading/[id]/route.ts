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

  // Validate rating if provided
  if (body.rating !== undefined && body.rating !== null) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }
  }

  // Validate progress if provided
  if (body.progress !== undefined) {
    const progress = Number(body.progress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: "Progress must be between 0 and 100" },
        { status: 400 }
      );
    }
  }

  // Fetch current item for auto-set logic
  let currentItem;
  try {
    currentItem = await prisma.readingItem.findUnique({ where: { id } });
    if (!currentItem) {
      return NextResponse.json(
        { error: "Reading item not found" },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("[reading] Fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  // Auto-set startedAt/finishedAt on status transitions
  const newStatus = typeof body.status === "string" ? body.status : null;
  let autoStartedAt: Date | undefined;
  let autoFinishedAt: Date | undefined;

  if (newStatus === "reading" && !currentItem.startedAt && !body.startedAt) {
    autoStartedAt = new Date();
  }
  if (newStatus === "completed" && !currentItem.finishedAt && !body.finishedAt) {
    autoFinishedAt = new Date();
  }

  try {
    const item = await prisma.readingItem.update({
      where: { id },
      data: {
        ...(typeof body.title === "string"
          ? { title: body.title.trim() }
          : {}),
        ...(typeof body.type === "string" ? { type: body.type } : {}),
        ...(typeof body.status === "string" ? { status: body.status } : {}),
        ...(typeof body.author === "string"
          ? { author: body.author.trim() || null }
          : {}),
        ...(typeof body.coverUrl === "string"
          ? { coverUrl: body.coverUrl.trim() || null }
          : {}),
        ...(typeof body.format === "string" ? { format: body.format } : {}),
        ...(body.progress !== undefined
          ? { progress: Number(body.progress) }
          : {}),
        ...(typeof body.takeaway === "string"
          ? { takeaway: body.takeaway.trim() || null }
          : {}),
        ...(typeof body.rating === "number"
          ? { rating: body.rating }
          : body.rating === null
            ? { rating: null }
            : {}),
        ...(typeof body.notes === "string"
          ? { notes: body.notes.trim() }
          : {}),
        ...(typeof body.startedAt === "string"
          ? { startedAt: new Date(body.startedAt) }
          : autoStartedAt
            ? { startedAt: autoStartedAt }
            : {}),
        ...(typeof body.finishedAt === "string"
          ? { finishedAt: new Date(body.finishedAt) }
          : autoFinishedAt
            ? { finishedAt: autoFinishedAt }
            : {}),
      },
      include: { logs: true },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("[reading] Update error:", err);
    return NextResponse.json(
      { error: "Reading item not found or update failed" },
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
    await prisma.readingItem.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[reading] Delete error:", err);
    return NextResponse.json(
      { error: "Reading item not found" },
      { status: 404 }
    );
  }
}
