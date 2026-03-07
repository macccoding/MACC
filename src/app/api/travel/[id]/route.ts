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
    const item = await prisma.travelItem.update({
      where: { id },
      data: {
        ...(typeof body.title === "string"
          ? { title: body.title.trim() }
          : {}),
        ...(typeof body.category === "string" ? { category: body.category } : {}),
        ...(typeof body.status === "string" ? { status: body.status } : {}),
        ...(typeof body.budget === "number" ? { budget: body.budget } : {}),
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("[travel] Update error:", err);
    return NextResponse.json(
      { error: "Travel item not found or update failed" },
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
    await prisma.travelItem.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[travel] Delete error:", err);
    return NextResponse.json(
      { error: "Travel item not found" },
      { status: 404 }
    );
  }
}
