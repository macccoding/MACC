# Dashboard Wiring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire every MikeOS dashboard module to real data sources, build missing pages (Email, Captures, Knowledge Graph), make Kemi context-aware and proactive, and turn the dashboard home into a live command center with AI briefings.

**Architecture:** External data flows through ingest APIs into Prisma/PostgreSQL, then surfaces via dashboard UI. Kemi reads all data sources via Claude tool_use pattern. Kioku knowledge graph indexes entities from all content asynchronously.

**Tech Stack:** Next.js 16 (App Router), Prisma 7 (PrismaPg adapter), PostgreSQL + pgvector, Anthropic SDK (Claude tool_use), yahoo-finance2, googleapis (Gmail), copilot-money-cli, Framer Motion, Tailwind CSS v4

**Design Doc:** `docs/plans/2026-03-07-dashboard-wiring-design.md`

---

## Important Patterns

Before implementing, understand these project conventions:

**Auth:** Every API route starts with `const authError = requireAuth(request); if (authError) return authError;` — import from `@/lib/auth`.

**Prisma:** Import from `@/lib/prisma` (singleton). Generated client at `@/generated/prisma/client`. Next.js 16: `await params` in dynamic routes.

**Error handling:** Try-catch, `console.error("[module] Op error:", err)`, return `{ error: "..." }` with status codes (201 create, 400 bad input, 401 unauth, 404 not found, 500 server).

**UI:** `"use client"` pages. `useCallback` for fetch functions. Framer Motion with ease `[0.22, 1, 0.36, 1]`. Tailwind: `bg-parchment-warm/40`, `border-sumi-gray/20`, `text-vermillion`, `font-mono tracking-[0.12em] uppercase` for labels. CSS vars: `--text-heading`, `--text-body`, `--text-micro`.

**Optional fields:** Use spread: `...(typeof body.field === "string" ? { field: body.field } : {})`.

---

## Workstream 1: Investments (Tasks 1–3)

### Task 1: Investment Schema Migration

**Files:**
- Modify: `prisma/schema.prisma` (Investment model, lines 123–135)

**Step 1: Add new fields to Investment model**

Open `prisma/schema.prisma` and update the Investment model:

```prisma
model Investment {
  id           String    @id @default(cuid())
  symbol       String
  thesis       String    @default("")
  entryPrice   Float?
  currentPrice Float?
  quantity     Float?
  assetType    String    @default("stock")
  costBasis    Float?
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  notes InvestmentNote[]

  @@map("investments")
}
```

New fields: `quantity`, `assetType`, `costBasis`, `lastSyncedAt`.

**Step 2: Generate and apply migration**

```bash
cd /Users/mac/prod/Me.io
npx prisma migrate dev --name add-investment-portfolio-fields
```

Expected: Migration creates, Prisma client regenerates. Existing data unaffected (all new fields are nullable or have defaults).

**Step 3: Verify schema**

```bash
npx prisma db pull --print | grep -A 15 "investments"
```

Expected: New columns visible.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(investments): add quantity, assetType, costBasis, lastSyncedAt fields"
```

---

### Task 2: Price Sync Library + API Routes

**Files:**
- Create: `src/lib/investments/price-sync.ts`
- Create: `src/app/api/investments/sync/route.ts`
- Create: `src/app/api/investments/quote/route.ts`

**Step 1: Install yahoo-finance2**

```bash
cd /Users/mac/prod/Me.io
npm install yahoo-finance2
```

**Step 2: Create price sync library**

Create `src/lib/investments/price-sync.ts`:

```typescript
import yahooFinance from "yahoo-finance2";
import { prisma } from "@/lib/prisma";

type SyncResult = {
  updated: number;
  errors: string[];
};

