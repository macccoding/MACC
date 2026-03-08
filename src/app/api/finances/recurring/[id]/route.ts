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

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.amount !== undefined) data.amount = parseFloat(body.amount);
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.category !== undefined) data.category = body.category || null;
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.nextDate !== undefined)
      data.nextDate = body.nextDate ? new Date(body.nextDate) : null;
    if (body.active !== undefined) data.active = body.active;

    const item = await prisma.recurringTransaction.update({
      where: { id },
      data,
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("[finances/recurring] Update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
    await prisma.recurringTransaction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[finances/recurring] Delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
