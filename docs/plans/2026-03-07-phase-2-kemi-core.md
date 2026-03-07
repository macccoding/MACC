# Phase 2: Kemi + Core Modules — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up Kemi AI agent (Claude API), Kioku knowledge pipeline, Quick Capture API, Goals & Habits tracker, Financial Pulse module, and streaming chat — porting the Python Kemi v1 architecture to TypeScript.

**Architecture:** Kemi agent lives in `src/lib/kemi/` as a pure TypeScript module. The `/api/kemi` route accepts user messages, routes to the correct Claude model (Haiku/Sonnet) based on complexity scoring, builds dynamic context, calls Claude with tool_use, executes tools in a loop, saves conversation, and streams the response via Server-Sent Events. Kioku pipeline in `src/lib/kioku/` handles entity extraction, node upsert, and vector-based RAG recall. Dashboard modules are CRUD API routes + React pages using the existing sumi-e design system.

**Tech Stack:** Next.js 16, TypeScript, Anthropic SDK (`@anthropic-ai/sdk`), Prisma 7 (existing schema), Framer Motion, Tailwind CSS v4 (existing sumi-e tokens).

**Reference:**
- Design doc: `docs/plans/2026-03-07-mikechen-xyz-design.md`
- Kemi v1 source: `/Users/mac/prod/kemi/agent/` (Python, architecture reference)
- Existing Prisma schema: `prisma/schema.prisma` (17 models already defined)

---

## Task 1: Install Anthropic SDK and add env vars

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

**Step 1: Install the Anthropic SDK**

Run:
```bash
cd /Users/mac/prod/me.io && npm install @anthropic-ai/sdk
```

**Step 2: Add API key to .env.local**

Append to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-xxx
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @anthropic-ai/sdk"
```

---

## Task 2: Kemi router — complexity scoring and model selection

**Files:**
- Create: `src/lib/kemi/router.ts`
- Create: `src/lib/kemi/config.ts`
- Test: `src/__tests__/kemi/router.test.ts`

**Step 1: Create config with model constants**

```typescript
// src/lib/kemi/config.ts
export const MODEL_HAIKU = "claude-haiku-4-5-20251001";
export const MODEL_SONNET = "claude-sonnet-4-5-20250929";

export const MAX_TOOL_ITERATIONS = 5;
export const MAX_CONVERSATION_HISTORY = 6;
export const MAX_OUTPUT_TOKENS = 2048;
```

**Step 2: Write the failing tests**

```typescript
// src/__tests__/kemi/router.test.ts
import { scoreComplexity, classifyIntent, selectModel } from "@/lib/kemi/router";
import { MODEL_HAIKU, MODEL_SONNET } from "@/lib/kemi/config";

describe("scoreComplexity", () => {
  it("returns simple for greetings", () => {
    expect(scoreComplexity("hi")).toBe("simple");
    expect(scoreComplexity("hello")).toBe("simple");
    expect(scoreComplexity("hey")).toBe("simple");
    expect(scoreComplexity("good morning")).toBe("simple");
  });

  it("returns simple for short messages (<=8 words)", () => {
    expect(scoreComplexity("what time is it")).toBe("simple");
    expect(scoreComplexity("thanks")).toBe("simple");
    expect(scoreComplexity("ok got it")).toBe("simple");
  });

  it("returns complex for analysis requests", () => {
    expect(scoreComplexity("analyze my spending patterns over the last quarter")).toBe("complex");
    expect(scoreComplexity("compare my investment portfolio performance")).toBe("complex");
  });

  it("returns complex for long multi-part messages", () => {
    const long = "I need you to research the best travel insurance options and then also compare prices and additionally check if my credit card covers any of this";
    expect(scoreComplexity(long)).toBe("complex");
  });

  it("returns moderate for medium requests", () => {
    expect(scoreComplexity("can you check my email and let me know if anything is urgent from the team")).toBe("moderate");
  });
});

describe("classifyIntent", () => {
  it("detects task intent", () => {
    expect(classifyIntent("create a task for tomorrow")).toBe("task");
    expect(classifyIntent("what's overdue")).toBe("task");
  });

  it("detects comms intent", () => {
    expect(classifyIntent("draft an email to Sarah")).toBe("comms");
    expect(classifyIntent("reply to that thread")).toBe("comms");
  });

  it("detects calendar intent", () => {
    expect(classifyIntent("schedule a meeting for Friday")).toBe("calendar");
  });

  it("detects memory intent", () => {
    expect(classifyIntent("do you remember what I said about the project")).toBe("memory");
  });

  it("returns general for unclassified", () => {
    expect(classifyIntent("yo what's good")).toBe("general");
  });
});

