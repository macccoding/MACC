import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function getMonthBounds(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const now = new Date();
    const { start: monthStart, end: monthEnd } = getMonthBounds(now);

    // Get allocations effective on or before today, deduplicate by category (latest wins)
    const allAllocations = await prisma.budgetAllocation.findMany({
      where: { effectiveFrom: { lte: now } },
      orderBy: { effectiveFrom: "desc" },
    });

    const seen = new Set<string>();
    const allocations = allAllocations.filter((a) => {
      if (seen.has(a.category)) return false;
      seen.add(a.category);
      return true;
    });

    // Get current month transactions
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    });

    // Group transactions by category and sum amounts (positive = expense)
    const spendingMap = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.amount > 0) {
        spendingMap.set(
          tx.category,
          (spendingMap.get(tx.category) || 0) + tx.amount
        );
      }
    }

    // Build per-category breakdown
    const spending = allocations.map((a) => {
      const spent = Math.round((spendingMap.get(a.category) || 0) * 100) / 100;
      const remaining = Math.round((a.amount - spent) * 100) / 100;
      const percentUsed = a.amount > 0 ? Math.round((spent / a.amount) * 1000) / 10 : 0;
      return {
        category: a.category,
        allocated: a.amount,
        spent,
        remaining,
        percentUsed,
      };
    });

    // Totals
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    const totalSpent = spending.reduce((sum, s) => sum + s.spent, 0);

    // Runway
    const daysLeft =
      Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalRemaining = Math.round((totalAllocated - totalSpent) * 100) / 100;
    const dailyAllowable =
      daysLeft > 0
        ? Math.round((totalRemaining / daysLeft) * 100) / 100
        : 0;

    return NextResponse.json({
      allocations,
      spending,
      runway: { daysLeft, totalRemaining, dailyAllowable },
      totalAllocated,
      totalSpent,
    });
  } catch (err) {
    console.error("[budget] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let allocations: { category: string; amount: number; percentage?: number }[];
  let effectiveFrom: Date;

  try {
    const body = await request.json();
    allocations = body.allocations;

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: "allocations array is required" },
        { status: 400 }
      );
    }

    // Default effectiveFrom to first of current month
    if (body.effectiveFrom) {
      effectiveFrom = new Date(body.effectiveFrom);
    } else {
      const now = new Date();
      effectiveFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    effectiveFrom.setHours(0, 0, 0, 0);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // Delete existing allocations with same effectiveFrom date
    await prisma.budgetAllocation.deleteMany({
      where: { effectiveFrom },
    });

    // Insert all new allocation rows
    const data = allocations.map((a) => ({
      category: a.category,
      amount: a.amount,
      percentage: a.percentage ?? null,
      effectiveFrom,
    }));

    await prisma.budgetAllocation.createMany({ data });

    // Return created rows
    const created = await prisma.budgetAllocation.findMany({
      where: { effectiveFrom },
      orderBy: { category: "asc" },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[budget] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
