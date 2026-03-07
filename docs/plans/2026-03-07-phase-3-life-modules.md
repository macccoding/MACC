# Phase 3: Life Modules — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Health & Fitness, Learning Dashboard, Journal (conversational via Kemi), and Blueprint Tracker dashboard modules, plus add WebAuthn passkey/Face ID registration for frictionless repeat authentication.

**Architecture:** Each module follows the established pattern: API route(s) with `requireAuth` from `src/lib/auth.ts`, Prisma queries against existing models, and a "use client" dashboard page with Framer Motion animations and the sumi-e design system. Journal is special — it's conversational through Kemi, not a traditional form. WebAuthn uses the `@simplewebauthn/server` + `@simplewebauthn/browser` libraries with a new `Passkey` Prisma model to store registered credentials.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7 (existing models: HealthSnapshot, LearningTrack, LearningLog, Journal, Goal), Framer Motion, `@simplewebauthn/server` + `@simplewebauthn/browser` for WebAuthn.

**Reference:**
- Design doc: `docs/plans/2026-03-07-mikechen-xyz-design.md` (Section 6.3 Auth Flow)
- Existing patterns: `src/app/api/goals/route.ts`, `src/app/(dashboard)/dashboard/goals/page.tsx`
- Auth helper: `src/lib/auth.ts` — `requireAuth(request)`
- Prisma client: `src/lib/prisma.ts` — `import { prisma } from "@/lib/prisma"`

---

## Task 1: Health & Fitness — API routes

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `src/app/api/health/ingest/route.ts`

**Step 1: Write the health snapshots CRUD route**

```typescript
// src/app/api/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "14");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshots = await prisma.healthSnapshot.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(snapshots);
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { date, steps, calories, heartRate, sleep, data } = await request.json();

  const snapshotDate = date ? new Date(date) : new Date();
  snapshotDate.setHours(0, 0, 0, 0);

  const snapshot = await prisma.healthSnapshot.upsert({
    where: { date: snapshotDate },
    create: { date: snapshotDate, steps, calories, heartRate, sleep, data: data || {} },
    update: { steps, calories, heartRate, sleep, data: data || {} },
  });

  return NextResponse.json(snapshot, { status: 201 });
}
```

**Step 2: Write the webhook ingest route (for Health Auto Export app)**

```typescript
// src/app/api/health/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // API key auth for webhook (not cookie-based)
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.HEALTH_INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();

  // Health Auto Export sends { date, metrics: { steps, calories, ... } }
  const date = new Date(payload.date || new Date());
  date.setHours(0, 0, 0, 0);

  const snapshot = await prisma.healthSnapshot.upsert({
    where: { date },
    create: {
      date,
      steps: payload.metrics?.steps ?? null,
      calories: payload.metrics?.calories ?? null,
      heartRate: payload.metrics?.heartRate ?? null,
      sleep: payload.metrics?.sleep ?? null,
      data: payload.metrics || {},
    },
    update: {
      steps: payload.metrics?.steps ?? undefined,
      calories: payload.metrics?.calories ?? undefined,
      heartRate: payload.metrics?.heartRate ?? undefined,
      sleep: payload.metrics?.sleep ?? undefined,
      data: payload.metrics || undefined,
    },
  });

  return NextResponse.json({ ingested: true, id: snapshot.id });
}
```

**Step 3: Verify build**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/api/health/route.ts src/app/api/health/ingest/route.ts
git commit -m "feat: add Health API with snapshot CRUD and webhook ingest"
```

---

## Task 2: Health & Fitness — Dashboard page

**Files:**
- Create: `src/app/(dashboard)/dashboard/health/page.tsx`

**Step 1: Write the health dashboard page**

Page features:
- Today's metrics: steps, calories, heart rate, sleep — displayed as large stat cards in a 2x2 grid
- 7-day sparkline-style row for each metric (small colored bars proportional to daily value)
- Manual entry form (for when webhook isn't set up): inputs for steps, calories, heart rate (bpm), sleep (hours), save button
- Empty state when no data exists
- Sumi-e styling: same card/animation patterns as Goals page

Key UI details:
- Steps card: format with comma separator, vermillion accent
- Sleep: show as "Xh Ym" format
- Heart rate: show "XX bpm"
- Calories: format with comma
- 7-day row: small vertical bars, height proportional to value within that metric's range
- Manual entry: simple row of 4 inputs + save button, POSTs to /api/health

**Step 2: Verify build**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/health/page.tsx"
git commit -m "feat: add Health dashboard page with metrics cards and 7-day history"
```