describe("selectModel", () => {
  it("routes simple to Haiku", () => {
    expect(selectModel("hi")).toBe(MODEL_HAIKU);
  });

  it("routes moderate to Sonnet", () => {
    expect(selectModel("can you check my email and flag anything important from the team")).toBe(MODEL_SONNET);
  });

  it("routes complex to Sonnet", () => {
    expect(selectModel("analyze my spending patterns and compare to last month")).toBe(MODEL_SONNET);
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/mac/prod/me.io && npx jest src/__tests__/kemi/router.test.ts --no-cache 2>&1 || true`

If jest is not configured, install it first:
```bash
npm install -D jest ts-jest @types/jest @jest/globals
```

Create `jest.config.ts`:
```typescript
import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: pathsToModuleNameMapper(
    { "@/*": ["./src/*"] },
    { prefix: "<rootDir>/" }
  ),
};

export default config;
```

Expected: FAIL — module not found

**Step 4: Write the router implementation**

```typescript
// src/lib/kemi/router.ts
import { MODEL_HAIKU, MODEL_SONNET } from "./config";

const SIMPLE_PATTERNS = [
  /^(hi|hello|hey|good morning|good evening|yo|sup)\b/,
  /^what time/,
  /^what's the time/,
  /^how are you/,
  /^thanks|^thank you/,
  /^ok\b|^okay\b|^got it|^sure/,
  /^check\b/,
  /^show\b/,
  /^(create|add)\s+a?\s*(task|event)/,
  /^(mark|complete)\b/,
];

const COMPLEX_PATTERNS = [
  /compar(e|ing|ison)/,
  /analy(ze|sis|se)/,
  /strateg(y|ic|ize)/,
  /plan(ning)?\s+(for|out|ahead)/,
  /draft.+email.+and/,
  /research.+and.+(summarize|report|analyze)/,
  /(multiple|several|all).+(business|unit|project)/,
  /(restructure|reorganize|overhaul)/,
];

const INTENT_CATEGORIES: Record<string, string[]> = {
  task: ["task", "todo", "remind", "due", "deadline", "overdue", "create a task"],
  comms: ["email", "message", "tell", "send", "draft", "reply", "respond"],
  calendar: ["calendar", "schedule", "meeting", "appointment", "when is"],
  memory: ["remember", "recall", "you mentioned", "last time", "did i"],
};

export function scoreComplexity(message: string): "simple" | "moderate" | "complex" {
  const lower = message.toLowerCase().trim();

  for (const pattern of SIMPLE_PATTERNS) {
    if (pattern.test(lower)) return "simple";
  }

  for (const pattern of COMPLEX_PATTERNS) {
    if (pattern.test(lower)) return "complex";
  }

  const wordCount = message.split(/\s+/).length;
  if (wordCount <= 8) return "simple";
  if (wordCount >= 30) return "complex";

  const conjunctions = (lower.match(/\b(and then|and also|then|also|plus|additionally)\b/g) || []).length;
  if (conjunctions >= 2) return "complex";

  return "moderate";
}

export function classifyIntent(message: string): string {
  const lower = message.toLowerCase().trim();

  for (const [intent, keywords] of Object.entries(INTENT_CATEGORIES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return intent;
    }
  }

  return "general";
}

export function selectModel(message: string): string {
  const complexity = scoreComplexity(message);
  return complexity === "simple" ? MODEL_HAIKU : MODEL_SONNET;
}
```

**Step 5: Run tests to verify they pass**

Run: `cd /Users/mac/prod/me.io && npx jest src/__tests__/kemi/router.test.ts --no-cache`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/lib/kemi/config.ts src/lib/kemi/router.ts src/__tests__/kemi/router.test.ts jest.config.ts package.json package-lock.json
git commit -m "feat(kemi): add complexity router and model selection"
```

---

## Task 3: Kemi system prompt and context builder

**Files:**
- Create: `src/lib/kemi/system-prompt.ts`
- Create: `src/lib/kemi/context.ts`
- Test: `src/__tests__/kemi/context.test.ts`

**Step 1: Write the system prompt (port from v1)**

```typescript
// src/lib/kemi/system-prompt.ts
export const PERSONALITY_PROMPT = `You are Kemi, Mike Chen's personal AI assistant — his Life OS.

## Voice
- Sharp, warm, direct, and practical.
- Understand Jamaican English/Patois naturally.
- Be brief by default. Be detailed only when the stakes require it.
- With Mike: personal and direct. With external parties: polished and professional.

## Mike Context
- Mike Chen is based in Mandeville, Jamaica (America/Jamaica, UTC-5).
- Mike often sends voice notes and forgets verbal commitments; capture follow-ups proactively.

## Decision Rules
- Low stakes (under US$100 / J$15,000): handle autonomously.
- High stakes: ask first with clear options and recommendation.
- Always ask before: deletions, legal commitments, external-facing commitments.

## Operating Rules
- Convert user intent into concrete actions using tools.
- Prefer completing work over discussing work.
- When done, summarize outcome and key next actions.

## Tool Usage
- Memory: use naturally; do not expose internal retrieval mechanics.
- Tasks: keep priorities clear; nudge stalled or overdue work.

## Communication Constraints
- No fluff, no corporate filler, no overuse of emojis.
- Be candid when Mike is slipping.
- If blocked, state exactly what is missing and ask one clear follow-up.`;

export function getSystemPromptParts(dynamicContext: string): [string, string] {
  return [PERSONALITY_PROMPT, `## CURRENT CONTEXT\n\n${dynamicContext}`];
}
```

**Step 2: Write context builder tests**

```typescript
// src/__tests__/kemi/context.test.ts
import { buildContext, matchesAny } from "@/lib/kemi/context";

describe("matchesAny", () => {
  it("matches keywords in text", () => {
    expect(matchesAny("what tasks are overdue", new Set(["task", "todo", "overdue"]))).toBe(true);
  });

  it("returns false when no match", () => {
    expect(matchesAny("hello world", new Set(["task", "todo"]))).toBe(false);
  });
});

describe("buildContext", () => {
  it("includes timestamp", async () => {
    const ctx = await buildContext("test");
    expect(ctx).toContain("Current time:");
    expect(ctx).toContain("Jamaica");
  });

  it("respects MAX_CONTEXT_CHARS budget", async () => {
    const ctx = await buildContext("tell me about everything I need to know about tasks and email and calendar");
    expect(ctx.length).toBeLessThanOrEqual(1800 + 50); // small margin for joins
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/mac/prod/me.io && npx jest src/__tests__/kemi/context.test.ts --no-cache 2>&1 || true`
Expected: FAIL

**Step 4: Write context builder implementation**

```typescript
// src/lib/kemi/context.ts
const MAX_CONTEXT_CHARS = 1800;

const TASK_KEYWORDS = new Set(["task", "todo", "overdue", "deadline", "what's open", "briefing", "digest", "what should"]);
const MEMORY_KEYWORDS = new Set(["remember", "earlier", "before", "last time", "previous", "you said", "i said"]);

export function matchesAny(text: string, keywords: Set<string>): boolean {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) return true;
  }
  return false;
}

function appendWithBudget(parts: string[], section: string): void {
  if (!section) return;
  const currentSize = parts.join("\n").length;
  const remaining = MAX_CONTEXT_CHARS - currentSize;
  if (remaining <= 0) return;

  if (section.length > remaining) {
    if (remaining <= 20) return;
    section = section.slice(0, remaining - 13).trimEnd() + "\n...[trimmed]";
  }
  parts.push(section);
}

function formatJamaicaTime(): string {
  const now = new Date();
  // Jamaica is UTC-5 (no DST)
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Jamaica",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return fmt.format(now);
}

export async function buildContext(userMessage: string): Promise<string> {
  const parts: string[] = [];

  appendWithBudget(parts, `Current time: ${formatJamaicaTime()} (Jamaica, UTC-5)\nChannel: dashboard`);

  // Task snapshot — Phase 2 will wire up real DB queries
  const includeTasks = matchesAny(userMessage, TASK_KEYWORDS);
  if (includeTasks) {
    // TODO: Query goals/habits from Prisma
    appendWithBudget(parts, "TASK SNAPSHOT:\n  (No tasks configured yet)");
  }

  // Memory recall — Phase 2 will wire up Kioku RAG
  const includeMemories = userMessage.trim().length >= 20 || matchesAny(userMessage, MEMORY_KEYWORDS);
  if (includeMemories) {
    // TODO: Wire up Kioku recall
  }

  return parts.join("\n\n");
}
```

**Step 5: Run tests to verify they pass**

Run: `cd /Users/mac/prod/me.io && npx jest src/__tests__/kemi/context.test.ts --no-cache`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/lib/kemi/system-prompt.ts src/lib/kemi/context.ts src/__tests__/kemi/context.test.ts
git commit -m "feat(kemi): add system prompt and context builder"
```

---

## Task 4: Kemi agent core — process message with Claude API

**Files:**
- Create: `src/lib/kemi/agent.ts`
- Create: `src/lib/kemi/types.ts`

**Step 1: Create shared types**

```typescript
// src/lib/kemi/types.ts
export interface KemiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface KemiResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface KemiToolResult {
  name: string;
  result: string;
}
```

**Step 2: Write the agent core**

```typescript
// src/lib/kemi/agent.ts
import Anthropic from "@anthropic-ai/sdk";
import { selectModel } from "./router";
import { getSystemPromptParts } from "./system-prompt";
import { buildContext } from "./context";
import { MAX_TOOL_ITERATIONS, MAX_OUTPUT_TOKENS, MAX_CONVERSATION_HISTORY } from "./config";
import type { KemiMessage, KemiResponse } from "./types";

const anthropic = new Anthropic();

export async function processMessage(
  userMessage: string,
  history: KemiMessage[] = []
): Promise<KemiResponse> {
  const model = selectModel(userMessage);
  const dynamicContext = await buildContext(userMessage);
  const [staticPrompt, dynamicPrompt] = getSystemPromptParts(dynamicContext);

  // Trim history to budget
  const recentHistory = history.slice(-MAX_CONVERSATION_HISTORY);

  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const systemBlocks: Anthropic.TextBlockParam[] = [
    { type: "text", text: staticPrompt, cache_control: { type: "ephemeral" } },
    { type: "text", text: dynamicPrompt },
  ];

  let response = await anthropic.messages.create({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: systemBlocks,
    messages,
  });

  // Tool use loop
  let iterations = 0;
  while (
    response.stop_reason === "tool_use" &&
    iterations < MAX_TOOL_ITERATIONS
  ) {
    const toolBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = toolBlocks.map((block) => ({
      type: "tool_result" as const,
      tool_use_id: block.id,
      content: JSON.stringify({ error: "Tool not yet implemented" }),
    }));

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemBlocks,
      messages,
    });

    iterations++;
  }

  // Extract text response
  const textContent = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    content: textContent,
    model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
```

**Step 3: Commit**

```bash
git add src/lib/kemi/types.ts src/lib/kemi/agent.ts
git commit -m "feat(kemi): add agent core with Claude API integration"
```

---

## Task 5: Kemi API route — `/api/kemi`

**Files:**
- Create: `src/app/api/kemi/route.ts`

**Step 1: Write the API route**

```typescript
// src/app/api/kemi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/lib/kemi/agent";
import type { KemiMessage } from "@/lib/kemi/types";

export async function POST(request: NextRequest) {
  // Check auth
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message, history } = (await request.json()) as {
      message: string;
      history?: KemiMessage[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const response = await processMessage(message, history || []);

    return NextResponse.json({
      content: response.content,
      model: response.model,
    });
  } catch (error) {
    console.error("[Kemi API]", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/api/kemi/route.ts
git commit -m "feat(kemi): add /api/kemi POST route"
```

---

## Task 6: Wire ChatPanel to real Kemi API

**Files:**
- Modify: `src/components/kemi/ChatPanel.tsx`

**Step 1: Replace the placeholder echo with real API call**

In `ChatPanel.tsx`, replace the `handleSend` callback body:

```typescript
const handleSend = useCallback(async (content: string) => {
  const userMsg: Message = {
    id: Date.now().toString(),
    role: "user",
    content,
    timestamp: getTime(),
  };
  setMessages((prev) => [...prev, userMsg]);
  setLoading(true);

  try {
    // Build history from existing messages (exclude the welcome message)
    const apiHistory = messages
      .filter((m) => m.id !== "1")
      .map((m) => ({
        role: m.role === "kemi" ? "assistant" as const : "user" as const,
        content: m.content,
      }));

    const res = await fetch("/api/kemi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, history: apiHistory }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "kemi",
        content: data.content || data.error || "Something went wrong.",
        timestamp: getTime(),
      },
    ]);
  } catch {
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "kemi",
        content: "Connection failed. Try again.",
        timestamp: getTime(),
      },
    ]);
  } finally {
    setLoading(false);
  }
}, [messages]);
```

**Step 2: Test manually**

Run dev server, navigate to dashboard, open Kemi chat panel, send a message. Should get a real Claude response (requires valid `ANTHROPIC_API_KEY` in `.env.local`).

**Step 3: Commit**

```bash
git add src/components/kemi/ChatPanel.tsx
git commit -m "feat(kemi): wire ChatPanel to /api/kemi"
```

---

## Task 7: Quick Capture API

**Files:**
- Create: `src/app/api/captures/route.ts`
- Modify: `src/components/dashboard/QuickCapture.tsx`

**Step 1: Write the captures API route**

```typescript
// src/app/api/captures/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, category } = await request.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const capture = await prisma.capture.create({
    data: { content: content.trim(), category: category || null },
  });

  return NextResponse.json(capture, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const processed = searchParams.get("processed");

  const captures = await prisma.capture.findMany({
    where: processed !== null ? { processed: processed === "true" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(captures);
}
```

**Step 2: Wire QuickCapture component to the API**

In `QuickCapture.tsx`, replace the `handleSubmit` body:

```typescript
const handleSubmit = useCallback(
  async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    try {
      await fetch("/api/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value.trim() }),
      });
    } catch (err) {
      console.error("Capture failed:", err);
    }

    setValue("");
    setOpen(false);
  },
  [value]
);
```

**Step 3: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/api/captures/route.ts src/components/dashboard/QuickCapture.tsx
git commit -m "feat: add captures API and wire QuickCapture component"
```

---

## Task 8: Goals module — API routes

**Files:**
- Create: `src/app/api/goals/route.ts`
- Create: `src/app/api/goals/[id]/route.ts`

**Step 1: Write goals list/create route**

```typescript
// src/app/api/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const goals = await prisma.goal.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, deadline, status } = await request.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      title,
      description: description || "",
      deadline: deadline ? new Date(deadline) : null,
      status: status || "active",
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
```

**Step 2: Write goals detail/update/delete route**

```typescript
// src/app/api/goals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  return NextResponse.json(goal);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.goal.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
```

**Step 3: Commit**

```bash
git add "src/app/api/goals/route.ts" "src/app/api/goals/[id]/route.ts"
git commit -m "feat: add goals CRUD API routes"
```

---

## Task 9: Goals dashboard page

**Files:**
- Create: `src/app/(dashboard)/dashboard/goals/page.tsx`

**Step 1: Write the goals page**

```typescript
// src/app/(dashboard)/dashboard/goals/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: string;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("active");

  const fetchGoals = useCallback(async () => {
    const res = await fetch(`/api/goals?status=${filter}`);
    const data = await res.json();
    setGoals(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
    fetchGoals();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    fetchGoals();
  };

  const STATUS_LABELS: Record<string, string> = {
    active: "Active",
    completed: "Done",
    paused: "Paused",
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Goals
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          Track what matters. Kill the noise.
        </p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["active", "completed", "paused"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs tracking-wider uppercase transition-colors ${
              filter === s
                ? "bg-vermillion/15 text-vermillion border border-vermillion/25"
                : "bg-ink-dark/40 text-sumi-gray border border-sumi-gray-dark/12 hover:border-sumi-gray-dark/25"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Add goal form */}
      <form onSubmit={addGoal} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New goal..."
          className="flex-1 px-4 py-2.5 bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-lg text-parchment placeholder:text-sumi-gray font-serif outline-none focus:border-vermillion/30 transition-colors text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-vermillion/15 text-vermillion border border-vermillion/25 rounded-lg font-mono text-xs tracking-wider uppercase hover:bg-vermillion/25 transition-colors"
        >
          Add
        </button>
      </form>

      {/* Goals list */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-sumi-gray text-sm">Loading...</p>
        ) : goals.length === 0 ? (
          <p className="text-sumi-gray text-sm">No {filter} goals yet.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {goals.map((goal, i) => (
              <motion.div
                key={goal.id}
                className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl p-4 flex items-start justify-between gap-3 group hover:border-sumi-gray-dark/25 transition-colors"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                layout
              >
                <div className="flex-1 min-w-0">
                  <p className="text-parchment text-sm leading-relaxed">{goal.title}</p>
                  {goal.description && (
                    <p className="text-parchment-dim text-xs mt-1">{goal.description}</p>
                  )}
                  {goal.deadline && (
                    <p className="text-sumi-gray font-mono mt-1.5" style={{ fontSize: "var(--text-micro)" }}>
                      Due: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {filter === "active" && (
                    <button
                      onClick={() => updateStatus(goal.id, "completed")}
                      className="w-7 h-7 rounded-lg bg-ink-mid/30 text-parchment-dim hover:text-green-400 hover:bg-green-400/10 transition-colors flex items-center justify-center text-xs"
                      title="Complete"
                    >
                      ✓
                    </button>
                  )}
                  {filter === "completed" && (
                    <button
                      onClick={() => updateStatus(goal.id, "active")}
                      className="w-7 h-7 rounded-lg bg-ink-mid/30 text-parchment-dim hover:text-vermillion hover:bg-vermillion/10 transition-colors flex items-center justify-center text-xs"
                      title="Reactivate"
                    >
                      ↩
                    </button>
                  )}
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="w-7 h-7 rounded-lg bg-ink-mid/30 text-parchment-dim hover:text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-center text-xs"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/goals/page.tsx"
git commit -m "feat: add Goals dashboard page with CRUD"
```

---

## Task 10: Habits module — API routes

**Files:**
- Create: `src/app/api/habits/route.ts`
- Create: `src/app/api/habits/[id]/route.ts`
- Create: `src/app/api/habits/[id]/log/route.ts`

**Step 1: Write habits list/create route**

```typescript
// src/app/api/habits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const habits = await prisma.habit.findMany({
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate streaks
  const withStreaks = habits.map((habit) => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const logged = habit.logs.some(
        (log) => new Date(log.date).toISOString().split("T")[0] === dateStr && log.completed
      );

      if (logged) {
        streak++;
      } else if (i === 0) {
        // Today hasn't been logged yet — that's ok
        continue;
      } else {
        break;
      }
    }

    return { ...habit, streak };
  });

  return NextResponse.json(withStreaks);
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, frequency } = await request.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: { title, frequency: frequency || "daily" },
  });

  return NextResponse.json(habit, { status: 201 });
}
```

**Step 2: Write habit update/delete route**

```typescript
// src/app/api/habits/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const habit = await prisma.habit.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
    },
  });

  return NextResponse.json(habit);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.habit.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
```

**Step 3: Write habit log route (toggle today)**

```typescript
// src/app/api/habits/[id]/log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { date } = await request.json();

  const logDate = date ? new Date(date) : new Date();
  logDate.setHours(0, 0, 0, 0);

  // Toggle: if exists, delete. If not, create.
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId: id, date: logDate } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ toggled: false });
  }

  const log = await prisma.habitLog.create({
    data: { habitId: id, date: logDate },
  });

  return NextResponse.json({ toggled: true, log });
}
```

**Step 4: Commit**

```bash
git add "src/app/api/habits/route.ts" "src/app/api/habits/[id]/route.ts" "src/app/api/habits/[id]/log/route.ts"
git commit -m "feat: add habits CRUD + toggle log API routes"
```

---

## Task 11: Habits dashboard page

**Files:**
- Create: `src/app/(dashboard)/dashboard/habits/page.tsx`

**Step 1: Write the habits tracker page**

This page shows habits with a weekly grid (last 7 days), streak count, and toggle functionality.

```typescript
// src/app/(dashboard)/dashboard/habits/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface HabitLog {
  id: string;
  date: string;
  completed: boolean;
}

