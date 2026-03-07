import { scoreComplexity, classifyIntent, selectModel } from "@/lib/kemi/router";
import { MODEL_HAIKU, MODEL_SONNET } from "@/lib/kemi/config";

// ---------------------------------------------------------------------------
// scoreComplexity
// ---------------------------------------------------------------------------
describe("scoreComplexity", () => {
  it.each([
    ["hi", "simple"],
    ["Hello", "simple"],
    ["hey", "simple"],
    ["yo", "simple"],
    ["good morning", "simple"],
    ["good afternoon", "simple"],
  ] as const)("greeting '%s' → simple", (input, expected) => {
    expect(scoreComplexity(input)).toBe(expected);
  });

  it.each([
    ["ok", "simple"],
    ["sure", "simple"],
    ["thanks", "simple"],
    ["thank you", "simple"],
    ["got it", "simple"],
    ["cool", "simple"],
  ] as const)("acknowledgment '%s' → simple", (input, expected) => {
    expect(scoreComplexity(input)).toBe(expected);
  });

  it.each([
    ["what time is it", "simple"],
    ["what day is it", "simple"],
  ] as const)("time query '%s' → simple", (input, expected) => {
    expect(scoreComplexity(input)).toBe(expected);
  });

  it.each([
    ["create task", "simple"],
    ["show list", "simple"],
    ["delete item", "simple"],
    ["check status", "simple"],
  ] as const)("short command '%s' → simple", (input, expected) => {
    expect(scoreComplexity(input)).toBe(expected);
  });

  it("short message (<=8 words) without pattern → simple", () => {
    expect(scoreComplexity("set alarm for 7am tomorrow")).toBe("simple");
  });

  it.each([
    "analyse the quarterly revenue trends across all regions",
    "compare our pricing strategy versus competitors",
    "evaluate the team performance for this quarter",
    "break down the marketing spend by channel",
  ])("analytical request '%s' → complex", (input) => {
    expect(scoreComplexity(input)).toBe("complex");
  });

  it("research + summarize → complex", () => {
    expect(
      scoreComplexity(
        "research the latest shipping regulations and summarize the key changes"
      )
    ).toBe("complex");
  });

  it("restructure request → complex", () => {
    expect(
      scoreComplexity("restructure the project folder layout for better modularity")
    ).toBe("complex");
  });

  it("long message (>=30 words) → complex", () => {
    const words = Array(31).fill("word").join(" ");
    expect(scoreComplexity(words)).toBe("complex");
  });

  it("2+ conjunctions → complex", () => {
    expect(
      scoreComplexity(
        "update the docs and fix the tests and then deploy the staging build"
      )
    ).toBe("complex");
  });

  it("medium-length message with no special patterns → moderate", () => {
    expect(
      scoreComplexity(
        "can you look at the shipping tracker page and tell me what you think"
      )
    ).toBe("moderate");
  });
});

// ---------------------------------------------------------------------------
// classifyIntent
// ---------------------------------------------------------------------------
describe("classifyIntent", () => {
  it.each([
    ["create a task for the meeting", "task"],
    ["show my todo list", "task"],
    ["what is overdue", "task"],
    ["set a reminder for Friday", "task"],
  ] as const)("'%s' → %s", (input, expected) => {
    expect(classifyIntent(input)).toBe(expected);
  });

  it.each([
    ["send an email to John", "comms"],
    ["draft a reply to the client", "comms"],
    ["check my inbox", "comms"],
    ["text Sarah about dinner", "comms"],
  ] as const)("'%s' → %s", (input, expected) => {
    expect(classifyIntent(input)).toBe(expected);
  });

  it.each([
    ["schedule a meeting for Tuesday", "calendar"],
    ["book a slot at 3pm", "calendar"],
    ["reschedule the appointment to next week", "calendar"],
    ["what events do I have tomorrow", "calendar"],
  ] as const)("'%s' → %s", (input, expected) => {
    expect(classifyIntent(input)).toBe(expected);
  });

  it.each([
    ["remember that the gate code is 4521", "memory"],
    ["what did I say about the project", "memory"],
    ["recall that note from last week", "memory"],
    ["I forgot the password", "memory"],
  ] as const)("'%s' → %s", (input, expected) => {
    expect(classifyIntent(input)).toBe(expected);
  });

  it.each([
    ["what's the weather like", "general"],
    ["tell me a joke", "general"],
    ["how are you doing", "general"],
  ] as const)("'%s' → %s (general fallback)", (input, expected) => {
    expect(classifyIntent(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// selectModel
// ---------------------------------------------------------------------------
describe("selectModel", () => {
  it("simple message → Haiku", () => {
    expect(selectModel("hi")).toBe(MODEL_HAIKU);
    expect(selectModel("thanks")).toBe(MODEL_HAIKU);
    expect(selectModel("show list")).toBe(MODEL_HAIKU);
  });

  it("moderate message → Sonnet", () => {
    expect(
      selectModel(
        "can you look at the shipping tracker page and tell me what you think"
      )
    ).toBe(MODEL_SONNET);
  });

  it("complex message → Sonnet", () => {
    expect(
      selectModel("analyse the quarterly revenue trends across all regions")
    ).toBe(MODEL_SONNET);
  });
});
