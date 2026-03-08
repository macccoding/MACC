import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const items = await prisma.recurringTransaction.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[finances/recurring] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, amount, currency, category, frequency, nextDate, active } =
      body;

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: "name and amount are required" },
        { status: 400 }
      );
    }

    const item = await prisma.recurringTransaction.create({
      data: {
        name,
        amount: parseFloat(amount),
        currency: currency || "USD",
        category: category || null,
        frequency: frequency || "monthly",
        nextDate: nextDate ? new Date(nextDate) : null,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[finances/recurring] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