---

## Task 3: Learning Dashboard — API routes

**Files:**
- Create: `src/app/api/learning/route.ts`
- Create: `src/app/api/learning/[id]/route.ts`
- Create: `src/app/api/learning/[id]/log/route.ts`

**Step 1: Write learning tracks CRUD route**

```typescript
// src/app/api/learning/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const tracks = await prisma.learningTrack.findMany({
    include: {
      logs: { orderBy: { date: "desc" }, take: 10 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tracks);
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { title, type } = await request.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const track = await prisma.learningTrack.create({
    data: { title, type: type || "course" },
  });

  return NextResponse.json(track, { status: 201 });
}
```

**Step 2: Write single track update/delete route**

```typescript
// src/app/api/learning/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const data = await request.json();

  const track = await prisma.learningTrack.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.progress !== undefined && { progress: data.progress }),
    },
  });

  return NextResponse.json(track);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  await prisma.learningTrack.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
```

**Step 3: Write learning log route**

```typescript
// src/app/api/learning/[id]/log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const { notes, duration } = await request.json();

  const log = await prisma.learningLog.create({
    data: {
      trackId: id,
      notes: notes || "",
      duration: duration ? parseInt(duration) : null,
    },
  });

  // Update track's updatedAt
  await prisma.learningTrack.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(log, { status: 201 });
}
```

**Step 4: Verify build**

Run: `cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15`

**Step 5: Commit**

```bash
git add src/app/api/learning/route.ts "src/app/api/learning/[id]/route.ts" "src/app/api/learning/[id]/log/route.ts"
git commit -m "feat: add Learning tracks API with CRUD and session logging"
```

---

## Task 4: Learning Dashboard — page

**Files:**
- Create: `src/app/(dashboard)/dashboard/learning/page.tsx`

**Step 1: Write the learning dashboard page**

Page features:
- Header: "Learning" / "Sharpen the blade every day."
- Add track form: title input + type dropdown (course, book, language, skill) + Add button
- Track cards: title, type badge, progress bar (0-100%), recent log entries
- Each card has: log session button (opens inline form with notes textarea + duration input)
- Progress slider on each card to update progress %
- Delete on hover
- Type badges use different accent colors: course=vermillion, book=gold-seal, language=parchment-muted, skill=vermillion-glow

**Step 2: Verify build**

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/learning/page.tsx"
git commit -m "feat: add Learning dashboard page with tracks and session logging"
```

---

## Task 5: Journal — API routes

**Files:**
- Create: `src/app/api/journal/route.ts`
- Create: `src/app/api/journal/today/route.ts`

**Step 1: Write journal CRUD route**

```typescript
// src/app/api/journal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "30");

  const entries = await prisma.journal.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(entries);
}
```

**Step 2: Write today's journal route (upsert)**

```typescript
// src/app/api/journal/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entry = await prisma.journal.findUnique({ where: { date: today } });

  return NextResponse.json(entry || { date: today.toISOString(), content: "" });
}