interface Habit {
  id: string;
  title: string;
  frequency: string;
  streak: number;
  logs: HabitLog[];
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    const data = await res.json();
    setHabits(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
    fetchHabits();
  };

  const toggleDay = async (habitId: string, date: string) => {
    await fetch(`/api/habits/${habitId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    fetchHabits();
  };

  const deleteHabit = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    fetchHabits();
  };

  const days = getLast7Days();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Habits
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          Consistency compounds. Show up every day.
        </p>
      </motion.div>

      {/* Add habit */}
      <form onSubmit={addHabit} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New habit..."
          className="flex-1 px-4 py-2.5 bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-lg text-parchment placeholder:text-sumi-gray font-serif outline-none focus:border-vermillion/30 transition-colors text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-vermillion/15 text-vermillion border border-vermillion/25 rounded-lg font-mono text-xs tracking-wider uppercase hover:bg-vermillion/25 transition-colors"
        >
          Add
        </button>
      </form>

      {/* Habits grid */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sumi-gray text-sm">Loading...</p>
        ) : habits.length === 0 ? (
          <p className="text-sumi-gray text-sm">No habits yet. Start building.</p>
        ) : (
          habits.map((habit, i) => (
            <motion.div
              key={habit.id}
              className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl p-4 group hover:border-sumi-gray-dark/25 transition-colors"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <p className="text-parchment text-sm">{habit.title}</p>
                  {habit.streak > 0 && (
                    <span className="text-vermillion font-mono text-xs">
                      {habit.streak}d streak
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="w-6 h-6 rounded text-sumi-gray-dark hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                  title="Delete"
                >
                  ×
                </button>
              </div>

              {/* 7-day grid */}
              <div className="flex gap-1.5">
                {days.map((date) => {
                  const dayOfWeek = new Date(date + "T12:00:00").getDay();
                  const completed = habit.logs.some(
                    (log) =>
                      new Date(log.date).toISOString().split("T")[0] === date &&
                      log.completed
                  );

                  return (
                    <button
                      key={date}
                      onClick={() => toggleDay(habit.id, date)}
                      className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center transition-all text-[9px] font-mono ${
                        completed
                          ? "bg-vermillion/20 border border-vermillion/40 text-vermillion"
                          : "bg-ink-mid/20 border border-sumi-gray-dark/12 text-sumi-gray-dark hover:border-sumi-gray-dark/30"
                      }`}
                    >
                      <span>{DAY_LABELS[dayOfWeek]}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/habits/page.tsx"
git commit -m "feat: add Habits dashboard page with streak tracking"
```

---

## Task 12: Financial Pulse module — API + page

**Files:**
- Create: `src/app/api/finances/route.ts`
- Create: `src/app/(dashboard)/dashboard/finances/page.tsx`

**Step 1: Write the finances API (snapshot CRUD)**

```typescript
// src/app/api/finances/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshots = await prisma.financialSnapshot.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(snapshots);
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date, data } = await request.json();
  const snapshotDate = date ? new Date(date) : new Date();
  snapshotDate.setHours(0, 0, 0, 0);