export async function syncAllPrices(): Promise<SyncResult> {
  const investments = await prisma.investment.findMany();
  const errors: string[] = [];
  let updated = 0;

  const stocks = investments.filter((i) => i.assetType !== "crypto");
  const cryptos = investments.filter((i) => i.assetType === "crypto");

  // Batch fetch stock/ETF quotes
  if (stocks.length > 0) {
    const symbols = stocks.map((s) => s.symbol);
    try {
      const quotes = await yahooFinance.quote(symbols);
      const quoteMap = new Map(
        (Array.isArray(quotes) ? quotes : [quotes]).map((q) => [
          q.symbol,
          q.regularMarketPrice ?? null,
        ])
      );

      for (const stock of stocks) {
        const price = quoteMap.get(stock.symbol);
        if (price !== null && price !== undefined) {
          await prisma.investment.update({
            where: { id: stock.id },
            data: { currentPrice: price, lastSyncedAt: new Date() },
          });
          updated++;
        } else {
          errors.push(`No price for ${stock.symbol}`);
        }
      }
    } catch (err) {
      errors.push(`Yahoo Finance error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Fetch crypto prices from CoinGecko
  if (cryptos.length > 0) {
    const ids = cryptos.map((c) => c.symbol.toLowerCase()).join(",");
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data = await res.json();

      for (const crypto of cryptos) {
        const key = crypto.symbol.toLowerCase();
        const price = data[key]?.usd;
        if (price !== undefined) {
          await prisma.investment.update({
            where: { id: crypto.id },
            data: { currentPrice: price, lastSyncedAt: new Date() },
          });
          updated++;
        } else {
          errors.push(`No price for ${crypto.symbol}`);
        }
      }
    } catch (err) {
      errors.push(`CoinGecko error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { updated, errors };
}

export async function getQuote(
  symbol: string,
  type: string
): Promise<{ price: number | null; error?: string }> {
  if (type === "crypto") {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
      );
      if (!res.ok) return { price: null, error: `CoinGecko ${res.status}` };
      const data = await res.json();
      const price = data[symbol.toLowerCase()]?.usd ?? null;
      return { price };
    } catch (err) {
      return { price: null, error: err instanceof Error ? err.message : String(err) };
    }
  }

  try {
    const quote = await yahooFinance.quote(symbol.toUpperCase());
    return { price: quote.regularMarketPrice ?? null };
  } catch (err) {
    return { price: null, error: err instanceof Error ? err.message : String(err) };
  }
}
```

**Step 3: Create sync API route**

Create `src/app/api/investments/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { syncAllPrices } from "@/lib/investments/price-sync";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const result = await syncAllPrices();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[investments] Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 4: Create quote API route**

Create `src/app/api/investments/quote/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getQuote } from "@/lib/investments/price-sync";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type") || "stock";

  if (!symbol) {
    return NextResponse.json(
      { error: "symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    const result = await getQuote(symbol, type);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[investments] Quote error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 5: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no type errors.

**Step 6: Commit**

```bash
git add src/lib/investments/ src/app/api/investments/sync/ src/app/api/investments/quote/
git commit -m "feat(investments): add price sync library + sync/quote API routes"
```

---

### Task 3: Investments UI Overhaul

**Files:**
- Modify: `src/app/(dashboard)/dashboard/investments/page.tsx`

**Step 1: Update the Investment type and add portfolio state**

At the top of the file, update the type and add new state/constants:

```typescript
type Investment = {
  id: string;
  symbol: string;
  thesis: string;
  entryPrice: number | null;
  currentPrice: number | null;
  quantity: number | null;
  assetType: string;
  costBasis: number | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: InvestmentNote[];
};

const ASSET_TYPES = ["stock", "etf", "crypto"] as const;

const ASSET_TYPE_COLORS: Record<string, string> = {
  stock: "text-blue-400 bg-blue-400/10",
  etf: "text-green-400 bg-green-400/10",
  crypto: "text-amber-400 bg-amber-400/10",
};
```

**Step 2: Add sync state and functions**

Inside the component, add:

```typescript
const [syncing, setSyncing] = useState(false);
const [newQuantity, setNewQuantity] = useState("");
const [newAssetType, setNewAssetType] = useState<string>("stock");

async function syncPrices() {
  setSyncing(true);
  try {
    const res = await fetch("/api/investments/sync", { method: "POST" });
    if (res.ok) fetchInvestments();
  } catch (err) {
    console.error("Failed to sync prices:", err);
  } finally {
    setSyncing(false);
  }
}
```

**Step 3: Update the add form**

Update the form to include quantity and asset type fields. Add `newQuantity` and `newAssetType` to the POST body:

```typescript
body: JSON.stringify({
  symbol: newSymbol.trim().toUpperCase(),
  ...(newEntryPrice ? { entryPrice: parseFloat(newEntryPrice) } : {}),
  ...(newQuantity ? { quantity: parseFloat(newQuantity) } : {}),
  assetType: newAssetType,
}),
```

Add a quantity input and asset type select alongside the existing fields, wrapped in `flex-wrap` for mobile.

**Step 4: Add portfolio summary card**

Before the investment cards list, add a portfolio summary:

```tsx
{/* Portfolio Summary */}
{investments.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-5"
  >
    <div className="flex items-center justify-between mb-3">
      <h2
        className="text-ink-black font-light"
        style={{ fontSize: "var(--text-body)" }}
      >
        Portfolio
      </h2>
      <div className="flex items-center gap-3">
        {investments[0]?.lastSyncedAt && (
          <span
            className="font-mono tracking-[0.08em] text-sumi-gray-light"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Synced {new Date(investments[0].lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <button
          onClick={syncPrices}
          disabled={syncing}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-lg px-3 py-1 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 transition-all duration-300 disabled:opacity-30"
          style={{ fontSize: "var(--text-micro)" }}
        >
          {syncing ? "Syncing..." : "Refresh"}
        </button>
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {(() => {
        const totalValue = investments.reduce(
          (sum, inv) => sum + (inv.currentPrice ?? 0) * (inv.quantity ?? 0),
          0
        );
        const totalCost = investments.reduce(
          (sum, inv) => sum + (inv.costBasis ?? (inv.entryPrice ?? 0) * (inv.quantity ?? 0)),
          0
        );
        const totalPL = totalValue - totalCost;
        const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

        return (
          <>
            <div>
              <p className="font-mono tracking-[0.08em] text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>Total Value</p>
              <p className="text-ink-black font-light text-lg">${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="font-mono tracking-[0.08em] text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>Total Cost</p>
              <p className="text-ink-black font-light text-lg">${totalCost.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="font-mono tracking-[0.08em] text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>P&L</p>
              <p className={`font-light text-lg ${totalPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalPL >= 0 ? "+" : ""}${totalPL.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="font-mono tracking-[0.08em] text-sumi-gray-light" style={{ fontSize: "var(--text-micro)" }}>Return</p>
              <p className={`font-light text-lg ${totalPLPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalPLPct >= 0 ? "+" : ""}{totalPLPct.toFixed(2)}%
              </p>
            </div>
          </>
        );
      })()}
    </div>
  </motion.div>
)}
```

**Step 5: Update per-investment card**

Each card should show: asset type badge, quantity, cost basis, current value, P&L. Add asset type badge next to symbol. Show quantity and value data below the symbol/thesis area.

```tsx
{/* Per-position data */}
{(item.quantity || item.currentPrice) && (
  <div className="flex items-center gap-4 mt-2 flex-wrap">
    {item.quantity && (
      <span className="font-mono tracking-[0.08em] text-sumi-gray" style={{ fontSize: "var(--text-micro)" }}>
        {item.quantity} shares
      </span>
    )}
    {item.currentPrice && item.quantity && (
      <span className="font-mono tracking-[0.08em] text-sumi-gray" style={{ fontSize: "var(--text-micro)" }}>
        ${(item.currentPrice * item.quantity).toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </span>
    )}
    {item.entryPrice && item.currentPrice && (
      <span
        className={`font-mono tracking-[0.08em] ${
          item.currentPrice >= item.entryPrice ? "text-green-400" : "text-red-400"
        }`}
        style={{ fontSize: "var(--text-micro)" }}
      >
        {item.currentPrice >= item.entryPrice ? "+" : ""}
        {(((item.currentPrice - item.entryPrice) / item.entryPrice) * 100).toFixed(2)}%
      </span>
    )}
  </div>
)}
```

**Step 6: Update the add investment POST handler**

Update `addInvestment` to include the new fields and the PATCH handler to accept them.

**Step 7: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 8: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/investments/page.tsx
git commit -m "feat(investments): add portfolio summary, P&L, quantity, sync button to UI"
```

---

## Workstream 2: Finances (Tasks 4–6)

### Task 4: Transaction Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Transaction model**

Add after FinancialSnapshot model:

```prisma
model Transaction {
  id         String   @id @default(cuid())
  externalId String   @unique
  date       DateTime
  name       String
  amount     Float
  category   String   @default("")
  account    String   @default("")
  reviewed   Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@map("transactions")
}
```

**Step 2: Generate and apply migration**

```bash
cd /Users/mac/prod/Me.io
npx prisma migrate dev --name add-transaction-model
```

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(finances): add Transaction model for copilot-money integration"
```

---

### Task 5: Copilot Money Sync Library + API Routes

**Files:**
- Create: `src/lib/finances/copilot-sync.ts`
- Create: `src/app/api/finances/sync/route.ts`
- Create: `src/app/api/finances/transactions/route.ts`

**Step 1: Create copilot sync library**

Create `src/lib/finances/copilot-sync.ts`:

```typescript
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
      return { synced: 0, newTransactions: 0, error: "Auth expired. Run `copilot-money-cli auth` in terminal." };
    }
    return { synced: 0, newTransactions: 0, error: message };
  }

  let transactions: CopilotTransaction[];
  try {
    transactions = JSON.parse(raw);
  } catch {
    return { synced: 0, newTransactions: 0, error: "Failed to parse copilot-money-cli output" };
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
      data: { income, expenses, byCategory, transactionCount: recentTx.length },
    },
    update: {
      data: { income, expenses, byCategory, transactionCount: recentTx.length },
    },
  });

  return { synced: transactions.length, newTransactions: newCount };
}
```

**Step 2: Create sync API route**

Create `src/app/api/finances/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { syncFromCopilot } from "@/lib/finances/copilot-sync";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const result = await syncFromCopilot(days);

    if (result.error) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[finances] Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Create transactions API route**

Create `src/app/api/finances/transactions/route.ts`:

```typescript
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
```

**Step 4: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/lib/finances/ src/app/api/finances/sync/ src/app/api/finances/transactions/
git commit -m "feat(finances): add copilot-money sync library + transactions API"
```

---

### Task 6: Finances UI Overhaul

**Files:**
- Modify: `src/app/(dashboard)/dashboard/finances/page.tsx`

**Step 1: Add transaction types and state**

```typescript
type Transaction = {
  id: string;
  externalId: string;
  date: string;
  name: string;
  amount: number;
  category: string;
  account: string;
  reviewed: boolean;
};
```

Add state for: `transactions`, `syncing`, `categoryFilter`, `lastSynced`.

**Step 2: Add transactions fetch**

```typescript
const fetchTransactions = useCallback(async () => {
  try {
    const res = await fetch(
      `/api/finances/transactions?days=30${categoryFilter ? `&category=${categoryFilter}` : ""}`
    );
    if (res.ok) {
      const data = await res.json();
      setTransactions(data);
    }
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
  }
}, [categoryFilter]);
```

**Step 3: Add sync function**

```typescript
async function syncFinances() {
  setSyncing(true);
  try {
    const res = await fetch("/api/finances/sync", { method: "POST" });
    const data = await res.json();
    if (data.error) {
      setSyncError(data.error);
    } else {
      setLastSynced(new Date());
      fetchTransactions();
    }
  } catch (err) {
    console.error("Failed to sync finances:", err);
  } finally {
    setSyncing(false);
  }
}
```

**Step 4: Build the UI**

Keep the existing metrics grid (netWorth, debt, savings, income, burn from FinancialSnapshot data). Add below it:
- Sync button + "last synced" indicator
- Category filter pills (derived from unique categories in transactions)
- Transactions list: date, merchant name, amount (green for income, red for expense), category badge, account
- Spending by category breakdown (simple bar chart using div widths)

Follow the existing card pattern: `bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4`.

**Step 5: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/finances/page.tsx
git commit -m "feat(finances): add transactions list, category filters, sync button"
```

---

## Workstream 3: Health Ingest (Tasks 7–8)

### Task 7: Health Ingest Webhook

**Files:**
- Create: `src/lib/health/ingest-mapper.ts`
- Modify: `src/app/api/health/route.ts` (add POST handler for webhook)

**Step 1: Create field mapper**

Create `src/lib/health/ingest-mapper.ts`:

```typescript
type HealthAutoExportPayload = {
  data?: {
    metrics?: Array<{
      name: string;
      data?: Array<{
        qty?: number;
        date?: string;
      }>;
    }>;
  };
  [key: string]: unknown;
};

type MappedHealth = {
  steps: number | null;
  calories: number | null;
  heartRate: number | null;
  sleep: number | null;
  data: {
    distance?: number;
    exerciseMinutes?: number;
    standHours?: number;
  };
};

const FIELD_MAP: Record<string, string> = {
  step_count: "steps",
  steps: "steps",
  active_energy: "calories",
  activeCalories: "calories",
  active_calories: "calories",
  resting_heart_rate: "heartRate",
  restingHeartRate: "heartRate",
  sleep_analysis: "sleep",
  sleepHours: "sleep",
  sleep_hours: "sleep",
  walking_running_distance: "data.distance",
  distanceWalking: "data.distance",
  distance_walking: "data.distance",
  exercise_time: "data.exerciseMinutes",
  exerciseMinutes: "data.exerciseMinutes",
  exercise_minutes: "data.exerciseMinutes",
  stand_hour: "data.standHours",
  standHours: "data.standHours",
  stand_hours: "data.standHours",
};

export function mapHealthPayload(payload: HealthAutoExportPayload): MappedHealth {
  const result: MappedHealth = {
    steps: null,
    calories: null,
    heartRate: null,
    sleep: null,
    data: {},
  };

  // Handle structured metrics array (Health Auto Export format)
  if (payload.data?.metrics && Array.isArray(payload.data.metrics)) {
    for (const metric of payload.data.metrics) {
      const target = FIELD_MAP[metric.name];
      if (!target) continue;
      const value = metric.data?.[0]?.qty ?? null;
      if (value === null) continue;
      setMappedValue(result, target, value);
    }
    return result;
  }

  // Handle flat key-value format
  for (const [key, value] of Object.entries(payload)) {
    const target = FIELD_MAP[key];
    if (!target || typeof value !== "number") continue;
    setMappedValue(result, target, value);
  }

  return result;
}

function setMappedValue(result: MappedHealth, target: string, value: number) {
  if (target.startsWith("data.")) {
    const dataKey = target.slice(5) as keyof MappedHealth["data"];
    result.data[dataKey] = value;
  } else {
    const key = target as keyof Omit<MappedHealth, "data">;
    if (key === "steps" || key === "calories" || key === "heartRate") {
      (result as Record<string, unknown>)[key] = Math.round(value);
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }
}
```

**Step 2: Add webhook POST handler to health route**

Modify `src/app/api/health/route.ts`. Add an alternative auth check for the webhook — if the `x-api-key` header matches `HEALTH_INGEST_KEY` env var, bypass session auth:

```typescript
import { mapHealthPayload } from "@/lib/health/ingest-mapper";

// Add to existing file — new POST handler for Health Auto Export webhook
export async function POST(request: NextRequest) {
  // Webhook auth: x-api-key header OR session cookie
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.HEALTH_INGEST_KEY;

  if (apiKey && expectedKey && apiKey === expectedKey) {
    // Webhook auth passed
  } else {
    const authError = requireAuth(request);
    if (authError) return authError;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mapped = mapHealthPayload(body);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const snapshot = await prisma.healthSnapshot.upsert({
      where: { date: today },
      create: {
        date: today,
        steps: mapped.steps,
        calories: mapped.calories,
        heartRate: mapped.heartRate,
        sleep: mapped.sleep,
        data: mapped.data,
      },
      update: {
        ...(mapped.steps !== null ? { steps: mapped.steps } : {}),
        ...(mapped.calories !== null ? { calories: mapped.calories } : {}),
        ...(mapped.heartRate !== null ? { heartRate: mapped.heartRate } : {}),
        ...(mapped.sleep !== null ? { sleep: mapped.sleep } : {}),
        ...(Object.keys(mapped.data).length > 0 ? { data: mapped.data } : {}),
      },
    });
    return NextResponse.json(snapshot, { status: 201 });
  } catch (err) {
    console.error("[health] Ingest error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/lib/health/ src/app/api/health/
git commit -m "feat(health): add Health Auto Export webhook with field mapper"
```

---

### Task 8: Health UI Expansion

**Files:**
- Modify: `src/app/(dashboard)/dashboard/health/page.tsx`

**Step 1: Expand the metrics grid**

Add new data points from `HealthSnapshot.data` JSON field:
- Exercise Minutes
- Distance (walking)
- Stand Hours

Parse `data` from the snapshot response. Display alongside existing steps, calories, heartRate, sleep.

**Step 2: Add "last synced" indicator**

Show when the most recent snapshot was created. If no data today, show "Waiting for Health Auto Export..."

**Step 3: Expand 7-day charts**

For each new metric (exerciseMinutes, distance, standHours), add a simple bar chart row matching the existing chart pattern for steps/calories/sleep/heartRate.

**Step 4: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/health/page.tsx
git commit -m "feat(health): add exercise, distance, stand hours to metrics grid"
```

---

## Workstream 4: Email Module (Tasks 9–11)

### Task 9: EmailCache Schema Expansion

**Files:**
- Modify: `prisma/schema.prisma` (EmailCache model, lines 247–258)

**Step 1: Add new fields to EmailCache**

```prisma
model EmailCache {
  id        String   @id @default(cuid())
  gmailId   String   @unique
  subject   String
  sender    String
  category  String   @default("")
  summary   String   @default("")
  snippet   String   @default("")
  date      DateTime @default(now())
  isRead    Boolean  @default(false)
  isStarred Boolean  @default(false)
  labels    String[] @default([])
  body      String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("email_cache")
}
```

**Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name expand-email-cache-fields
```

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(email): expand EmailCache with date, isRead, isStarred, labels, body, snippet"
```

---

### Task 10: Gmail Sync Library + API Routes

**Files:**
- Create: `src/lib/email/gmail-sync.ts`
- Create: `src/lib/email/gmail-client.ts`
- Create: `src/app/api/email/sync/route.ts`
- Modify: `src/app/api/email/route.ts` (if exists) or create it
- Create: `src/app/api/email/digest/route.ts`

**Step 1: Install googleapis**

```bash
npm install googleapis
```

**Step 2: Create Gmail client wrapper**

Create `src/lib/email/gmail-client.ts`:

```typescript
import { google } from "googleapis";

export function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}
```

**Step 3: Create Gmail sync library**

Create `src/lib/email/gmail-sync.ts`:

```typescript
import { getGmailClient } from "./gmail-client";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

type SyncResult = {
  synced: number;
  newEmails: number;
  error?: string;
};

const anthropic = new Anthropic();

async function categorizeEmail(
  subject: string,
  sender: string,
  snippet: string
): Promise<{ category: string; summary: string }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Categorize this email and write a 1-sentence summary.

Subject: ${subject}
From: ${sender}
Preview: ${snippet}

Categories: important, action_needed, fyi, newsletter, receipt, spam

Respond as JSON: {"category": "...", "summary": "..."}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    return {
      category: parsed.category || "fyi",
      summary: parsed.summary || "",
    };
  } catch {
    return { category: "fyi", summary: "" };
  }
}

function decodeHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export async function syncGmail(): Promise<SyncResult> {
  const gmail = getGmailClient();
  let newEmails = 0;

  try {
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: "newer_than:2d",
      maxResults: 50,
    });

    const messageIds = listRes.data.messages ?? [];

    for (const msg of messageIds) {
      if (!msg.id) continue;

      // Check if already cached
      const existing = await prisma.emailCache.findUnique({
        where: { gmailId: msg.id },
      });

      if (existing) {
        // Update read/starred status
        const fullMsg = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "metadata",
          metadataHeaders: [],
        });
        const labels = fullMsg.data.labelIds ?? [];
        await prisma.emailCache.update({
          where: { gmailId: msg.id },
          data: {
            isRead: !labels.includes("UNREAD"),
            isStarred: labels.includes("STARRED"),
            labels,
          },
        });
        continue;
      }

      // Fetch full message
      const fullMsg = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = fullMsg.data.payload?.headers ?? [];
      const subject = decodeHeader(headers, "Subject");
      const sender = decodeHeader(headers, "From");
      const dateStr = decodeHeader(headers, "Date");
      const snippet = fullMsg.data.snippet ?? "";
      const labels = fullMsg.data.labelIds ?? [];

      // Extract body (prefer plain text)
      let body = "";
      const payload = fullMsg.data.payload;
      if (payload?.body?.data) {
        body = Buffer.from(payload.body.data, "base64url").toString("utf-8");
      } else if (payload?.parts) {
        const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64url").toString("utf-8");
        }
      }

      // AI categorize
      const { category, summary } = await categorizeEmail(
        subject,
        sender,
        snippet
      );

      await prisma.emailCache.create({
        data: {
          gmailId: msg.id,
          subject,
          sender,
          snippet,
          date: dateStr ? new Date(dateStr) : new Date(),
          isRead: !labels.includes("UNREAD"),
          isStarred: labels.includes("STARRED"),
          labels,
          body: body.slice(0, 5000), // Cap body length
          category,
          summary,
        },
      });
      newEmails++;
    }

    return { synced: messageIds.length, newEmails };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { synced: 0, newEmails: 0, error: message };
  }
}