export async function PUT(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { content } = await request.json();

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entry = await prisma.journal.upsert({
    where: { date: today },
    create: { date: today, content },
    update: { content },
  });

  return NextResponse.json(entry);
}
```

**Step 3: Verify build**

**Step 4: Commit**

```bash
git add src/app/api/journal/route.ts src/app/api/journal/today/route.ts
git commit -m "feat: add Journal API with list and today upsert"
```

---

## Task 6: Journal — Dashboard page (conversational)

**Files:**
- Create: `src/app/(dashboard)/dashboard/journal/page.tsx`

**Step 1: Write the journal page**

The journal page is different from other modules — it's a conversational interface. Instead of a form, it has:

- **Today's entry** area: a large, auto-expanding textarea showing today's journal content, auto-saving on blur or after 2 seconds of inactivity (debounced PUT to /api/journal/today)
- **Kemi prompt section**: a row of 3-4 reflection prompts that Kemi might ask, e.g.:
  - "What's weighing on you?"
  - "What went well today?"
  - "What are you avoiding?"
  - "What would make tomorrow great?"
  Clicking a prompt appends it as a heading in the journal text
- **Previous entries** below: scrollable list of past journal entries (GET /api/journal?limit=14), each showing date and first 120 chars of content, expandable on click
- Header: "Journal" / "Write to think. Think to grow."
- Styling: the textarea should feel minimal — no border when focused, large font-serif, parchment text on ink background, placeholder "Start writing..."
- Auto-save indicator: small text showing "Saved" or "Saving..." near the textarea

**Step 2: Verify build**

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/journal/page.tsx"
git commit -m "feat: add Journal dashboard page with auto-save and reflection prompts"
```

---

## Task 7: Blueprint Tracker — API routes

**Files:**
- Create: `src/app/api/blueprint/route.ts`
- Create: `src/app/api/blueprint/[id]/route.ts`

**Step 1: Write blueprint CRUD**

The Blueprint Tracker uses the Goal model but with a specific "blueprint" category. It tracks Mike's life architecture — the big-picture plans and milestones.

```typescript
// src/app/api/blueprint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // Blueprint items are goals with description containing structured data
  const goals = await prisma.goal.findMany({
    where: {
      ...(status ? { status } : {}),
      description: { startsWith: "[blueprint]" },
    },
    orderBy: { deadline: "asc" },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { title, description, deadline, status } = await request.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      title,
      description: `[blueprint] ${description || ""}`,
      deadline: deadline ? new Date(deadline) : null,
      status: status || "active",
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
```

**Step 2: Write blueprint detail route**

```typescript
// src/app/api/blueprint/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const data = await request.json();

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: `[blueprint] ${data.description}` }),
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
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  await prisma.goal.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
```

**Step 3: Verify build**

**Step 4: Commit**

```bash
git add src/app/api/blueprint/route.ts "src/app/api/blueprint/[id]/route.ts"
git commit -m "feat: add Blueprint API — life architecture goals"
```

---

## Task 8: Blueprint Tracker — Dashboard page

**Files:**
- Create: `src/app/(dashboard)/dashboard/blueprint/page.tsx`

**Step 1: Write the blueprint page**

The Blueprint page is a Kanban-style view of life milestones, grouped by timeline:

- Header: "Blueprint" / "The architecture of your life."
- Three columns: **This Quarter**, **This Year**, **Someday** — based on deadline proximity
- Each milestone card: title, description (without [blueprint] prefix), deadline, status badge
- Add form at the top: title + deadline picker + Add button
- Status toggle: click to cycle active → completed → paused
- Cards are draggable between columns (use simple onClick to change deadline for now, drag & drop can come in Phase 5)
- Column styling: vertical scrollable with column header in font-mono uppercase

Column logic:
- This Quarter: deadline within 90 days from now
- This Year: deadline within 365 days
- Someday: no deadline or deadline > 365 days

