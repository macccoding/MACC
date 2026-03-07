import { slugify, parseExtractionResponse } from "@/lib/kioku/extract";

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------
describe("slugify", () => {
  it("converts 'Mike Chen' to 'mike-chen'", () => {
    expect(slugify("Mike Chen")).toBe("mike-chen");
  });

  it("converts 'Porsche 911 RWB' to 'porsche-911-rwb'", () => {
    expect(slugify("Porsche 911 RWB")).toBe("porsche-911-rwb");
  });

  it("handles special characters", () => {
    expect(slugify("C++ Programming!")).toBe("c-programming");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("collapses multiple non-alphanumeric chars into a single hyphen", () => {
    expect(slugify("a   b   c")).toBe("a-b-c");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles all-special-character input", () => {
    expect(slugify("@#$%^&*")).toBe("");
  });

  it("preserves numbers", () => {
    expect(slugify("Agent 007")).toBe("agent-007");
  });
});

// ---------------------------------------------------------------------------
// parseExtractionResponse
// ---------------------------------------------------------------------------
describe("parseExtractionResponse", () => {
  it("parses a valid JSON array of triples", () => {
    const input = JSON.stringify([
      { subject: "Mike", predicate: "lives_in", object: "Jamaica" },
      { subject: "Mike", predicate: "owns", object: "Porsche 911" },
    ]);
    const result = parseExtractionResponse(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      subject: "Mike",
      predicate: "lives_in",
      object: "Jamaica",
    });
  });

  it("strips markdown code fences before parsing", () => {
    const input = '```json\n[{"subject":"A","predicate":"b","object":"C"}]\n```';
    const result = parseExtractionResponse(input);
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("A");
  });

  it("returns [] for invalid JSON", () => {
    expect(parseExtractionResponse("not json at all")).toEqual([]);
  });

  it("returns [] for non-array JSON", () => {
    expect(
      parseExtractionResponse('{"subject":"A","predicate":"b","object":"C"}')
    ).toEqual([]);
  });

  it("filters out triples with empty subject", () => {
    const input = JSON.stringify([
      { subject: "", predicate: "lives_in", object: "Jamaica" },
      { subject: "Mike", predicate: "owns", object: "car" },
    ]);
    const result = parseExtractionResponse(input);
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Mike");
  });

  it("filters out triples with empty predicate", () => {
    const input = JSON.stringify([
      { subject: "Mike", predicate: "", object: "Jamaica" },
    ]);
    expect(parseExtractionResponse(input)).toEqual([]);
  });

  it("filters out triples with empty object", () => {
    const input = JSON.stringify([
      { subject: "Mike", predicate: "lives_in", object: "" },
    ]);
    expect(parseExtractionResponse(input)).toEqual([]);
  });

  it("filters out triples with whitespace-only fields", () => {
    const input = JSON.stringify([
      { subject: "  ", predicate: "lives_in", object: "Jamaica" },
    ]);
    expect(parseExtractionResponse(input)).toEqual([]);
  });

  it("filters out triples with non-string fields", () => {
    const input = JSON.stringify([
      { subject: 123, predicate: "lives_in", object: "Jamaica" },
    ]);
    expect(parseExtractionResponse(input)).toEqual([]);
  });

  it("returns [] for empty string", () => {
    expect(parseExtractionResponse("")).toEqual([]);
  });
});
