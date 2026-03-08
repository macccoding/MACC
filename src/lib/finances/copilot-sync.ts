import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";

type CopilotTransaction = {
  id: string;
  date: string;
  name: string;
  amount: number;
  category?: string;
  account?: string;
};

type SyncResult = {
  synced: number;
  newTransactions: number;
  error?: string;
};

export async function syncFromCopilot(days = 30): Promise<SyncResult> {
  let raw: string;
  try {
    raw = execSync(
      `copilot-money-cli transactions --format json --days ${days}`,
      { encoding: "utf-8", timeout: 30000 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("auth") || message.includes("token")) {
      return {
        synced: 0,
        newTransactions: 0,
        error: "Auth expired. Run `copilot-money-cli auth` in terminal.",
      };
    }
    return { synced: 0, newTransactions: 0, error: message };
  }

  let transactions: CopilotTransaction[];
  try {
    transactions = JSON.parse(raw);
  } catch {
    return {
      synced: 0,
      newTransactions: 0,
      error: "Failed to parse copilot-money-cli output",
    };
  }

  let newCount = 0;

  for (const tx of transactions) {
    const result = await prisma.transaction.upsert({
      where: { externalId: tx.id },
      create: {
        externalId: tx.id,
        date: new Date(tx.date),
        name: tx.name,
        amount: tx.amount,
        category: tx.category ?? "",
        account: tx.account ?? "",
      },
      update: {
        name: tx.name,
        amount: tx.amount,
        category: tx.category ?? "",
        account: tx.account ?? "",
      },
    });
    if (result.createdAt.getTime() > Date.now() - 5000) {
      newCount++;
    }
  }

  // Recalculate today's financial snapshot
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTx = await prisma.transaction.findMany({
    where: { date: { gte: thirtyDaysAgo } },
  });

  const income = recentTx
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = recentTx
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const byCategory: Record<string, number> = {};
  for (const tx of recentTx.filter((t) => t.amount < 0)) {
    const cat = tx.category || "uncategorized";
    byCategory[cat] = (byCategory[cat] ?? 0) + Math.abs(tx.amount);
  }

  await prisma.financialSnapshot.upsert({
    where: { date: today },
    create: {
      date: today,
      data: {
        income,
        expenses,
        byCategory,
        transactionCount: recentTx.length,
      },
    },
    update: {
      data: {
        income,
        expenses,
        byCategory,
        transactionCount: recentTx.length,
      },
    },
  });

  return { synced: transactions.length, newTransactions: newCount };
}
