import { matchesAny, formatJamaicaTime, buildContext } from "@/lib/kemi/context";

// ---------------------------------------------------------------------------
// matchesAny
// ---------------------------------------------------------------------------
describe("matchesAny", () => {
  it("returns true when text contains a keyword", () => {
    expect(matchesAny("show my task list", ["task", "todo"])).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(matchesAny("Show my TASK list", ["task"])).toBe(true);
  });

  it("returns false when no keywords match", () => {
    expect(matchesAny("hello world", ["task", "todo", "reminder"])).toBe(false);
  });

  it("matches multi-word keywords", () => {
    expect(matchesAny("what did i say about that", ["what did i"])).toBe(true);
  });

  it("returns false for empty keyword list", () => {
    expect(matchesAny("anything", [])).toBe(false);
  });

  it("returns false for empty text", () => {
    expect(matchesAny("", ["task"])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatJamaicaTime
// ---------------------------------------------------------------------------
describe("formatJamaicaTime", () => {
  it("returns a string containing 'Jamaica' timezone markers", () => {
    // The formatted string won't literally say "Jamaica" but will include
    // day-of-week, date, and time components
    const result = formatJamaicaTime();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(10);
    // Should have a day of week
    expect(result).toMatch(
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/
    );
    // Should have AM or PM
    expect(result).toMatch(/(AM|PM)/);
  });
});

// ---------------------------------------------------------------------------
// buildContext
// ---------------------------------------------------------------------------
describe("buildContext", () => {
  it("always includes Jamaica timestamp", async () => {
    const ctx = await buildContext("hello");
    expect(ctx).toContain("Jamaica");
    expect(ctx).toMatch(
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/
    );
  });

  it("includes task placeholder when message mentions tasks", async () => {
    const ctx = await buildContext("show my overdue tasks");
    expect(ctx).toContain("Tasks");
  });

  it("degrades gracefully when Kioku recall is unavailable", async () => {
    // When recall import fails (no DB), the catch block silently degrades
    const ctx = await buildContext("do you remember the gate code");
    // Should still have the timestamp, but no crash
    expect(ctx).toContain("Jamaica");
  });

  it("does not include task section for unrelated messages", async () => {
    const ctx = await buildContext("what is the weather");
    expect(ctx).not.toContain("Tasks");
  });

  it("stays within MAX_CONTEXT_CHARS budget", async () => {
    const ctx = await buildContext(
      "remember this and check my tasks and recall that note"
    );
    expect(ctx.length).toBeLessThanOrEqual(1800);
  });
});