**Step 2: Verify build**

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/blueprint/page.tsx"
git commit -m "feat: add Blueprint dashboard page with timeline columns"
```

---

## Task 9: WebAuthn — Prisma model and dependencies

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `package.json`

**Step 1: Add Passkey model to Prisma schema**

Append to `prisma/schema.prisma`:

```prisma
model Passkey {
  id              String   @id @default(cuid())
  credentialId    String   @unique
  publicKey       Bytes
  counter         BigInt   @default(0)
  deviceName      String   @default("Unknown device")
  transports      String[] @default([])
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())

  @@map("passkeys")
}
```

**Step 2: Install WebAuthn libraries**

```bash
cd /Users/mac/prod/me.io && npm install @simplewebauthn/server @simplewebauthn/browser
```

**Step 3: Regenerate Prisma client**

```bash
cd /Users/mac/prod/me.io && npx prisma generate
```

**Step 4: Verify build**

```bash
cd /Users/mac/prod/me.io && npx next build 2>&1 | tail -15
```

**Step 5: Commit**

```bash
git add prisma/schema.prisma package.json package-lock.json
git commit -m "feat: add Passkey model and install @simplewebauthn"
```

---

## Task 10: WebAuthn — Registration API routes

**Files:**
- Create: `src/app/api/auth/passkey/register/options/route.ts`
- Create: `src/app/api/auth/passkey/register/verify/route.ts`
- Create: `src/lib/webauthn.ts`

**Step 1: Create WebAuthn config helper**

```typescript
// src/lib/webauthn.ts
export const rpName = "MikeOS";
export const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
export const origin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;
```

Add to `.env.local`:
```
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
```

**Step 2: Write registration options route**

```typescript
// src/app/api/auth/passkey/register/options/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { rpName, rpID } from "@/lib/webauthn";