export async function generateDigest(): Promise<string> {
  const recent = await prisma.emailCache.findMany({
    where: {
      date: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    orderBy: { date: "desc" },
    take: 30,
  });

  if (recent.length === 0) return "No recent emails to summarize.";

  const unread = recent.filter((e) => !e.isRead);
  const actionNeeded = recent.filter((e) => e.category === "action_needed");

  const emailList = recent
    .slice(0, 20)
    .map(
      (e) =>
        `- [${e.category}] ${e.sender}: "${e.subject}" — ${e.summary || e.snippet.slice(0, 80)}`
    )
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Summarize Mike's email inbox. ${unread.length} unread, ${actionNeeded.length} need action.

Recent emails:
${emailList}

Write a brief digest (3-5 bullets). Lead with what needs attention. Be direct, not verbose.`,
        },
      ],
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "Could not generate digest.";
  } catch {
    return "Digest generation failed. Check API key.";
  }
}
```

**Step 4: Create email sync API route**

Create `src/app/api/email/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { syncGmail } from "@/lib/email/gmail-sync";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const result = await syncGmail();
    if (result.error) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[email] Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 5: Create email list API route**

Create or replace `src/app/api/email/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const unread = searchParams.get("unread");

  try {
    const emails = await prisma.emailCache.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(unread === "true" ? { isRead: false } : {}),
      },
      orderBy: { date: "desc" },
      take: 50,
    });
    return NextResponse.json(emails);
  } catch (err) {
    console.error("[email] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 6: Create digest API route**

Create `src/app/api/email/digest/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateDigest } from "@/lib/email/gmail-sync";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const digest = await generateDigest();
    return NextResponse.json({ digest });
  } catch (err) {
    console.error("[email] Digest error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 7: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 8: Commit**

```bash
git add src/lib/email/ src/app/api/email/
git commit -m "feat(email): add Gmail sync, categorization, digest generation"
```

---

### Task 11: Email Page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/email/page.tsx`

**Step 1: Replace placeholder with full email page**

Replace the entire file with a full email triage page:

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Email = {
  id: string;
  gmailId: string;
  subject: string;
  sender: string;
  category: string;
  summary: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
};

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Important", value: "important" },
  { label: "Action", value: "action_needed" },
  { label: "FYI", value: "fyi" },
  { label: "Newsletter", value: "newsletter" },
  { label: "Receipt", value: "receipt" },
];

const CATEGORY_COLORS: Record<string, string> = {
  important: "text-red-400 bg-red-400/10",
  action_needed: "text-amber-400 bg-amber-400/10",
  fyi: "text-blue-400 bg-blue-400/10",
  newsletter: "text-green-400 bg-green-400/10",
  receipt: "text-purple-400 bg-purple-400/10",
  spam: "text-sumi-gray-light bg-sumi-gray/10",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function extractName(sender: string): string {
  const match = sender.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : sender.split("@")[0];
}

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [digest, setDigest] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestOpen, setDigestOpen] = useState(true);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/email?${params}`);
      if (res.ok) setEmails(await res.json());
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  const fetchDigest = useCallback(async () => {
    setDigestLoading(true);
    try {
      const res = await fetch("/api/email/digest");
      if (res.ok) {
        const data = await res.json();
        setDigest(data.digest);
      }
    } catch (err) {
      console.error("Failed to fetch digest:", err);
    } finally {
      setDigestLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  async function syncEmails() {
    setSyncing(true);
    try {
      const res = await fetch("/api/email/sync", { method: "POST" });
      if (res.ok) {
        fetchEmails();
        fetchDigest();
      }
    } catch (err) {
      console.error("Failed to sync emails:", err);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start justify-between"
      >
        <div>
          <h1
            className="text-ink-black font-light"
            style={{ fontSize: "var(--text-heading)" }}
          >
            Email
          </h1>
          <p className="text-sumi-gray-light text-sm mt-1">
            AI-triaged inbox. Read-only view.
          </p>
        </div>
        <button
          onClick={syncEmails}
          disabled={syncing}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontSize: "var(--text-micro)" }}
        >
          {syncing ? "Syncing..." : "Sync"}
        </button>
      </motion.div>

      {/* AI Digest */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
      >
        <button
          onClick={() => setDigestOpen(!digestOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <span
            className="font-mono tracking-[0.12em] uppercase text-vermillion"
            style={{ fontSize: "var(--text-micro)" }}
          >
            AI Digest
          </span>
          <span className="text-sumi-gray-light text-sm">
            {digestOpen ? "−" : "+"}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {digestOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div
                className="mt-3 text-ink-black leading-relaxed whitespace-pre-line"
                style={{ fontSize: "var(--text-body)" }}
              >
                {digestLoading
                  ? "Generating digest..."
                  : digest || "No digest available."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        className="flex gap-2 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategoryFilter(c.value)}
            className={`font-mono tracking-[0.12em] uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${
              categoryFilter === c.value
                ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
                : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray-light hover:text-sumi-gray"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {c.label}
          </button>
        ))}
      </motion.div>

      {/* Email Cards */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              Loading...
            </motion.div>
          ) : emails.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              No emails found.
            </motion.div>
          ) : (
            emails.map((email, i) => (
              <motion.div
                key={email.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{
                  delay: i * 0.03,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 transition-colors duration-300 ${
                  !email.isRead ? "border-l-2 border-l-vermillion/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-medium ${!email.isRead ? "text-ink-black" : "text-sumi-gray"}`}
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {extractName(email.sender)}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase shrink-0 ${
                          CATEGORY_COLORS[email.category] || CATEGORY_COLORS.fyi
                        }`}
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {email.category.replace("_", " ")}
                      </span>
                      {email.isStarred && (
                        <span className="text-amber-400 text-sm">★</span>
                      )}
                    </div>
                    <p
                      className={`leading-snug ${!email.isRead ? "text-ink-black" : "text-sumi-gray"}`}
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {email.subject}
                    </p>
                    {email.summary && (
                      <p
                        className="text-sumi-gray-light mt-1 leading-relaxed"
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {email.summary}
                      </p>
                    )}
                  </div>
                  <span
                    className="font-mono tracking-[0.08em] text-sumi-gray-light shrink-0"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {timeAgo(email.date)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/email/page.tsx
git commit -m "feat(email): build full email triage page with digest, filters, cards"
```

---

## Workstream 5: Captures (Tasks 12–14)

### Task 12: Capture Schema Expansion

**Files:**
- Modify: `prisma/schema.prisma` (Capture model, lines 236–245)

**Step 1: Add routing fields to Capture model**

```prisma
model Capture {
  id             String   @id @default(cuid())
  content        String
  category       String   @default("")
  processed      Boolean  @default(false)
  suggestedRoute String?
  suggestedData  Json?
  routedTo       String?
  confidence     Float?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("captures")
}
```

**Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name add-capture-routing-fields
```

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(captures): add suggestedRoute, suggestedData, routedTo, confidence fields"
```

---

### Task 13: Auto-Route Library + API Routes

**Files:**
- Create: `src/lib/captures/auto-route.ts`
- Create: `src/app/api/captures/[id]/route/route.ts`
- Create: `src/app/api/captures/[id]/dismiss/route.ts`
- Modify: `src/app/api/captures/route.ts` (enhance POST, enhance GET)

**Step 1: Create auto-route library**

Create `src/lib/captures/auto-route.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

type RouteResult = {
  route: string;
  confidence: number;
  data: Record<string, unknown>;
};

const ROUTE_TARGETS = [
  "reading",
  "goal",
  "habit",
  "travel",
  "creative",
  "investment_note",
  "journal",
  "contact",
  "none",
] as const;

export async function classifyCapture(content: string): Promise<RouteResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Classify this quick capture into a category and extract structured data.

Capture: "${content}"

Routes: ${ROUTE_TARGETS.join(", ")}

Rules:
- "reading" → extract title and type (book/article/paper/podcast)
- "goal" → extract title
- "habit" → extract title
- "travel" → extract title and category (trip/destination/experience)
- "creative" → extract title
- "investment_note" → extract symbol and note
- "journal" → the capture IS the journal content
- "contact" → extract person name and notes
- "none" → doesn't fit any category

Respond as JSON: {"route": "...", "confidence": 0.0-1.0, "data": {...}}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);
    return {
      route: parsed.route || "none",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      data: parsed.data || {},
    };
  } catch {
    return { route: "none", confidence: 0, data: {} };
  }
}

export async function executeRoute(
  captureId: string,
  route: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (route) {
      case "reading":
        await prisma.readingItem.create({
          data: {
            title: (data.title as string) || "Untitled",
            type: (data.type as string) || "book",
            status: "to_read",
          },
        });
        break;

      case "goal":
        await prisma.goal.create({
          data: { title: (data.title as string) || "Untitled" },
        });
        break;

      case "habit":
        await prisma.habit.create({
          data: { title: (data.title as string) || "Untitled" },
        });
        break;

      case "travel":
        await prisma.travelItem.create({
          data: {
            title: (data.title as string) || "Untitled",
            category: (data.category as string) || "trip",
          },
        });
        break;

      case "creative":
        await prisma.creativeProject.create({
          data: {
            title: (data.title as string) || "Untitled",
            status: "idea",
          },
        });
        break;

      case "investment_note": {
        const symbol = (data.symbol as string)?.toUpperCase();
        if (!symbol) return { success: false, error: "No symbol provided" };
        const investment = await prisma.investment.findFirst({
          where: { symbol },
        });
        if (!investment)
          return { success: false, error: `No investment found for ${symbol}` };
        await prisma.investmentNote.create({
          data: {
            investmentId: investment.id,
            content: (data.note as string) || "",
          },
        });
        break;
      }

      case "journal": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await prisma.journal.findUnique({
          where: { date: today },
        });
        if (existing) {
          await prisma.journal.update({
            where: { date: today },
            data: { content: existing.content + "\n\n" + (data.content || "") },
          });
        } else {
          await prisma.journal.create({
            data: { date: today, content: (data.content as string) || "" },
          });
        }
        break;
      }

      case "contact": {
        const name = (data.name as string) || "";
        if (!name) return { success: false, error: "No contact name" };
        const contact = await prisma.contact.findFirst({
          where: { name: { contains: name, mode: "insensitive" } },
        });
        if (contact) {
          await prisma.contactInteraction.create({
            data: {
              contactId: contact.id,
              notes: (data.notes as string) || "",
            },
          });
          await prisma.contact.update({
            where: { id: contact.id },
            data: { lastInteraction: new Date() },
          });
        }
        break;
      }

      default:
        return { success: false, error: `Unknown route: ${route}` };
    }

    await prisma.capture.update({
      where: { id: captureId },
      data: { processed: true, routedTo: route },
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
```

**Step 2: Enhance captures POST route**

Modify `src/app/api/captures/route.ts` — after creating the capture, classify it. If confidence >= 0.85, auto-route:

```typescript
import { classifyCapture, executeRoute } from "@/lib/captures/auto-route";

// Inside POST handler, after creating the capture:
const classification = await classifyCapture(content);

await prisma.capture.update({
  where: { id: capture.id },
  data: {
    suggestedRoute: classification.route,
    suggestedData: classification.data,
    confidence: classification.confidence,
  },
});

// Auto-route if confident
if (classification.confidence >= 0.85 && classification.route !== "none") {
  await executeRoute(capture.id, classification.route, classification.data);
}

// Re-fetch the updated capture to return
const updated = await prisma.capture.findUnique({ where: { id: capture.id } });
return NextResponse.json(updated, { status: 201 });
```

**Step 3: Enhance captures GET route**

Add `status` query param support. `?status=inbox` returns unprocessed captures:

```typescript
// Inside GET handler:
const status = searchParams.get("status");

const where: Record<string, unknown> = {};
if (status === "inbox") {
  where.processed = false;
} else if (status === "routed") {
  where.processed = true;
  where.routedTo = { not: null };
}
```

**Step 4: Create manual route endpoint**

Create `src/app/api/captures/[id]/route/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { executeRoute } from "@/lib/captures/auto-route";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let route: string;
  let data: Record<string, unknown>;

  try {
    const body = await request.json();
    route = body.route;
    data = body.data || {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!route) {
    return NextResponse.json(
      { error: "route is required" },
      { status: 400 }
    );
  }

  const capture = await prisma.capture.findUnique({ where: { id } });
  if (!capture) {
    return NextResponse.json(
      { error: "Capture not found" },
      { status: 404 }
    );
  }

  const result = await executeRoute(id, route, data);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ routed: true, route });
}
```

**Step 5: Create dismiss endpoint**

Create `src/app/api/captures/[id]/dismiss/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    await prisma.capture.update({
      where: { id },
      data: { processed: true },
    });
    return NextResponse.json({ dismissed: true });
  } catch (err) {
    console.error("[captures] Dismiss error:", err);
    return NextResponse.json(
      { error: "Capture not found" },
      { status: 404 }
    );
  }
}
```

**Step 6: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 7: Commit**

```bash
git add src/lib/captures/ src/app/api/captures/
git commit -m "feat(captures): add auto-route classification, manual route/dismiss endpoints"
```

---

### Task 14: Captures Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/captures/page.tsx`

**Step 1: Build captures inbox page**

Create the page following the same patterns as other module pages (Reading, Creative, etc.):

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Capture = {
  id: string;
  content: string;
  category: string;
  processed: boolean;
  suggestedRoute: string | null;
  suggestedData: Record<string, unknown> | null;
  routedTo: string | null;
  confidence: number | null;
  createdAt: string;
};

type Tab = "inbox" | "routed";

const ROUTE_LABELS: Record<string, string> = {
  reading: "Reading List",
  goal: "Goals",
  habit: "Habits",
  travel: "Travel",
  creative: "Creative",
  investment_note: "Investment Note",
  journal: "Journal",
  contact: "People",
  none: "No suggestion",
};

const ROUTE_COLORS: Record<string, string> = {
  reading: "text-amber-400 bg-amber-400/10",
  goal: "text-green-400 bg-green-400/10",
  habit: "text-blue-400 bg-blue-400/10",
  travel: "text-purple-400 bg-purple-400/10",
  creative: "text-pink-400 bg-pink-400/10",
  investment_note: "text-emerald-400 bg-emerald-400/10",
  journal: "text-indigo-400 bg-indigo-400/10",
  contact: "text-cyan-400 bg-cyan-400/10",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CapturesPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("inbox");

  const fetchCaptures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/captures?status=${tab}`);
      if (res.ok) setCaptures(await res.json());
    } catch (err) {
      console.error("Failed to fetch captures:", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchCaptures();
  }, [fetchCaptures]);

  async function approveRoute(id: string, route: string, data: Record<string, unknown> | null) {
    try {
      const res = await fetch(`/api/captures/${id}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route, data: data || {} }),
      });
      if (res.ok) fetchCaptures();
    } catch (err) {
      console.error("Failed to route capture:", err);
    }
  }

  async function dismissCapture(id: string) {
    try {
      const res = await fetch(`/api/captures/${id}/dismiss`, {
        method: "POST",
      });
      if (res.ok) fetchCaptures();
    } catch (err) {
      console.error("Failed to dismiss capture:", err);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Captures
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Quick thoughts, auto-routed by Kemi.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {(["inbox", "routed"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono tracking-[0.12em] uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${
              tab === t
                ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
                : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray-light hover:text-sumi-gray"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {t === "inbox" ? "Inbox" : "Recently Routed"}
          </button>
        ))}
      </motion.div>

      {/* Capture Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              Loading...
            </motion.div>
          ) : captures.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              {tab === "inbox" ? "All clear. No pending captures." : "No recently routed captures."}
            </motion.div>
          ) : (
            captures.map((capture, i) => (
              <motion.div
                key={capture.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/20 transition-colors duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-ink-black leading-relaxed"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {capture.content}
                    </p>

                    {/* Kemi suggestion */}
                    {capture.suggestedRoute &&
                      capture.suggestedRoute !== "none" &&
                      !capture.processed && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase ${
                              ROUTE_COLORS[capture.suggestedRoute] || "text-sumi-gray bg-sumi-gray/10"
                            }`}
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            → {ROUTE_LABELS[capture.suggestedRoute] || capture.suggestedRoute}
                          </span>
                          {capture.confidence !== null && (
                            <span
                              className="font-mono tracking-[0.08em] text-sumi-gray-light"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              {Math.round(capture.confidence * 100)}%
                            </span>
                          )}
                          <button
                            onClick={() =>
                              approveRoute(
                                capture.id,
                                capture.suggestedRoute!,
                                capture.suggestedData as Record<string, unknown> | null
                              )
                            }
                            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-lg px-3 py-1 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 transition-all duration-300"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => dismissCapture(capture.id)}
                            className="bg-parchment-warm/20 border border-sumi-gray/20 text-sumi-gray-light rounded-lg px-3 py-1 font-mono tracking-[0.12em] uppercase hover:text-sumi-gray transition-all duration-300"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Skip
                          </button>
                        </div>
                      )}

                    {/* Routed badge */}
                    {capture.routedTo && (
                      <span
                        className={`inline-flex mt-2 px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase ${
                          ROUTE_COLORS[capture.routedTo] || "text-sumi-gray bg-sumi-gray/10"
                        }`}
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        ✓ {ROUTE_LABELS[capture.routedTo] || capture.routedTo}
                      </span>
                    )}
                  </div>

                  <span
                    className="font-mono tracking-[0.08em] text-sumi-gray-light shrink-0"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {timeAgo(capture.createdAt)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

**Step 2: Add Captures to sidebar**

Modify `src/components/dashboard/Sidebar.tsx` — add captures module entry if not already present. Check if it exists first. The design says it's accessed via badge, but having a sidebar entry is useful too. If absent, add:

```typescript
{ label: "Captures", href: "/dashboard/captures", icon: "捕" },
```

**Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/captures/page.tsx src/components/dashboard/Sidebar.tsx
git commit -m "feat(captures): build captures inbox page with approve/skip/route flow"
```

---

## Workstream 6: Kemi Intelligence (Tasks 15–18)

### Task 15: Port Soul Files

**Files:**
- Create: `src/lib/kemi/soul.ts`
- Create: `src/lib/kemi/mood.ts`
- Create: `src/lib/kemi/autonomy.ts`

**Step 1: Create soul.ts**

Read the soul files from `/Users/mac/prod/Kemi/soul/SOUL.md` and `/Users/mac/prod/Kemi/soul/CONTEXT_MIKE.md`. Embed them as string constants:

```typescript
// src/lib/kemi/soul.ts

export const SOUL = `<contents of SOUL.md>`;

export const CONTEXT_MIKE = `<contents of CONTEXT_MIKE.md>`;

export const CONTEXT_PEOPLE = `<contents of CONTEXT_PEOPLE.md>`;
```

Read the actual file contents from `/Users/mac/prod/Kemi/soul/` and paste them in.

**Step 2: Create mood.ts**

Read `/Users/mac/prod/Kemi/soul/MOOD_MORNING.md`, `MOOD_EVENING.md`, `MOOD_LATENIGHT.md`. Create:

```typescript
// src/lib/kemi/mood.ts

const MORNING = `<contents of MOOD_MORNING.md>`;
const EVENING = `<contents of MOOD_EVENING.md>`;
const LATE_NIGHT = `<contents of MOOD_LATENIGHT.md>`;

export function getMoodContext(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return MORNING;
  if (hour >= 12 && hour < 21) return EVENING;
  return LATE_NIGHT;
}
```

**Step 3: Create autonomy.ts**

Read `/Users/mac/prod/Kemi/soul/RULES_AUTONOMY.md`:

```typescript
// src/lib/kemi/autonomy.ts

export const AUTONOMY_RULES = `<contents of RULES_AUTONOMY.md>`;
```

**Step 4: Commit**

```bash
git add src/lib/kemi/soul.ts src/lib/kemi/mood.ts src/lib/kemi/autonomy.ts
git commit -m "feat(kemi): port soul files, mood system, autonomy rules from Kemi project"
```

---

### Task 16: Tool Definitions + Executor

**Files:**
- Create: `src/lib/kemi/tools.ts`
- Create: `src/lib/kemi/tool-executor.ts`

**Step 1: Create tool definitions**

Create `src/lib/kemi/tools.ts` with 22 tool definitions using Anthropic's tool_use schema:

```typescript
import type { Anthropic } from "@anthropic-ai/sdk";

type Tool = Anthropic.Messages.Tool;

export const KEMI_TOOLS: Tool[] = [
  // ── Read Tools (15) ──
  {
    name: "get_habits",
    description: "Get today's habits with completion status",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_goals",
    description: "Get active goals with deadlines",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description: "Filter by status: active, completed, all",
        },
      },
      required: [],
    },
  },
  {
    name: "get_portfolio",
    description: "Get investment portfolio with current prices and P&L",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_finances",
    description: "Get latest financial snapshot (net worth, income, expenses)",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_transactions",
    description: "Get recent transactions with optional category filter",
    input_schema: {
      type: "object" as const,
      properties: {
        days: { type: "number", description: "Number of days to look back (default 30)" },
        category: { type: "string", description: "Filter by category" },
      },
      required: [],
    },
  },
  {
    name: "get_health",
    description: "Get recent health data (steps, sleep, heart rate, calories)",
    input_schema: {
      type: "object" as const,
      properties: {
        days: { type: "number", description: "Number of days (default 7)" },
      },
      required: [],
    },
  },
  {
    name: "get_emails",
    description: "Get recent emails with optional category/unread filter",
    input_schema: {
      type: "object" as const,
      properties: {
        category: { type: "string", description: "Filter: important, action_needed, fyi, newsletter" },
        unread: { type: "boolean", description: "Only unread emails" },
      },
      required: [],
    },
  },
  {
    name: "get_journal",
    description: "Get journal entries for recent days",
    input_schema: {
      type: "object" as const,
      properties: {
        days: { type: "number", description: "Number of days (default 7)" },
      },
      required: [],
    },
  },
  {
    name: "get_contacts",
    description: "Get contacts with recent interactions",
    input_schema: {
      type: "object" as const,
      properties: {
        search: { type: "string", description: "Search by name" },
      },
      required: [],
    },
  },
  {
    name: "get_learning",
    description: "Get learning tracks with progress",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_reading",
    description: "Get reading list with optional status filter",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "to_read, reading, completed" },
      },
      required: [],
    },
  },
  {
    name: "get_travel",
    description: "Get travel items with status filter",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "planning, booked, completed" },
      },
      required: [],
    },
  },
  {
    name: "get_creative",
    description: "Get creative projects with status filter",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "idea, in_progress, completed" },
      },
      required: [],
    },
  },
  {
    name: "get_captures",
    description: "Get pending/unprocessed captures from inbox",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "search_knowledge",
    description: "Search the knowledge graph for people, topics, concepts",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        type: { type: "string", description: "Filter by node type: person, topic, concept" },
      },
      required: ["query"],
    },
  },

  // ── Write Tools (7) ──
  {
    name: "log_habit",
    description: "Mark a habit as completed for today",
    input_schema: {
      type: "object" as const,
      properties: {
        habitId: { type: "string", description: "The habit ID to log" },
      },
      required: ["habitId"],
    },
  },
  {
    name: "add_goal",
    description: "Create a new goal",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Goal title" },
        description: { type: "string", description: "Goal description" },
        deadline: { type: "string", description: "ISO date string deadline" },
      },
      required: ["title"],
    },
  },
  {
    name: "add_capture",
    description: "Save a quick thought/capture",
    input_schema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "The capture content" },
      },
      required: ["content"],
    },
  },
  {
    name: "add_journal",
    description: "Add or append to today's journal entry",
    input_schema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "Journal content" },
      },
      required: ["content"],
    },
  },
  {
    name: "log_interaction",
    description: "Log an interaction with a contact",
    input_schema: {
      type: "object" as const,
      properties: {
        contactName: { type: "string", description: "Contact name to search for" },
        notes: { type: "string", description: "What happened" },
      },
      required: ["contactName", "notes"],
    },
  },
  {
    name: "add_reading",
    description: "Add a book/article to reading list",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Title" },
        type: { type: "string", description: "book, article, paper, podcast" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_goal_status",
    description: "Update a goal's status",
    input_schema: {
      type: "object" as const,
      properties: {
        goalId: { type: "string", description: "Goal ID" },
        status: { type: "string", description: "active, completed, paused, abandoned" },
      },
      required: ["goalId", "status"],
    },
  },
];
```

**Step 2: Create tool executor**

Create `src/lib/kemi/tool-executor.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "get_habits": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return prisma.habit.findMany({
        include: { logs: { where: { date: today }, take: 1 } },
        orderBy: { createdAt: "asc" },
      });
    }

    case "get_goals": {
      const status = (input.status as string) || "active";
      return prisma.goal.findMany({
        where: status === "all" ? {} : { status },
        orderBy: { createdAt: "desc" },
      });
    }

    case "get_portfolio":
      return prisma.investment.findMany({
        include: { notes: { take: 3, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      });

    case "get_finances":
      return prisma.financialSnapshot.findFirst({
        orderBy: { date: "desc" },
      });

    case "get_transactions": {
      const days = (input.days as number) || 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      return prisma.transaction.findMany({
        where: {
          date: { gte: since },
          ...(input.category ? { category: input.category as string } : {}),
        },
        orderBy: { date: "desc" },
        take: 50,
      });
    }

    case "get_health": {
      const days = (input.days as number) || 7;
      const since = new Date();
      since.setDate(since.getDate() - days);
      return prisma.healthSnapshot.findMany({
        where: { date: { gte: since } },
        orderBy: { date: "desc" },
      });
    }

    case "get_emails":
      return prisma.emailCache.findMany({
        where: {
          ...(input.category ? { category: input.category as string } : {}),
          ...(input.unread === true ? { isRead: false } : {}),
        },
        orderBy: { date: "desc" },
        take: 20,
      });

    case "get_journal": {
      const days = (input.days as number) || 7;
      const since = new Date();
      since.setDate(since.getDate() - days);
      return prisma.journal.findMany({
        where: { date: { gte: since } },
        orderBy: { date: "desc" },
      });
    }

    case "get_contacts": {
      const search = input.search as string | undefined;
      return prisma.contact.findMany({
        where: search
          ? { name: { contains: search, mode: "insensitive" } }
          : {},
        include: {
          interactions: { take: 3, orderBy: { date: "desc" } },
        },
        orderBy: { lastInteraction: { sort: "desc", nulls: "last" } },
        take: 20,
      });
    }

    case "get_learning":
      return prisma.learningTrack.findMany({
        include: { logs: { take: 3, orderBy: { date: "desc" } } },
        orderBy: { updatedAt: "desc" },
      });

    case "get_reading": {
      const status = (input.status as string) || "reading";
      return prisma.readingItem.findMany({
        where: { status },
        orderBy: { updatedAt: "desc" },
      });
    }

    case "get_travel": {
      const status = (input.status as string) || "planning";
      return prisma.travelItem.findMany({
        where: { status },
        orderBy: { createdAt: "desc" },
      });
    }

    case "get_creative": {
      const status = (input.status as string) || "in_progress";
      return prisma.creativeProject.findMany({
        where: { status },
        orderBy: { updatedAt: "desc" },
      });
    }

    case "get_captures":
      return prisma.capture.findMany({
        where: { processed: false },
        orderBy: { createdAt: "desc" },
      });

    case "search_knowledge": {
      const query = input.query as string;
      const type = input.type as string | undefined;
      return prisma.node.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
          ...(type ? { tags: { has: type } } : {}),
        },
        include: {
          sourceLinks: { include: { targetNode: true }, take: 5 },
          targetLinks: { include: { sourceNode: true }, take: 5 },
        },
        take: 10,
      });
    }

    // ── Write Tools ──

    case "log_habit": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return prisma.habitLog.upsert({
        where: {
          habitId_date: {
            habitId: input.habitId as string,
            date: today,
          },
        },
        create: {
          habitId: input.habitId as string,
          date: today,
          completed: true,
        },
        update: { completed: true },
      });
    }

    case "add_goal":
      return prisma.goal.create({
        data: {
          title: input.title as string,
          description: (input.description as string) || "",
          ...(input.deadline
            ? { deadline: new Date(input.deadline as string) }
            : {}),
        },
      });

    case "add_capture":
      return prisma.capture.create({
        data: { content: input.content as string },
      });

    case "add_journal": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existing = await prisma.journal.findUnique({
        where: { date: today },
      });
      if (existing) {
        return prisma.journal.update({
          where: { date: today },
          data: {
            content: existing.content + "\n\n" + (input.content as string),
          },
        });
      }
      return prisma.journal.create({
        data: { date: today, content: input.content as string },
      });
    }

    case "log_interaction": {
      const contact = await prisma.contact.findFirst({
        where: {
          name: {
            contains: input.contactName as string,
            mode: "insensitive",
          },
        },
      });
      if (!contact) return { error: `Contact "${input.contactName}" not found` };
      await prisma.contact.update({
        where: { id: contact.id },
        data: { lastInteraction: new Date() },
      });
      return prisma.contactInteraction.create({
        data: {
          contactId: contact.id,
          notes: input.notes as string,
        },
      });
    }

    case "add_reading":
      return prisma.readingItem.create({
        data: {
          title: input.title as string,
          type: (input.type as string) || "book",
          status: "to_read",
        },
      });

    case "update_goal_status":
      return prisma.goal.update({
        where: { id: input.goalId as string },
        data: { status: input.status as string },
      });

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
```

**Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add src/lib/kemi/tools.ts src/lib/kemi/tool-executor.ts
git commit -m "feat(kemi): add 22 tool definitions and Prisma-backed executor"
```

---

### Task 17: Model Router + System Prompt + Context Manager

**Files:**
- Create: `src/lib/kemi/model-router.ts`
- Create: `src/lib/kemi/system-prompt.ts`
- Create: `src/lib/kemi/context-manager.ts`

**Step 1: Create model router**

Create `src/lib/kemi/model-router.ts`:

```typescript
type ModelTier = "haiku" | "sonnet" | "opus";

const OPUS_KEYWORDS = [
  "review",
  "plan",
  "strategy",
  "analyze",
  "analyse",
  "reflect",
  "deep dive",
  "architecture",
  "evaluate",
  "compare",
  "pros and cons",
  "career",
  "life",
];

const HAIKU_PATTERNS = [
  /^(hi|hey|hello|yo|sup|gm|morning|evening)\b/i,
  /^(what|how|when|where)\s+(is|are|was|were)\b/i,
  /^(show|get|check|list)\s+\w+$/i,
];

export function routeModel(message: string): {
  model: string;
  tier: ModelTier;
} {
  const lower = message.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).length;

  // Opus: strategic/analytical queries
  if (OPUS_KEYWORDS.some((kw) => lower.includes(kw)) && wordCount > 5) {
    return { model: "claude-opus-4-6", tier: "opus" };
  }

  // Haiku: simple lookups and greetings
  if (wordCount <= 8 || HAIKU_PATTERNS.some((p) => p.test(lower))) {
    return { model: "claude-haiku-4-5-20251001", tier: "haiku" };
  }

  // Default: Sonnet
  return { model: "claude-sonnet-4-5-20250514", tier: "sonnet" };
}
```

**Step 2: Create context manager**

Create `src/lib/kemi/context-manager.ts`:

```typescript
import { prisma } from "@/lib/prisma";

type ContextBlock = {
  label: string;
  content: string;
};

const KEYWORD_TRIGGERS: Record<string, () => Promise<ContextBlock | null>> = {
  habit: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const habits = await prisma.habit.findMany({
      include: { logs: { where: { date: today }, take: 1 } },
    });
    const done = habits.filter((h) => h.logs.length > 0).length;
    return {
      label: "Habits Today",
      content: `${done}/${habits.length} completed. ${habits.map((h) => `${h.title}: ${h.logs.length > 0 ? "done" : "pending"}`).join(", ")}`,
    };
  },
  health: async () => {
    const snapshot = await prisma.healthSnapshot.findFirst({
      orderBy: { date: "desc" },
    });
    if (!snapshot) return null;
    return {
      label: "Latest Health",
      content: `Steps: ${snapshot.steps ?? "?"}, Calories: ${snapshot.calories ?? "?"}, Sleep: ${snapshot.sleep ?? "?"}h, HR: ${snapshot.heartRate ?? "?"}`,
    };
  },
  portfolio: async () => {
    const investments = await prisma.investment.findMany();
    const totalValue = investments.reduce(
      (s, i) => s + (i.currentPrice ?? 0) * (i.quantity ?? 0),
      0
    );
    return {
      label: "Portfolio",
      content: `${investments.length} positions, total value $${totalValue.toLocaleString()}`,
    };
  },
  finance: async () => {
    const snapshot = await prisma.financialSnapshot.findFirst({
      orderBy: { date: "desc" },
    });
    if (!snapshot) return null;
    const data = snapshot.data as Record<string, unknown>;
    return {
      label: "Finances",
      content: `Income: $${data.income ?? "?"}, Expenses: $${data.expenses ?? "?"}`,
    };
  },
  goal: async () => {
    const goals = await prisma.goal.findMany({ where: { status: "active" } });
    return {
      label: "Active Goals",
      content: goals.map((g) => g.title).join(", ") || "None",
    };
  },
};

export async function getRelevantContext(
  message: string
): Promise<ContextBlock[]> {
  const lower = message.toLowerCase();
  const blocks: ContextBlock[] = [];

  for (const [keyword, fetcher] of Object.entries(KEYWORD_TRIGGERS)) {
    if (lower.includes(keyword)) {
      const block = await fetcher();
      if (block) blocks.push(block);
    }
  }

  return blocks;
}
```

**Step 3: Create system prompt assembler**

Create `src/lib/kemi/system-prompt.ts`:

```typescript
import { SOUL, CONTEXT_MIKE, CONTEXT_PEOPLE } from "./soul";
import { getMoodContext } from "./mood";
import { AUTONOMY_RULES } from "./autonomy";
import type { ContextBlock } from "./context-manager";

export function buildSystemPrompt(
  contextBlocks: { label: string; content: string }[] = []
): string {
  const mood = getMoodContext();

  let prompt = `${SOUL}

---
${CONTEXT_MIKE}

---
${CONTEXT_PEOPLE}

---
## Current Mood & Tone
${mood}

---
## Autonomy Rules
${AUTONOMY_RULES}
`;

  if (contextBlocks.length > 0) {
    prompt += `\n---\n## Live Data Context\n`;
    for (const block of contextBlocks) {
      prompt += `**${block.label}:** ${block.content}\n`;
    }
  }

  prompt += `\n---\n## Tools Available
You have tools to read and write Mike's data. Use them when the conversation calls for it. Don't dump data — summarize and highlight what matters.`;

  return prompt;
}
```

**Step 4: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/lib/kemi/model-router.ts src/lib/kemi/system-prompt.ts src/lib/kemi/context-manager.ts
git commit -m "feat(kemi): add model router, context manager, system prompt assembler"
```

---

### Task 18: Kemi API Overhaul + Briefing

**Files:**
- Create: `src/lib/kemi/briefing.ts`
- Modify: `src/app/api/kemi/route.ts`
- Create: `src/app/api/kemi/briefing/route.ts`

**Step 1: Create briefing generator**

Create `src/lib/kemi/briefing.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getMoodContext } from "./mood";

const anthropic = new Anthropic();

let cachedBriefing: { text: string; generatedAt: number } | null = null;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

export async function generateBriefing(): Promise<string> {
  // Return cached if fresh
  if (cachedBriefing && Date.now() - cachedBriefing.generatedAt < CACHE_DURATION) {
    return cachedBriefing.text;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const isMonday = dayOfWeek === 1;

  // Fetch all data sources in parallel
  const [habits, goals, health, finances, investments, emails, captures, journal] =
    await Promise.all([
      prisma.habit.findMany({
        include: { logs: { where: { date: today }, take: 1 } },
      }),
      prisma.goal.findMany({ where: { status: "active" } }),
      prisma.healthSnapshot.findFirst({ orderBy: { date: "desc" } }),
      prisma.financialSnapshot.findFirst({ orderBy: { date: "desc" } }),
      prisma.investment.findMany(),
      prisma.emailCache.findMany({
        where: { isRead: false },
        take: 10,
        orderBy: { date: "desc" },
      }),
      prisma.capture.count({ where: { processed: false } }),
      prisma.journal.findUnique({ where: { date: today } }),
    ]);

  const habitsCompleted = habits.filter((h) => h.logs.length > 0).length;
  const overdueGoals = goals.filter(
    (g) => g.deadline && new Date(g.deadline) < today
  );
  const portfolioValue = investments.reduce(
    (s, i) => s + (i.currentPrice ?? 0) * (i.quantity ?? 0),
    0
  );
  const actionEmails = emails.filter((e) => e.category === "action_needed");
  const financesData = finances?.data as Record<string, unknown> | undefined;

  const dataContext = `
Habits: ${habitsCompleted}/${habits.length} done today
Goals: ${goals.length} active, ${overdueGoals.length} overdue${overdueGoals.length > 0 ? ` (${overdueGoals.map((g) => g.title).join(", ")})` : ""}
Health: Steps ${health?.steps ?? "no data"}, Sleep ${health?.sleep ?? "?"}h
Portfolio: $${portfolioValue.toLocaleString()} across ${investments.length} positions
Finances: Income $${financesData?.income ?? "?"}, Expenses $${financesData?.expenses ?? "?"}
Email: ${emails.length} unread, ${actionEmails.length} need action
Captures: ${captures} pending
Journal: ${journal ? "written today" : "not yet"}
Day: ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]}
${isMonday ? "It's Monday — include a week-ahead preview." : ""}
`;

  const mood = getMoodContext();

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Generate Mike's briefing. Be concise, highlight what needs attention. Lead with the most important thing. Use his data, not platitudes. 3-5 bullet points max.

${mood}

${dataContext}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text"
        ? response.content[0].text
        : "Could not generate briefing.";

    cachedBriefing = { text, generatedAt: Date.now() };
    return text;
  } catch (err) {
    console.error("[kemi] Briefing generation error:", err);
    return "Briefing generation failed. Check API key.";
  }
}
```

**Step 2: Create briefing API route**

Create `src/app/api/kemi/briefing/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateBriefing } from "@/lib/kemi/briefing";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const briefing = await generateBriefing();
    return NextResponse.json({ briefing });
  } catch (err) {
    console.error("[kemi] Briefing error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Overhaul Kemi API route**

Replace the existing `src/app/api/kemi/route.ts` with the tool_use loop pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { KEMI_TOOLS } from "@/lib/kemi/tools";
import { executeTool } from "@/lib/kemi/tool-executor";
import { routeModel } from "@/lib/kemi/model-router";
import { buildSystemPrompt } from "@/lib/kemi/system-prompt";
import { getRelevantContext } from "@/lib/kemi/context-manager";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

type KemiMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let message: string;
  let history: KemiMessage[];

  try {
    const body = await request.json();
    message = body.message;
    history = body.history ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const trimmed = message.trim();

  try {
    // Route to appropriate model
    const { model, tier } = routeModel(trimmed);

    // Get relevant context
    const contextBlocks = await getRelevantContext(trimmed);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(contextBlocks);

    // Build messages array
    const messages: Anthropic.Messages.MessageParam[] = [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: trimmed },
    ];

    // Initial API call
    let response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: KEMI_TOOLS,
      messages,
    });

    // Tool use loop (max 5 rounds)
    let rounds = 0;
    while (response.stop_reason === "tool_use" && rounds < 5) {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        tools: KEMI_TOOLS,
        messages,
      });
      rounds++;
    }

    // Extract text response
    const textBlock = response.content.find(
      (b): b is Anthropic.Messages.TextBlock => b.type === "text"
    );
    const content = textBlock?.text ?? "I couldn't formulate a response.";

    // Save conversation (fire-and-forget)
    prisma.kemiConversation
      .create({
        data: {
          messages: [...history, { role: "user", content: trimmed }, { role: "assistant", content }],
          context: tier,
        },
      })
      .catch((err) => console.error("[kemi] Save conversation error:", err));

    return NextResponse.json({ content, model: tier });
  } catch (err) {
    console.error("[kemi] Agent error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 4: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/lib/kemi/briefing.ts src/app/api/kemi/
git commit -m "feat(kemi): overhaul API with tool_use loop, model routing, briefing endpoint"
```

---

## Workstream 7: Knowledge Graph (Tasks 19–21)

### Task 19: Kioku Indexer

**Files:**
- Create: `src/lib/kioku/indexer.ts`

**Step 1: Create the indexing pipeline**

Create `src/lib/kioku/indexer.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

type ExtractedEntity = {
  name: string;
  type: string; // person, topic, concept, place, project
};

type ExtractionResult = {
  entities: ExtractedEntity[];
  concepts: string[];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function extractEntities(
  text: string
): Promise<ExtractionResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Extract named entities and concepts from this text. Return JSON.

Text: "${text.slice(0, 1000)}"

Format: {"entities": [{"name": "...", "type": "person|topic|concept|place|project"}], "concepts": ["..."]}`,
        },
      ],
    });

    const out =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    const parsed = JSON.parse(out);
    return {
      entities: parsed.entities || [],
      concepts: parsed.concepts || [],
    };
  } catch {
    return { entities: [], concepts: [] };
  }
}

