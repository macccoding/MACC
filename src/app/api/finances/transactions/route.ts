import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, amount, category, date } = body;

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: "name and amount are required" },
        { status: 400 }
      );
    }

    const txDate = date ? new Date(date) : new Date();
    const externalId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const transaction = await prisma.transaction.create({
      data: {
        externalId,
        name,
        amount: parseFloat(amount),
        category: category || "",
        date: txDate,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error("[finances] Transaction create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const category = searchParams.get("category");

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: since },
        ...(category ? { category } : {}),
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (err) {
    console.error("[finances] Transactions list error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