// In-memory challenge store (per-session)
export const challenges = new Map<string, string>();

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { deviceName } = await request.json();

  // Get existing passkeys to exclude
  const existingPasskeys = await prisma.passkey.findMany({
    select: { credentialId: true },
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "mike",
    userDisplayName: "Mike Chen",
    excludeCredentials: existingPasskeys.map((p) => ({
      id: p.credentialId,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Store challenge for verification
  challenges.set("mike", options.challenge);

  return NextResponse.json(options);
}
```

**Step 3: Write registration verify route**

```typescript
// src/app/api/auth/passkey/register/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { rpID, origin } from "@/lib/webauthn";
import { challenges } from "../options/route";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { credential, deviceName } = body;

  const expectedChallenge = challenges.get("mike");
  if (!expectedChallenge) {
    return NextResponse.json({ error: "No challenge found" }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { credential: cred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await prisma.passkey.create({
      data: {
        credentialId: cred.id,
        publicKey: Buffer.from(cred.publicKey),
        counter: BigInt(cred.counter),
        deviceName: deviceName || "Unknown device",
        transports: credential.response?.transports || [],
      },
    });

    challenges.delete("mike");

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("[WebAuthn Register]", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
```

**Step 4: Verify build**

**Step 5: Commit**

```bash
git add src/lib/webauthn.ts src/app/api/auth/passkey/
git commit -m "feat: add WebAuthn passkey registration API routes"
```

---

## Task 11: WebAuthn — Authentication API routes

**Files:**
- Create: `src/app/api/auth/passkey/auth/options/route.ts`
- Create: `src/app/api/auth/passkey/auth/verify/route.ts`

**Step 1: Write authentication options route**

```typescript
// src/app/api/auth/passkey/auth/options/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rpID } from "@/lib/webauthn";

// In-memory challenge store
export const authChallenges = new Map<string, string>();

export async function POST() {
  const passkeys = await prisma.passkey.findMany({
    select: { credentialId: true, transports: true },
  });

  if (passkeys.length === 0) {
    return NextResponse.json({ error: "No passkeys registered" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports as AuthenticatorTransport[],
    })),
    userVerification: "preferred",
  });

  authChallenges.set("mike", options.challenge);

  return NextResponse.json(options);
}
```

Note: `AuthenticatorTransport` may need to be imported from `@simplewebauthn/server`. If not available, cast as `string[]` to `AuthenticatorTransport[]`.

**Step 2: Write authentication verify route**

```typescript
// src/app/api/auth/passkey/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rpID, origin } from "@/lib/webauthn";
import { authChallenges } from "../options/route";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { credential } = body;

  const expectedChallenge = authChallenges.get("mike");
  if (!expectedChallenge) {
    return NextResponse.json({ error: "No challenge found" }, { status: 400 });
  }

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: credential.id },
  });

  if (!passkey) {
    return NextResponse.json({ error: "Unknown credential" }, { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    // Update counter and last used
    await prisma.passkey.update({
      where: { credentialId: passkey.credentialId },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    authChallenges.delete("mike");

    // Set session cookie (same as PIN auth)
    const response = NextResponse.json({ verified: true });
    response.cookies.set("mikeos-session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[WebAuthn Auth]", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
```

**Step 3: Verify build**

**Step 4: Commit**

```bash
git add src/app/api/auth/passkey/auth/
git commit -m "feat: add WebAuthn passkey authentication API routes"
```

---

## Task 12: WebAuthn — Update PinOverlay with passkey support

**Files:**
- Modify: `src/components/ink/PinOverlay.tsx`

**Step 1: Read and update PinOverlay**

Add passkey authentication flow to PinOverlay:

1. On mount, check if passkeys exist by POSTing to `/api/auth/passkey/auth/options`
2. If passkeys exist (no 404), automatically trigger the browser's WebAuthn prompt via `@simplewebauthn/browser`'s `startAuthentication()`
3. If passkey auth succeeds, redirect to dashboard (same as PIN success)
4. If passkey auth fails or no passkeys registered, fall through to the existing PIN input
5. Show a small "Use passkey" button below the PIN inputs that re-triggers the biometric prompt
6. After successful PIN auth, show a "Register this device" link that calls the registration flow

Key imports:
```typescript
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
```

Flow:
- `tryPasskeyAuth()`: POST options, startAuthentication(), POST verify, redirect on success
- `registerPasskey()`: POST register options, startRegistration(), POST register verify
- On mount: call tryPasskeyAuth() silently. If fails, show PIN form as normal.
- After PIN success: show "Register Face ID / fingerprint?" prompt with deviceName input

**Step 2: Verify build**

**Step 3: Commit**

```bash
git add src/components/ink/PinOverlay.tsx
git commit -m "feat: add passkey/Face ID support to PinOverlay"
```

---

## Task 13: Final build verification and test run

**Step 1: Run all tests**

```bash
cd /Users/mac/prod/me.io && npx jest --no-cache
```
Expected: All existing tests still pass.

**Step 2: Run full build**

```bash
cd /Users/mac/prod/me.io && npx next build
```

Expected routes in build output:
```
○ /
○ /dashboard
○ /dashboard/blueprint
○ /dashboard/finances
○ /dashboard/goals
○ /dashboard/habits
○ /dashboard/health
○ /dashboard/journal
○ /dashboard/learning
ƒ /api/auth/passkey/auth/options
ƒ /api/auth/passkey/auth/verify
ƒ /api/auth/passkey/register/options
ƒ /api/auth/passkey/register/verify
ƒ /api/auth/pin
ƒ /api/blueprint
ƒ /api/blueprint/[id]
ƒ /api/captures
ƒ /api/dashboard/brief
ƒ /api/finances
ƒ /api/goals
ƒ /api/goals/[id]
ƒ /api/habits
ƒ /api/habits/[id]
ƒ /api/habits/[id]/log
ƒ /api/health
ƒ /api/health/ingest
ƒ /api/journal
ƒ /api/journal/today
ƒ /api/kemi
ƒ /api/learning
ƒ /api/learning/[id]
ƒ /api/learning/[id]/log
○ /projects
```

**Step 3: Start dev server and manually test**

Test flow:
1. Dashboard → Health page (empty state)
2. Dashboard → Learning page → add a track → log a session
3. Dashboard → Journal → write an entry → verify auto-save
4. Dashboard → Blueprint → add a milestone → verify column placement
5. Ink seal → PIN → after success, check for "Register device" prompt

**Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: Phase 3 final adjustments"
```
