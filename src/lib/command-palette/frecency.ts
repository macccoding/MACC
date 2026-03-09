/**
 * Frecency tracker backed by localStorage.
 * Combines frequency (how often) and recency (how recently) for ranking.
 */

const STORAGE_KEY = "mikeos-command-frecency";
const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface FrecencyEntry {
  count: number;
  lastUsed: number;
}

function load(): Record<string, FrecencyEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(data: Record<string, FrecencyEntry>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function recordUsage(commandId: string) {
  const data = load();
  const existing = data[commandId];
  data[commandId] = {
    count: (existing?.count || 0) + 1,
    lastUsed: Date.now(),
  };
  save(data);
}

export function getFrecencyScore(commandId: string): number {
  const data = load();
  const entry = data[commandId];
  if (!entry) return 0;

  const age = Date.now() - entry.lastUsed;
  const recency = Math.exp(-age / HALF_LIFE_MS);
  return entry.count * recency;
}
