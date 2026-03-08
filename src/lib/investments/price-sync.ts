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
      errors.push(
        `Yahoo Finance error: ${err instanceof Error ? err.message : String(err)}`
      );
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
      errors.push(
        `CoinGecko error: ${err instanceof Error ? err.message : String(err)}`
      );
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
      return {
        price: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  try {
    const quote = await yahooFinance.quote(symbol.toUpperCase());
    return { price: quote.regularMarketPrice ?? null };
  } catch (err) {
    return {
      price: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