export async function indexContent(
  text: string,
  source: string
): Promise<{ nodesCreated: number; linksCreated: number }> {
  const { entities, concepts } = await extractEntities(text);
  let nodesCreated = 0;
  let linksCreated = 0;

  // Merge concepts as entities with type "concept"
  const allEntities = [
    ...entities,
    ...concepts.map((c) => ({ name: c, type: "concept" })),
  ];

  const nodeIds: string[] = [];

  for (const entity of allEntities) {
    const slug = slugify(entity.name);
    if (!slug) continue;

    // Find or create node
    let node = await prisma.node.findUnique({ where: { slug } });

    if (!node) {
      // Try fuzzy match
      node = await prisma.node.findFirst({
        where: {
          name: { contains: entity.name, mode: "insensitive" },
        },
      });
    }

    if (!node) {
      node = await prisma.node.create({
        data: {
          name: entity.name,
          slug,
          tags: [entity.type, source],
          notes: `First seen in ${source}`,
        },
      });
      nodesCreated++;
    }

    nodeIds.push(node.id);

    // Update recall
    await prisma.nodeRecall.upsert({
      where: { nodeId: node.id },
      create: { nodeId: node.id, lastSurfaced: new Date(), surfaceCount: 1 },
      update: {
        lastSurfaced: new Date(),
        surfaceCount: { increment: 1 },
      },
    });
  }

  // Create links between co-occurring entities
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      try {
        await prisma.link.create({
          data: {
            sourceNodeId: nodeIds[i],
            targetNodeId: nodeIds[j],
            relation: `co-occurrence:${source}`,
          },
        });
        linksCreated++;
      } catch {
        // Unique constraint — link already exists, skip
      }
    }
  }

  return { nodesCreated, linksCreated };
}
```

**Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add src/lib/kioku/indexer.ts
git commit -m "feat(kioku): add entity extraction and indexing pipeline"
```