  const snapshot = await prisma.financialSnapshot.upsert({
    where: { date: snapshotDate },
    create: { date: snapshotDate, data: data || {} },
    update: { data: data || {} },
  });

  return NextResponse.json(snapshot, { status: 201 });
}
```

**Step 2: Write the Financial Pulse dashboard page**

```typescript
// src/app/(dashboard)/dashboard/finances/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FinancialSnapshot {
  id: string;
  date: string;
  data: {
    netWorth?: number;
    debt?: number;
    savings?: number;
    monthlyBurn?: number;
    income?: number;
    [key: string]: number | undefined;
  };
}

function formatCurrency(n: number | undefined): string {
  if (n === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function FinancesPage() {
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/finances?days=30")
      .then((r) => r.json())
      .then((data) => {
        setSnapshots(data);
        setLoading(false);
      });
  }, []);

  const latest = snapshots[0]?.data;

  const metrics = [
    { label: "Net Worth", value: formatCurrency(latest?.netWorth), accent: true },
    { label: "Debt", value: formatCurrency(latest?.debt), accent: false },
    { label: "Savings", value: formatCurrency(latest?.savings), accent: false },
    { label: "Monthly Burn", value: formatCurrency(latest?.monthlyBurn), accent: false },
    { label: "Income", value: formatCurrency(latest?.income), accent: true },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          Financial Pulse
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          $15K debt → $0. Track the kill.
        </p>
      </motion.div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className={`font-mono tracking-[0.12em] uppercase mb-2 ${
                m.accent ? "text-vermillion/50" : "text-parchment-dim"
              }`}
              style={{ fontSize: "var(--text-micro)" }}
            >
              {m.label}
            </p>
            <p className="text-parchment text-lg font-serif">
              {loading ? "..." : m.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Snapshot history */}
      <div>
        <h2 className="text-parchment-dim font-mono tracking-[0.12em] uppercase mb-3" style={{ fontSize: "var(--text-micro)" }}>
          Recent Snapshots
        </h2>
        <div className="space-y-2">
          {loading ? (
            <p className="text-sumi-gray text-sm">Loading...</p>
          ) : snapshots.length === 0 ? (
            <p className="text-sumi-gray text-sm">
              No financial data yet. Add your first snapshot via Kemi or the API.
            </p>
          ) : (
            snapshots.slice(0, 10).map((snap) => (
              <div
                key={snap.id}
                className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-lg p-3 flex items-center justify-between"
              >
                <span className="text-parchment-dim font-mono text-xs">
                  {new Date(snap.date).toLocaleDateString()}
                </span>
                <div className="flex gap-4 text-xs font-mono">
                  {snap.data.debt !== undefined && (
                    <span className="text-vermillion">
                      Debt: {formatCurrency(snap.data.debt)}
                    </span>
                  )}
                  {snap.data.savings !== undefined && (
                    <span className="text-gold-seal">
                      Savings: {formatCurrency(snap.data.savings)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/api/finances/route.ts "src/app/(dashboard)/dashboard/finances/page.tsx"
git commit -m "feat: add Financial Pulse module with snapshot tracking"
```

---

## Task 13: Kioku pipeline — entity extraction

**Files:**
- Create: `src/lib/kioku/extract.ts`
- Create: `src/lib/kioku/types.ts`
- Test: `src/__tests__/kioku/extract.test.ts`

**Step 1: Create Kioku types**

```typescript
// src/lib/kioku/types.ts
export interface ExtractedEntity {
  subject: string;
  predicate: string;
  object: string;
}

export interface KiokuNode {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  notes: string;
}

export interface MemoryResult {
  content: string;
  similarity: number;
}
```

**Step 2: Write failing tests for extraction**

```typescript
// src/__tests__/kioku/extract.test.ts
import { slugify, parseExtractionResponse } from "@/lib/kioku/extract";

describe("slugify", () => {
  it("converts to lowercase kebab case", () => {
    expect(slugify("Mike Chen")).toBe("mike-chen");
    expect(slugify("Porsche 911 RWB")).toBe("porsche-911-rwb");
  });

  it("handles special characters", () => {
    expect(slugify("café & brunch")).toBe("caf-brunch");
  });
});

describe("parseExtractionResponse", () => {
  it("parses valid JSON array of triples", () => {
    const input = JSON.stringify([
      { subject: "Mike", predicate: "lives_in", object: "Mandeville" },
      { subject: "Mike", predicate: "interested_in", object: "Table Tennis" },
    ]);
    const result = parseExtractionResponse(input);
    expect(result).toHaveLength(2);
    expect(result[0].predicate).toBe("lives_in");
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseExtractionResponse("not json")).toEqual([]);
    expect(parseExtractionResponse("")).toEqual([]);
  });

  it("filters out invalid triples", () => {
    const input = JSON.stringify([
      { subject: "Mike", predicate: "likes", object: "coffee" },
      { subject: "", predicate: "likes", object: "tea" }, // invalid: empty subject
    ]);
    const result = parseExtractionResponse(input);
    expect(result).toHaveLength(1);
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/mac/prod/me.io && npx jest src/__tests__/kioku/extract.test.ts --no-cache 2>&1 || true`
Expected: FAIL

**Step 4: Write extraction implementation**

```typescript
// src/lib/kioku/extract.ts
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedEntity } from "./types";

const anthropic = new Anthropic();

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseExtractionResponse(text: string): ExtractedEntity[] {
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (e: Record<string, unknown>) =>
        typeof e.subject === "string" &&
        typeof e.predicate === "string" &&
        typeof e.object === "string" &&
        e.subject.length > 0 &&
        e.predicate.length > 0 &&
        e.object.length > 0
    );
  } catch {
    return [];
  }
}

export async function extractEntities(text: string): Promise<ExtractedEntity[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Extract relationships from this text as a JSON array of {subject, predicate, object} triples. Use lowercase_underscore predicates like "lives_in", "works_at", "interested_in", "partner_of". Only extract clear facts, not opinions or speculation. Return [] if nothing to extract.\n\nText: "${text}"`,
      },
    ],
  });

  const content = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return parseExtractionResponse(content);
}
```

**Step 5: Run tests to verify they pass**

Run: `cd /Users/mac/prod/me.io && npx jest src/__tests__/kioku/extract.test.ts --no-cache`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/lib/kioku/types.ts src/lib/kioku/extract.ts src/__tests__/kioku/extract.test.ts
git commit -m "feat(kioku): add entity extraction with triple parsing"
```

---

## Task 14: Kioku pipeline — node storage and RAG recall

**Files:**
- Create: `src/lib/kioku/store.ts`
- Create: `src/lib/kioku/recall.ts`

**Step 1: Write node upsert and link creation**

```typescript
// src/lib/kioku/store.ts
import { prisma } from "@/lib/prisma";
import { slugify } from "./extract";
import type { ExtractedEntity } from "./types";

export async function upsertNode(name: string, tags: string[] = []) {
  const slug = slugify(name);

  return prisma.node.upsert({
    where: { slug },
    create: { name, slug, tags },
    update: {
      // Append-only: merge tags, never overwrite name
      tags: { push: tags.filter(Boolean) },
    },
  });
}

export async function appendNote(slug: string, note: string) {
  const node = await prisma.node.findUnique({ where: { slug } });
  if (!node) return null;

  const newNotes = node.notes ? `${node.notes}\n---\n${note}` : note;

  return prisma.node.update({
    where: { slug },
    data: { notes: newNotes },
  });
}

export async function createLink(
  sourceSlug: string,
  targetSlug: string,
  relation: string
) {
  const source = await prisma.node.findUnique({ where: { slug: sourceSlug } });
  const target = await prisma.node.findUnique({ where: { slug: targetSlug } });

  if (!source || !target) return null;

  return prisma.link.upsert({
    where: {
      sourceNodeId_targetNodeId_relation: {
        sourceNodeId: source.id,
        targetNodeId: target.id,
        relation,
      },
    },
    create: {
      sourceNodeId: source.id,
      targetNodeId: target.id,
      relation,
    },
    update: {},
  });
}

export async function processEntities(entities: ExtractedEntity[]) {
  for (const entity of entities) {
    const sourceNode = await upsertNode(entity.subject);
    const targetNode = await upsertNode(entity.object);
    await createLink(sourceNode.slug, targetNode.slug, entity.predicate);
  }
}
```

**Step 2: Write recall (basic text search — vector search wired later when embeddings are set up)**

```typescript
// src/lib/kioku/recall.ts
import { prisma } from "@/lib/prisma";
import type { MemoryResult } from "./types";

/**
 * Basic text-based recall. Searches node names and notes.
 * TODO: Replace with hybrid vector + BM25 search when embeddings are configured.
 */
export async function recall(
  query: string,
  limit: number = 2
): Promise<MemoryResult[]> {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return [];

  // Search nodes by name or notes content
  const nodes = await prisma.node.findMany({
    where: {
      OR: words.map((word) => ({
        OR: [
          { name: { contains: word, mode: "insensitive" as const } },
          { notes: { contains: word, mode: "insensitive" as const } },
        ],
      })),
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  // Record surfacing
  for (const node of nodes) {
    await prisma.nodeRecall.upsert({
      where: { nodeId: node.id },
      create: { nodeId: node.id },
      update: { lastSurfaced: new Date(), surfaceCount: { increment: 1 } },
    });
  }

  return nodes.map((node) => ({
    content: `${node.name}: ${node.notes || node.tags.join(", ") || "No details"}`.slice(0, 200),
    similarity: 0.8, // Placeholder until vector search
  }));
}
```

**Step 3: Commit**

```bash
git add src/lib/kioku/store.ts src/lib/kioku/recall.ts
git commit -m "feat(kioku): add node storage, link creation, and text-based recall"
```

---

## Task 15: Wire Kioku into Kemi context builder

**Files:**
- Modify: `src/lib/kemi/context.ts`

**Step 1: Import and call recall in buildContext**

Update the memory section of `src/lib/kemi/context.ts`:

Replace the `// TODO: Wire up Kioku recall` block with:

```typescript
if (includeMemories) {
  try {
    const { recall } = await import("@/lib/kioku/recall");
    const memories = await recall(userMessage, 2);
    if (memories.length > 0) {
      const lines = memories.map(
        (m) => `  (${(m.similarity * 100).toFixed(0)}%) ${m.content}`
      );
      appendWithBudget(parts, "RELEVANT MEMORY:\n" + lines.join("\n"));
    }
  } catch {
    // Kioku not available yet — graceful degradation
  }
}
```

**Step 2: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/kemi/context.ts
git commit -m "feat(kemi): wire Kioku recall into context builder"
```

---

## Task 16: Dashboard home — live data cards

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/app/api/dashboard/brief/route.ts`

**Step 1: Write the dashboard brief API**

```typescript
// src/app/api/dashboard/brief/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [goals, habits, captures, financials] = await Promise.all([
    prisma.goal.findMany({ where: { status: "active" }, take: 5 }),
    prisma.habit.findMany({
      include: { logs: { where: { date: today }, take: 1 } },
    }),
    prisma.capture.count({ where: { processed: false } }),
    prisma.financialSnapshot.findFirst({ orderBy: { date: "desc" } }),
  ]);

  const habitsCompleted = habits.filter((h) => h.logs.length > 0).length;

  return NextResponse.json({
    goals: { active: goals.length, titles: goals.slice(0, 3).map((g) => g.title) },
    habits: { total: habits.length, completedToday: habitsCompleted },
    captures: { unprocessed: captures },
    finances: financials?.data || null,
  });
}
```

**Step 2: Update dashboard home to fetch live data**

Replace the static `CARDS` array in `src/app/(dashboard)/dashboard/page.tsx` with dynamic data fetching:

```typescript
// src/app/(dashboard)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BriefData {
  goals: { active: number; titles: string[] };
  habits: { total: number; completedToday: number };
  captures: { unprocessed: number };
  finances: { debt?: number; savings?: number } | null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(n: number | undefined): string {
  if (n === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function DashboardHome() {
  const [brief, setBrief] = useState<BriefData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/brief")
      .then((r) => r.json())
      .then(setBrief)
      .catch(() => {});
  }, []);

  const cards = [
    {
      title: "Goals",
      content: brief
        ? `${brief.goals.active} active${brief.goals.titles.length > 0 ? " · " + brief.goals.titles[0] : ""}`
        : "Loading...",
      accent: false,
    },
    {
      title: "Kill / Live / Build",
      content: brief?.finances
        ? `Debt: ${formatCurrency(brief.finances.debt)} · Savings: ${formatCurrency(brief.finances.savings)}`
        : "No financial data yet",
      accent: true,
    },
    {
      title: "Habits",
      content: brief
        ? `${brief.habits.completedToday}/${brief.habits.total} done today`
        : "Loading...",
      accent: false,
    },
    {
      title: "Captures",
      content: brief
        ? `${brief.captures.unprocessed} unprocessed`
        : "Loading...",
      accent: false,
    },
    {
      title: "Streaks",
      content: "Open habits page for details",
      accent: true,
    },
    {
      title: "Kemi says",
      content: "Open chat to talk to Kemi.",
      accent: false,
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          {getGreeting()}, <span className="text-vermillion">Mike</span>
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          Here&apos;s your day at a glance.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl p-4 hover:border-sumi-gray-dark/25 transition-colors duration-300"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.06,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p
              className={`font-mono tracking-[0.12em] uppercase mb-2.5 ${
                card.accent ? "text-vermillion/50" : "text-parchment-dim"
              }`}
              style={{ fontSize: "var(--text-micro)" }}
            >
              {card.title}
            </p>
            <p className="text-parchment/80 text-sm leading-relaxed">
              {card.content}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/api/dashboard/brief/route.ts "src/app/(dashboard)/dashboard/page.tsx"
git commit -m "feat: wire dashboard home to live data from goals, habits, captures, finances"
```

---

## Task 17: Update Sidebar links to match new routes

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx`

**Step 1: Update sidebar NAV_ITEMS paths**

Ensure the sidebar links point to the correct dashboard sub-routes. Update paths in `Sidebar.tsx` for the modules we've built:

- Home → `/dashboard`
- Finances → `/dashboard/finances`
- Goals → `/dashboard/goals`  (currently "的" maps to Goals in the sidebar — update if needed)
- Health → `/dashboard/health` (placeholder)
- Habits → needs to be added or mapped

Check the existing sidebar and update the `href` values and labels to match the actual routes created.

**Step 2: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/dashboard/Sidebar.tsx
git commit -m "feat: update sidebar navigation links for Phase 2 modules"
```

---

## Task 18: Auth helper — reusable session check

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Extract auth check into reusable utility**

Many API routes repeat the same session cookie check. Extract it:

```typescript
// src/lib/auth.ts
import { NextRequest, NextResponse } from "next/server";

export function requireAuth(request: NextRequest): NextResponse | null {
  const session = request.cookies.get("mikeos-session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
```

**Step 2: Refactor existing API routes to use it**

In each API route, replace the auth check block with:

```typescript
import { requireAuth } from "@/lib/auth";

// At the top of each handler:
const authError = requireAuth(request);
if (authError) return authError;
```

Apply to: `/api/kemi`, `/api/captures`, `/api/goals`, `/api/goals/[id]`, `/api/habits`, `/api/habits/[id]`, `/api/habits/[id]/log`, `/api/finances`, `/api/dashboard/brief`.

**Step 3: Verify build passes**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/
git commit -m "refactor: extract reusable auth check into src/lib/auth.ts"
```

---

## Task 19: Final build verification and test run

**Step 1: Run full build**

```bash
cd /Users/mac/prod/me.io && npx next build
```
Expected: All routes compile, no TypeScript errors.

**Step 2: Run all tests**

```bash
cd /Users/mac/prod/me.io && npx jest --no-cache
```
Expected: All tests pass (router + context + kioku extract).

**Step 3: Verify route listing**

Expected routes in build output:
```
○ /
○ /dashboard
○ /dashboard/finances
○ /dashboard/goals
○ /dashboard/habits
ƒ /api/auth/pin
ƒ /api/captures
ƒ /api/dashboard/brief
ƒ /api/finances
ƒ /api/goals
ƒ /api/goals/[id]
ƒ /api/habits
ƒ /api/habits/[id]
ƒ /api/habits/[id]/log
ƒ /api/kemi
○ /projects
```

**Step 4: Start dev server and manually test**

```bash
cd /Users/mac/prod/me.io && npm run dev
```

Test flow:
1. Visit `/` — public site loads with ink effects
2. Click ink seal → PIN overlay → enter 1234 → redirects to dashboard
3. Dashboard shows live cards (empty data is fine)
4. Navigate to Goals → add a goal → see it appear
5. Navigate to Habits → add a habit → toggle days
6. Navigate to Finances → see empty state
7. Open Kemi chat → send "hello" → get real Claude response
8. Cmd+K → type a capture → submit

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: Phase 2 final adjustments"
```
