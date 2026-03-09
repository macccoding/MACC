/**
 * Simple fuzzy substring scoring. Returns 0 (no match) to 1 (exact match).
 * Rewards: exact match > starts-with > consecutive substring > scattered chars.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (!q) return 0;
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.9;
  if (t.includes(q)) return 0.7;

  // Character-by-character matching
  let qi = 0;
  let consecutive = 0;
  let maxConsecutive = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  }

  if (qi < q.length) return 0; // not all chars matched

  return 0.3 + (maxConsecutive / q.length) * 0.3;
}