---

### Task 20: Kioku API Routes

**Files:**
- Create: `src/app/api/kioku/nodes/route.ts`
- Create: `src/app/api/kioku/nodes/[id]/route.ts`
- Create: `src/app/api/kioku/nodes/[id]/related/route.ts`
- Create: `src/app/api/kioku/graph/route.ts`
- Create: `src/app/api/kioku/search/route.ts`

**Step 1: Create nodes list/create route**

Create `src/app/api/kioku/nodes/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const type = searchParams.get("type");

  try {
    const nodes = await prisma.node.findMany({
      where: {
        ...(search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {}),
        ...(type ? { tags: { has: type } } : {}),
      },
      include: {
        recalls: true,
        sourceLinks: { include: { targetNode: true }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return NextResponse.json(nodes);
  } catch (err) {
    console.error("[kioku] Nodes list error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let name: string;
  let tags: string[];

  try {
    const body = await request.json();
    name = body.name;
    tags = body.tags || [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  try {
    const node = await prisma.node.create({
      data: { name: name.trim(), slug, tags },
    });
    return NextResponse.json(node, { status: 201 });
  } catch (err) {
    console.error("[kioku] Node create error:", err);
    return NextResponse.json(
      { error: "Node already exists or creation failed" },
      { status: 409 }
    );
  }
}
```

