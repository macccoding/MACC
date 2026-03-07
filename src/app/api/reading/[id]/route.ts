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

  try {
    const item = await prisma.readingItem.update({
      where: { id },
      data: {
        ...(typeof body.title === "string"
          ? { title: body.title.trim() }
          : {}),
        ...(typeof body.type === "string" ? { type: body.type } : {}),
        ...(typeof body.status === "string" ? { status: body.status } : {}),
        ...(typeof body.rating === "number"
          ? { rating: body.rating }
          : body.rating === null
            ? { rating: null }
            : {}),
        ...(typeof body.notes === "string"
          ? { notes: body.notes.trim() }
          : {}),
      },
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
