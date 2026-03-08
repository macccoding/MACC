import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";

type CopilotTransaction = {
  id: string;
  date: string;
  name: string;
  amount: number;
  categoryId: string;
  accountId: string;
  isReviewed: boolean;
  type: string;
};

type SyncResult = {
  synced: number;
  newTransactions: number;
  error?: string;
};

// Cache category ID → name mapping
let categoryMap: Record<string, string> | null = null;

async function getCategoryMap(): Promise<Record<string, string>> {
  if (categoryMap) return categoryMap;
  try {
    const raw = execSync("copilot categories list --output json", {
      encoding: "utf-8",
      timeout: 15000,
    });
    const categories: { id: string; name: string }[] = JSON.parse(raw);
    categoryMap = {};
    for (const cat of categories) {
      categoryMap[cat.id] = cat.name;
    }
    return categoryMap;
  } catch {
    return {};
  }
}

export async function syncFromCopilot(pages = 4): Promise<SyncResult> {
  let raw: string;
  try {
    raw = execSync(
      `copilot transactions list --output json --limit 50 --pages ${pages} --sort date-desc`,
      { encoding: "utf-8", timeout: 30000 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("token") || message.includes("auth") || message.includes("401")) {
      return {
        synced: 0,
        newTransactions: 0,
        error: "Auth expired. Run `copilot auth set-token --token <token>` in terminal.",
      };
    }
    return { synced: 0, newTransactions: 0, error: message };
  }

  let transactions: CopilotTransaction[];
  try {
    const parsed = JSON.parse(raw);
    transactions = parsed.transactions ?? parsed;
  } catch {
    return {
      synced: 0,
      newTransactions: 0,
      error: "Failed to parse copilot CLI output",
    };
  }

  const catMap = await getCategoryMap();

  let newCount = 0;

  for (const tx of transactions) {
    const category = tx.categoryId ? (catMap[tx.categoryId] ?? "") : "";
    const result = await prisma.transaction.upsert({
      where: { externalId: tx.id },
      create: {
        externalId: tx.id,
        date: new Date(tx.date),
        name: tx.name,
        amount: tx.amount,
        category,
        account: tx.accountId ?? "",
        reviewed: tx.isReviewed ?? false,
      },
      update: {
        name: tx.name,
        amount: tx.amount,
        category,
        account: tx.accountId ?? "",
        reviewed: tx.isReviewed ?? false,
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
