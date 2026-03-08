import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const investments = await prisma.investment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json(investments);
  } catch (err) {
    console.error("[investments] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let symbol: string;
  let thesis: string | undefined;
  let entryPrice: number | undefined;
  let currentPrice: number | undefined;
  let quantity: number | undefined;
  let assetType: string | undefined;

  try {
    const body = await request.json();
    symbol = body.symbol;
    thesis = body.thesis;
    entryPrice = body.entryPrice;
    currentPrice = body.currentPrice;
    quantity = body.quantity;
    assetType = body.assetType;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate symbol
  if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
    return NextResponse.json(
      { error: "Symbol is required" },
      { status: 400 }
    );
  }

  try {
    const investment = await prisma.investment.create({
      data: {
        symbol: symbol.trim().toUpperCase(),
        ...(thesis ? { thesis: thesis.trim() } : {}),
        ...(typeof entryPrice === "number" ? { entryPrice } : {}),
        ...(typeof currentPrice === "number" ? { currentPrice } : {}),
        ...(typeof quantity === "number" ? { quantity } : {}),
        ...(assetType ? { assetType } : {}),
      },
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (err) {
    console.error("[investments] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
