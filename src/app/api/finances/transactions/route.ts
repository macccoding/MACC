import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
