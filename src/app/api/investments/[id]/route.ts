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
    const investment = await prisma.investment.update({
      where: { id },
      data: {
        ...(typeof body.symbol === "string"
          ? { symbol: body.symbol.trim().toUpperCase() }
          : {}),
        ...(typeof body.thesis === "string"
          ? { thesis: body.thesis.trim() }
          : {}),
        ...(typeof body.entryPrice === "number"
          ? { entryPrice: body.entryPrice }
          : {}),
        ...(typeof body.currentPrice === "number"
          ? { currentPrice: body.currentPrice }
          : {}),
      },
    });

    return NextResponse.json(investment);
  } catch (err) {
    console.error("[investments] Update error:", err);
    return NextResponse.json(
      { error: "Investment not found or update failed" },
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
    await prisma.investment.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[investments] Delete error:", err);
    return NextResponse.json(
      { error: "Investment not found" },
      { status: 404 }
    );
  }
}