**Step 2: Create node detail route**

Create `src/app/api/kioku/nodes/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const node = await prisma.node.findUnique({
      where: { id },
      include: {
        sourceLinks: { include: { targetNode: true } },
        targetLinks: { include: { sourceNode: true } },
        recalls: true,
      },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    return NextResponse.json(node);
  } catch (err) {
    console.error("[kioku] Node detail error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Create graph subgraph route**

Create `src/app/api/kioku/graph/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const center = searchParams.get("center");
  const depth = parseInt(searchParams.get("depth") || "2", 10);

  try {
    if (center) {
      // Subgraph around a center node
      const visited = new Set<string>();
      const nodeIds = new Set<string>();
      const queue: { id: string; d: number }[] = [{ id: center, d: 0 }];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id) || current.d > depth) continue;
        visited.add(current.id);
        nodeIds.add(current.id);

        const links = await prisma.link.findMany({
          where: {
            OR: [
              { sourceNodeId: current.id },
              { targetNodeId: current.id },
            ],
          },
        });

        for (const link of links) {
          const neighbor =
            link.sourceNodeId === current.id
              ? link.targetNodeId
              : link.sourceNodeId;
          nodeIds.add(neighbor);
          if (!visited.has(neighbor)) {
            queue.push({ id: neighbor, d: current.d + 1 });
          }
        }
      }

      const nodes = await prisma.node.findMany({
        where: { id: { in: Array.from(nodeIds) } },
      });

      const links = await prisma.link.findMany({
        where: {
          AND: [
            { sourceNodeId: { in: Array.from(nodeIds) } },
            { targetNodeId: { in: Array.from(nodeIds) } },
          ],
        },
      });

      return NextResponse.json({ nodes, links });
    }

    // Default: recent nodes with their links
    const nodes = await prisma.node.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const nodeIds = nodes.map((n) => n.id);

    const links = await prisma.link.findMany({
      where: {
        AND: [
          { sourceNodeId: { in: nodeIds } },
          { targetNodeId: { in: nodeIds } },
        ],
      },
    });

    return NextResponse.json({ nodes, links });
  } catch (err) {
    console.error("[kioku] Graph error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 4: Create search route**

Create `src/app/api/kioku/search/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let query: string;

  try {
    const body = await request.json();
    query = body.query;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    // Text search (vector search can be added later when embeddings are populated)
    const nodes = await prisma.node.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { notes: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      include: {
        sourceLinks: { include: { targetNode: true }, take: 5 },
        recalls: true,
      },
      take: 20,
    });

    return NextResponse.json(nodes);
  } catch (err) {
    console.error("[kioku] Search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 5: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add src/app/api/kioku/
git commit -m "feat(kioku): add nodes, graph, search API routes"
```

---

### Task 21: Knowledge Graph Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/knowledge/page.tsx`
- Modify: `src/components/dashboard/Sidebar.tsx` (add Knowledge entry if not present)

**Step 1: Create the knowledge graph page**

Create `src/app/(dashboard)/dashboard/knowledge/page.tsx`:

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type KiokuNode = {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  recalls?: { lastSurfaced: string; surfaceCount: number }[];
  sourceLinks?: { targetNode: { id: string; name: string; tags: string[] } }[];
};

const TAG_COLORS: Record<string, string> = {
  person: "text-blue-400 bg-blue-400/10",
  topic: "text-green-400 bg-green-400/10",
  concept: "text-purple-400 bg-purple-400/10",
  place: "text-amber-400 bg-amber-400/10",
  project: "text-vermillion bg-vermillion/10",
};

export default function KnowledgePage() {
  const [nodes, setNodes] = useState<KiokuNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [newName, setNewName] = useState("");
  const [newTags, setNewTags] = useState("");

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/kioku/nodes?${params}`);
      if (res.ok) setNodes(await res.json());
    } catch (err) {
      console.error("Failed to fetch nodes:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  async function searchNodes(e: React.FormEvent) {
    e.preventDefault();
    fetchNodes();
  }

  async function addNode(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/kioku/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          tags: newTags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewTags("");
        fetchNodes();
      }
    } catch (err) {
      console.error("Failed to add node:", err);
    }
  }

  const types = ["person", "topic", "concept", "place", "project"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Knowledge
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          People, ideas, and connections.
        </p>
      </motion.div>

      {/* Search */}
      <motion.form
        onSubmit={searchNodes}
        className="flex gap-3 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search knowledge..."
          className="flex-1 min-w-[200px] bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <button
          type="submit"
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Search
        </button>
      </motion.form>

      {/* Type Filter */}
      <motion.div
        className="flex gap-2 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          onClick={() => setTypeFilter("")}
          className={`font-mono tracking-[0.12em] uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${
            !typeFilter
              ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
              : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray-light hover:text-sumi-gray"
          }`}
          style={{ fontSize: "var(--text-micro)" }}
        >
          All
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`font-mono tracking-[0.12em] uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${
              typeFilter === t
                ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
                : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray-light hover:text-sumi-gray"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {t}
          </button>
        ))}
      </motion.div>

      {/* Add Node */}
      <motion.form
        onSubmit={addNode}
        className="flex gap-3 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New node name..."
          className="flex-1 min-w-[160px] bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <input
          type="text"
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="w-full sm:w-48 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Add
        </button>
      </motion.form>

      {/* Node Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              Loading...
            </motion.div>
          ) : nodes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              No nodes found. Start building your knowledge graph.
            </motion.div>
          ) : (
            nodes.map((node, i) => (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="text-ink-black font-light"
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {node.name}
                      </h3>
                      {node.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`inline-flex px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase shrink-0 ${
                            TAG_COLORS[tag] || "text-sumi-gray bg-sumi-gray/10"
                          }`}
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {node.notes && (
                      <p
                        className="text-sumi-gray-light mt-1.5 leading-relaxed"
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {node.notes}
                      </p>
                    )}

                    {/* Connected nodes */}
                    {node.sourceLinks && node.sourceLinks.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className="font-mono tracking-[0.08em] text-sumi-gray-light"
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          Connected:
                        </span>
                        {node.sourceLinks.map((link) => (
                          <span
                            key={link.targetNode.id}
                            className="text-sumi-gray font-mono tracking-[0.08em]"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {link.targetNode.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {node.recalls?.[0] && (
                      <span
                        className="font-mono tracking-[0.08em] text-sumi-gray-light mt-1.5 inline-block"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        Surfaced {node.recalls[0].surfaceCount}x
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

**Step 2: Add Knowledge to sidebar if not present**

Check `src/components/dashboard/Sidebar.tsx`. If there's no Knowledge entry, add:

```typescript
{ label: "Knowledge", href: "/dashboard/knowledge", icon: "脳" },
```

**Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/knowledge/page.tsx" src/components/dashboard/Sidebar.tsx
git commit -m "feat(kioku): add knowledge graph page with search, filters, node cards"
```

---

## Workstream 8: Dashboard Home (Tasks 22–23)

### Task 22: Brief API Expansion

**Files:**
- Modify: `src/app/api/dashboard/brief/route.ts`

**Step 1: Expand brief endpoint to return all module summaries**

Replace the existing brief route with a comprehensive version:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const [
      habits,
      activeGoals,
      overdueGoals,
      health,
      investments,
      finances,
      unreadEmails,
      actionEmails,
      pendingCaptures,
      learningTracks,
      currentlyReading,
      queuedReading,
      journalToday,
      planningTravel,
      overdueContacts,
      inProgressCreative,
      activeBlueprints,
    ] = await Promise.all([
      prisma.habit.findMany({
        include: { logs: { where: { date: today }, take: 1 } },
      }),
      prisma.goal.count({ where: { status: "active" } }),
      prisma.goal.count({
        where: { status: "active", deadline: { lt: today } },
      }),
      prisma.healthSnapshot.findFirst({ orderBy: { date: "desc" } }),
      prisma.investment.findMany(),
      prisma.financialSnapshot.findFirst({ orderBy: { date: "desc" } }),
      prisma.emailCache.count({ where: { isRead: false } }),
      prisma.emailCache.count({ where: { category: "action_needed", isRead: false } }),
      prisma.capture.count({ where: { processed: false } }),
      prisma.learningTrack.findFirst({
        orderBy: { updatedAt: "desc" },
      }),
      prisma.readingItem.findFirst({
        where: { status: "reading" },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.readingItem.count({ where: { status: "to_read" } }),
      prisma.journal.findUnique({ where: { date: today } }),
      prisma.travelItem.count({ where: { status: "planning" } }),
      prisma.contact.count({
        where: {
          lastInteraction: { lt: thirtyDaysAgo },
        },
      }),
      prisma.creativeProject.count({ where: { status: "in_progress" } }),
      prisma.goal.count({ where: { status: "active" } }), // Blueprint uses goals model
    ]);

    const habitsCompleted = habits.filter((h) => h.logs.length > 0).length;
    const portfolioValue = investments.reduce(
      (sum, i) => sum + (i.currentPrice ?? 0) * (i.quantity ?? 0),
      0
    );
    const financesData = finances?.data as Record<string, unknown> | undefined;

    return NextResponse.json({
      habits: { completed: habitsCompleted, total: habits.length },
      goals: { active: activeGoals, overdue: overdueGoals },
      health: {
        steps: health?.steps ?? null,
        sleep: health?.sleep ?? null,
      },
      portfolio: {
        totalValue: portfolioValue,
        positions: investments.length,
      },
      finances: {
        netWorth: financesData?.netWorth ?? null,
        debt: financesData?.debt ?? null,
      },
      email: { unread: unreadEmails, actionNeeded: actionEmails },
      captures: { pending: pendingCaptures },
      learning: {
        trackName: learningTracks?.title ?? null,
        progress: learningTracks?.progress ?? null,
      },
      reading: {
        currentlyReading: currentlyReading?.title ?? null,
        queued: queuedReading,
      },
      journal: { writtenToday: !!journalToday },
      travel: { planning: planningTravel },
      people: { overdueReachouts: overdueContacts },
      creative: { inProgress: inProgressCreative },
      blueprint: { active: activeBlueprints },
    });
  } catch (err) {
    console.error("[dashboard] Brief error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add src/app/api/dashboard/brief/
git commit -m "feat(dashboard): expand brief API with all 14 module summaries"
```

---

### Task 23: Dashboard Home Overhaul

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Step 1: Overhaul dashboard home**

Replace the existing dashboard home with a briefing card + live module cards grid. Read the current file first to understand existing structure, then modify.

Key sections:
1. **Kemi Briefing Card** at top — calls `/api/kemi/briefing`, collapsible
2. **Module Cards Grid** — 3 columns desktop, 2 columns mobile

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type DashboardBrief = {
  habits: { completed: number; total: number };
  goals: { active: number; overdue: number };
  health: { steps: number | null; sleep: number | null };
  portfolio: { totalValue: number; positions: number };
  finances: { netWorth: number | null; debt: number | null };
  email: { unread: number; actionNeeded: number };
  captures: { pending: number };
  learning: { trackName: string | null; progress: number | null };
  reading: { currentlyReading: string | null; queued: number };
  journal: { writtenToday: boolean };
  travel: { planning: number };
  people: { overdueReachouts: number };
  creative: { inProgress: number };
  blueprint: { active: number };
};

const MODULES = [
  {
    key: "habits",
    label: "Habits",
    href: "/dashboard/habits",
    icon: "習",
    render: (d: DashboardBrief) => `${d.habits.completed}/${d.habits.total} today`,
  },
  {
    key: "goals",
    label: "Goals",
    href: "/dashboard/goals",
    icon: "的",
    render: (d: DashboardBrief) =>
      `${d.goals.active} active${d.goals.overdue > 0 ? `, ${d.goals.overdue} overdue` : ""}`,
  },
  {
    key: "health",
    label: "Health",
    href: "/dashboard/health",
    icon: "体",
    render: (d: DashboardBrief) =>
      `${d.health.steps?.toLocaleString() ?? "—"} steps, ${d.health.sleep ?? "—"}h sleep`,
  },
  {
    key: "portfolio",
    label: "Portfolio",
    href: "/dashboard/investments",
    icon: "株",
    render: (d: DashboardBrief) =>
      `$${d.portfolio.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
  },
  {
    key: "finances",
    label: "Finances",
    href: "/dashboard/finances",
    icon: "金",
    render: (d: DashboardBrief) =>
      d.finances.netWorth !== null
        ? `NW $${d.finances.netWorth.toLocaleString()}`
        : "No data yet",
  },
  {
    key: "email",
    label: "Email",
    href: "/dashboard/email",
    icon: "信",
    render: (d: DashboardBrief) =>
      `${d.email.unread} unread${d.email.actionNeeded > 0 ? `, ${d.email.actionNeeded} action` : ""}`,
  },
  {
    key: "captures",
    label: "Captures",
    href: "/dashboard/captures",
    icon: "捕",
    render: (d: DashboardBrief) =>
      d.captures.pending > 0 ? `${d.captures.pending} pending` : "All clear",
  },
  {
    key: "learning",
    label: "Learning",
    href: "/dashboard/learning",
    icon: "学",
    render: (d: DashboardBrief) =>
      d.learning.trackName
        ? `${d.learning.trackName} — ${Math.round(d.learning.progress ?? 0)}%`
        : "No active tracks",
  },
  {
    key: "reading",
    label: "Reading",
    href: "/dashboard/reading",
    icon: "読",
    render: (d: DashboardBrief) =>
      d.reading.currentlyReading
        ? `${d.reading.currentlyReading}`
        : `${d.reading.queued} queued`,
  },
  {
    key: "journal",
    label: "Journal",
    href: "/dashboard/journal",
    icon: "記",
    render: (d: DashboardBrief) =>
      d.journal.writtenToday ? "Written today" : "Not yet",
  },
  {
    key: "travel",
    label: "Travel",
    href: "/dashboard/travel",
    icon: "旅",
    render: (d: DashboardBrief) =>
      d.travel.planning > 0 ? `${d.travel.planning} planning` : "No plans",
  },
  {
    key: "people",
    label: "People",
    href: "/dashboard/people",
    icon: "人",
    render: (d: DashboardBrief) =>
      d.people.overdueReachouts > 0
        ? `${d.people.overdueReachouts} overdue`
        : "All caught up",
  },
  {
    key: "creative",
    label: "Creative",
    href: "/dashboard/creative",
    icon: "芸",
    render: (d: DashboardBrief) =>
      d.creative.inProgress > 0
        ? `${d.creative.inProgress} in progress`
        : "No projects",
  },
  {
    key: "blueprint",
    label: "Blueprint",
    href: "/dashboard/blueprint",
    icon: "図",
    render: (d: DashboardBrief) =>
      d.blueprint.active > 0 ? `${d.blueprint.active} active` : "None",
  },
];

export default function DashboardHome() {
  const [brief, setBrief] = useState<DashboardBrief | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/brief");
      if (res.ok) setBrief(await res.json());
    } catch (err) {
      console.error("Failed to fetch brief:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const res = await fetch("/api/kemi/briefing");
      if (res.ok) {
        const data = await res.json();
        setBriefing(data.briefing);
      }
    } catch (err) {
      console.error("Failed to fetch briefing:", err);
    } finally {
      setBriefingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
    fetchBriefing();
  }, [fetchBrief, fetchBriefing]);

  return (
    <div className="space-y-8">
      {/* Kemi Briefing Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-parchment-warm/40 border border-vermillion/20 rounded-xl p-5"
      >
        <button
          onClick={() => setBriefingOpen(!briefingOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-vermillion text-lg">恵</span>
            <span
              className="font-mono tracking-[0.12em] uppercase text-vermillion"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Kemi&apos;s Briefing
            </span>
          </div>
          <span className="text-sumi-gray-light text-sm">
            {briefingOpen ? "−" : "+"}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {briefingOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div
                className="mt-4 text-ink-black leading-relaxed whitespace-pre-line"
                style={{ fontSize: "var(--text-body)" }}
              >
                {briefingLoading
                  ? "Generating your briefing..."
                  : briefing || "No briefing available."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Module Cards Grid */}
      {loading || !brief ? (
        <div className="text-sumi-gray-light text-sm py-8 text-center">
          Loading dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((mod, i) => (
            <motion.div
              key={mod.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2 + i * 0.03,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={mod.href}
                className="block bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/30 transition-colors duration-300 h-full"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl opacity-60">{mod.icon}</span>
                  <span
                    className="font-mono tracking-[0.12em] uppercase text-sumi-gray"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {mod.label}
                  </span>
                </div>
                <p
                  className="text-ink-black font-light leading-snug"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {mod.render(brief)}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat(dashboard): overhaul home with Kemi briefing card + live module cards grid"
```

---

## Environment Variables Checklist

Before deploying, ensure these are set in `.env.local`:

```
# Existing
DATABASE_URL=...
ANTHROPIC_API_KEY=...

# New for Health Auto Export
HEALTH_INGEST_KEY=<generate a random 32-char string>

# New for Gmail API
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=...
GMAIL_REFRESH_TOKEN=...
```

Gmail OAuth2 setup:
1. Create project in Google Cloud Console
2. Enable Gmail API
3. Create OAuth2 credentials (web app)
4. Run one-time auth flow to get refresh token
5. Store in `.env.local`

---

## Final Verification

After all tasks are complete:

```bash
cd /Users/mac/prod/Me.io
npx prisma migrate dev --name verify
npm run build
```

Test each module:
1. Investments — add position with quantity, sync prices
2. Finances — sync from Copilot Money, view transactions
3. Health — POST to `/api/health/ingest` with test data
4. Email — sync Gmail, view digest
5. Captures — create capture, verify auto-route suggestion
6. Knowledge — search nodes, add manual node
7. Kemi — ask "how are my habits?" — verify tool_use works
8. Dashboard — verify briefing card loads, all module cards show live data
