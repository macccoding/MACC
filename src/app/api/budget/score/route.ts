import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const latest = await prisma.budgetScore.findFirst({
      orderBy: { date: "desc" },
    });

    if (!latest) {
      return NextResponse.json({ score: 0, breakdown: {} });
    }

    return NextResponse.json(latest);
  } catch (err) {
    console.error("[budget/score] GET error:", err);
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
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // ── Get active allocations (latest per category) ──
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

    // ── Get current month transactions ──
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    });

    // ── Spending by category (positive amounts = expenses) ──
    const spendingMap = new Map<string, number>();
    let totalExpenses = 0;
    let totalIncome = 0;

    for (const tx of transactions) {
      if (tx.amount > 0) {
        totalExpenses += tx.amount;
        spendingMap.set(
          tx.category,
          (spendingMap.get(tx.category) || 0) + tx.amount
        );
      } else {
        // Negative amounts = income
        totalIncome += Math.abs(tx.amount);
      }
    }

    // ── Try to get income from FinancialSnapshot if no income transactions ──
    if (totalIncome === 0) {
      const snapshot = await prisma.financialSnapshot.findFirst({
        where: { date: { gte: monthStart, lte: monthEnd } },
        orderBy: { date: "desc" },
      });
      if (snapshot && typeof snapshot.data === "object" && snapshot.data !== null) {
        const data = snapshot.data as Record<string, unknown>;
        if (typeof data.income === "number" && data.income > 0) {
          totalIncome = data.income;
        }
      }
    }

    // ── 1. Allocation adherence (40 pts) ──
    let adherence = 0;
    if (allocations.length > 0) {
      let categoryScoresSum = 0;
      for (const a of allocations) {
        const spent = spendingMap.get(a.category) || 0;
        if (a.amount <= 0) {
          categoryScoresSum += spent === 0 ? 1 : 0;
        } else {
          const ratio = spent / a.amount;
          categoryScoresSum += ratio <= 1 ? 1 : Math.max(0, 2 - ratio);
        }
      }
      adherence =
        Math.round((categoryScoresSum / allocations.length) * 40 * 10) / 10;
    }

    // ── 2. Savings rate (30 pts) — targets 20% ──
    let savings = 0;
    if (totalIncome > 0) {
      const savingsRate = (totalIncome - totalExpenses) / totalIncome;
      savings = Math.round(Math.min(Math.max(savingsRate / 0.2, 0), 1) * 30 * 10) / 10;
    }

    // ── 3. Tracking consistency (30 pts) ──
    const daysWithTransactions = new Set<string>();
    for (const tx of transactions) {
      const d = new Date(tx.date);
      daysWithTransactions.add(
        `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      );
    }

    const daysElapsed = Math.max(
      1,
      Math.ceil(
        (now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const consistency =
      Math.round(
        (Math.min(daysWithTransactions.size / daysElapsed, 1)) * 30 * 10
      ) / 10;

    // ── Total score, clamped 0-100 ──
    const score = Math.round(
      Math.min(100, Math.max(0, adherence + savings + consistency))
    );

    const breakdown = {
      adherence: Math.round(adherence * 10) / 10,
      savings: Math.round(savings * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
    };

    // ── Upsert today's score ──
    const todayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const result = await prisma.budgetScore.upsert({
      where: { date: todayDate },
      create: { date: todayDate, score, breakdown },
      update: { score, breakdown },
    });

    return NextResponse.json({
      score: result.score,
      breakdown,
    });
  } catch (err) {
    console.error("[budget/score] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
