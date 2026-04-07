# Tsukuyomi Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Tsukuyomi table tennis player development system as module #15 in MikeOS, with training logs, technique atlas, equipment lab, match journal, and periodization tracking.

**Architecture:** New Prisma models for all TT entities. Sub-routed pages under `/dashboard/tt/*` with a shared layout providing section navigation. API routes at `/api/tt/*` following existing MikeOS patterns (requireAuth, Prisma, NextResponse). Uchiha framework terminology integrated as system language throughout.

**Tech Stack:** Next.js 16 (App Router), Prisma 7 + Neon PostgreSQL, Tailwind v4, Framer Motion, TypeScript.

**Spec:** `docs/plans/2026-04-07-tsukuyomi-module-design.md`

---

## File Map

### Database
- Modify: `prisma/schema.prisma` — add 8 new models (TTSession, TTDrill, TTTechniqueRating, TTTechniqueReference, TTMatch, TTEquipmentLog, TTBoostLog, TTPeriodPhase)

### API Routes (all new)
- Create: `src/app/api/tt/sessions/route.ts` — GET list, POST create
- Create: `src/app/api/tt/sessions/[id]/route.ts` — GET, PUT, DELETE
- Create: `src/app/api/tt/techniques/route.ts` — GET all, POST new rating
- Create: `src/app/api/tt/techniques/[shot]/route.ts` — GET shot detail + history
- Create: `src/app/api/tt/references/route.ts` — GET list, POST create, PUT update
- Create: `src/app/api/tt/equipment/route.ts` — GET list, POST create, PUT update
- Create: `src/app/api/tt/matches/route.ts` — GET list, POST create
- Create: `src/app/api/tt/matches/[id]/route.ts` — GET, PUT, DELETE
- Create: `src/app/api/tt/boost/route.ts` — GET list, POST create
- Create: `src/app/api/tt/periods/route.ts` — GET list, PUT update
- Create: `src/app/api/tt/seed/route.ts` — POST seed initial data

### Pages (all new)
- Create: `src/app/(dashboard)/dashboard/tt/layout.tsx` — sub-navigation for TT sections
- Create: `src/app/(dashboard)/dashboard/tt/page.tsx` — dashboard hub
- Create: `src/app/(dashboard)/dashboard/tt/log/page.tsx` — training log list + create
- Create: `src/app/(dashboard)/dashboard/tt/log/[id]/page.tsx` — session detail
- Create: `src/app/(dashboard)/dashboard/tt/atlas/page.tsx` — technique atlas overview
- Create: `src/app/(dashboard)/dashboard/tt/atlas/[shot]/page.tsx` — shot detail + reference model
- Create: `src/app/(dashboard)/dashboard/tt/lab/page.tsx` — equipment lab
- Create: `src/app/(dashboard)/dashboard/tt/matches/page.tsx` — match journal list + create
- Create: `src/app/(dashboard)/dashboard/tt/matches/[id]/page.tsx` — match detail
- Create: `src/app/(dashboard)/dashboard/tt/plan/page.tsx` — periodization calendar

### Navigation
- Modify: `src/components/dashboard/Sidebar.tsx` — add TT module to MODULES array

---

## Task 1: Prisma Schema — Add TT Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add all 8 TT models to schema.prisma**

Add at the end of the file, before the closing of the schema:

```prisma
// ─── Table Tennis (Tsukuyomi) ───────────────────────────────────────────────

model TTSession {
  id             String    @id @default(cuid())
  date           DateTime  @db.Date
  duration       Int       // minutes
  location       String?
  blade          String    // "FZD ALC" | "Q968"
  mode1Respected Boolean?
  peakMode       Int?      // 1-4
  energyLevel    Int?      // 1-10
  notes          String?
  drills         TTDrill[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("tt_sessions")
}

model TTDrill {
  id        String    @id @default(cuid())
  sessionId String
  session   TTSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  name      String
  category  String    // "sharingan" | "amaterasu" | "totsuka" | "yata-mirror"
  technique String?   // "bh-flick", "fh-opening-loop", etc.
  rating    Int?      // 1-10
  notes     String?
  createdAt DateTime  @default(now())

  @@map("tt_drills")
}

model TTTechniqueRating {
  id        String   @id @default(cuid())
  shot      String
  rating    Int      // 1-10
  date      DateTime @db.Date
  notes     String?
  createdAt DateTime @default(now())

  @@map("tt_technique_ratings")
}

model TTTechniqueReference {
  id                 String   @id @default(cuid())
  shot               String
  playerName         String
  mechanicsBreakdown String?
  extractionNotes    String?
  comparisonNotes    String?
  videoLinks         Json?    // [{url, timestamp, description}]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@map("tt_technique_references")
}

model TTMatch {
  id            String   @id @default(cuid())
  date          DateTime @db.Date
  opponent      String
  opponentNotes String?
  result        String   // "3-1", "3-2", etc.
  scores        Json?    // [{you: 11, them: 4}, ...]
  blade         String
  tournament    String?
  whatWorked    String?
  whatBroke     String?
  tacticalNotes String?
  servesUsed    String?
  receiveNotes  String?
  peakMode      Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("tt_matches")
}

model TTEquipmentLog {
  id                String    @id @default(cuid())
  item              String
  type              String    // "rubber" | "blade"
  side              String?   // "fh" | "bh"
  blade             String?
  dateStarted       DateTime  @db.Date
  dateEnded         DateTime? @db.Date
  satisfaction      Int?      // 1-10
  pros              String?
  cons              String?
  verdict           String?   // "kept" | "discarded" | "revisit"
  revisitConditions String?
  notes             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("tt_equipment_log")
}

model TTBoostLog {
  id        String   @id @default(cuid())
  rubber    String
  blade     String
  side      String   // "fh" | "bh"
  booster   String
  date      DateTime @db.Date
  notes     String?
  createdAt DateTime @default(now())

  @@map("tt_boost_log")
}

model TTPeriodPhase {
  id          String   @id @default(cuid())
  name        String
  startMonth  DateTime @db.Date
  endMonth    DateTime @db.Date
  focusAreas  Json     // string[]
  targets     Json     // string[]
  reviewNotes String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tt_period_phases")
}
```

- [ ] **Step 2: Generate Prisma client and run migration**

```bash
cd /Users/mac/prod/MACC
npx prisma migrate dev --name add-tsukuyomi-module
```

Expected: Migration creates 8 new tables. Prisma client regenerates with TT models.

- [ ] **Step 3: Verify generated client has TT models**

```bash
cd /Users/mac/prod/MACC
grep -r "ttSession" src/generated/prisma/client/ | head -3
```

Expected: References to ttSession in generated client files.

- [ ] **Step 4: Commit**

```bash
cd /Users/mac/prod/MACC
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(tt): add Tsukuyomi module Prisma schema — 8 models for training, technique, equipment, matches, periodization"
```

---

## Task 2: API Routes — Sessions

**Files:**
- Create: `src/app/api/tt/sessions/route.ts`
- Create: `src/app/api/tt/sessions/[id]/route.ts`

- [ ] **Step 1: Create sessions list + create route**

```typescript
// src/app/api/tt/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50", 10);
  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0", 10);

  try {
    const sessions = await prisma.tTSession.findMany({
      include: { drills: true },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("[tt/sessions] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, duration, location, blade, mode1Respected, peakMode, energyLevel, notes, drills } = body as {
    date?: string;
    duration?: number;
    location?: string;
    blade?: string;
    mode1Respected?: boolean;
    peakMode?: number;
    energyLevel?: number;
    notes?: string;
    drills?: Array<{
      name: string;
      category: string;
      technique?: string;
      rating?: number;
      notes?: string;
    }>;
  };

  if (!date || typeof duration !== "number" || !blade) {
    return NextResponse.json({ error: "date, duration, and blade are required" }, { status: 400 });
  }

  try {
    const session = await prisma.tTSession.create({
      data: {
        date: new Date(date),
        duration,
        location: location || null,
        blade,
        mode1Respected: mode1Respected ?? null,
        peakMode: peakMode ?? null,
        energyLevel: energyLevel ?? null,
        notes: notes || null,
        drills: drills?.length
          ? {
              create: drills.map((d) => ({
                name: d.name,
                category: d.category,
                technique: d.technique || null,
                rating: d.rating ?? null,
                notes: d.notes || null,
              })),
            }
          : undefined,
      },
      include: { drills: true },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[tt/sessions] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create session detail route**

```typescript
// src/app/api/tt/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const session = await prisma.tTSession.findUnique({
      where: { id },
      include: { drills: true },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch (err) {
    console.error("[tt/sessions] Get error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, duration, location, blade, mode1Respected, peakMode, energyLevel, notes, drills } = body as {
    date?: string;
    duration?: number;
    location?: string;
    blade?: string;
    mode1Respected?: boolean;
    peakMode?: number;
    energyLevel?: number;
    notes?: string;
    drills?: Array<{
      id?: string;
      name: string;
      category: string;
      technique?: string;
      rating?: number;
      notes?: string;
    }>;
  };

  try {
    const session = await prisma.tTSession.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date) } : {}),
        ...(typeof duration === "number" ? { duration } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(blade ? { blade } : {}),
        ...(mode1Respected !== undefined ? { mode1Respected } : {}),
        ...(peakMode !== undefined ? { peakMode } : {}),
        ...(energyLevel !== undefined ? { energyLevel } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(drills
          ? {
              drills: {
                deleteMany: {},
                create: drills.map((d) => ({
                  name: d.name,
                  category: d.category,
                  technique: d.technique || null,
                  rating: d.rating ?? null,
                  notes: d.notes || null,
                })),
              },
            }
          : {}),
      },
      include: { drills: true },
    });
    return NextResponse.json(session);
  } catch (err) {
    console.error("[tt/sessions] Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    await prisma.tTSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tt/sessions] Delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify routes compile**

```bash
cd /Users/mac/prod/MACC
npx next build --no-lint 2>&1 | grep -E "(tt/sessions|Error)" | head -10
```

Expected: No errors for tt/sessions routes.

- [ ] **Step 4: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/api/tt/sessions/"
git commit -m "feat(tt): add sessions API routes — list, create, get, update, delete with drill nesting"
```

---

## Task 3: API Routes — Techniques + References

**Files:**
- Create: `src/app/api/tt/techniques/route.ts`
- Create: `src/app/api/tt/techniques/[shot]/route.ts`
- Create: `src/app/api/tt/references/route.ts`

- [ ] **Step 1: Create techniques list + create route**

```typescript
// src/app/api/tt/techniques/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    // Get latest rating for each shot
    const ratings = await prisma.tTTechniqueRating.findMany({
      orderBy: { date: "desc" },
    });

    // Group by shot, take latest
    const latestByShot = new Map<string, typeof ratings[0]>();
    for (const r of ratings) {
      if (!latestByShot.has(r.shot)) latestByShot.set(r.shot, r);
    }

    return NextResponse.json(Array.from(latestByShot.values()));
  } catch (err) {
    console.error("[tt/techniques] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { shot, rating, date, notes } = body as {
    shot?: string;
    rating?: number;
    date?: string;
    notes?: string;
  };

  if (!shot || typeof rating !== "number") {
    return NextResponse.json({ error: "shot and rating are required" }, { status: 400 });
  }

  try {
    const entry = await prisma.tTTechniqueRating.create({
      data: {
        shot,
        rating,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[tt/techniques] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create technique shot detail route**

```typescript
// src/app/api/tt/techniques/[shot]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ shot: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { shot } = await params;

  try {
    const [ratings, references, recentDrills] = await Promise.all([
      prisma.tTTechniqueRating.findMany({
        where: { shot },
        orderBy: { date: "asc" },
      }),
      prisma.tTTechniqueReference.findMany({
        where: { shot },
      }),
      prisma.tTDrill.findMany({
        where: { technique: shot },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { session: { select: { date: true, blade: true } } },
      }),
    ]);

    return NextResponse.json({ shot, ratings, references, recentDrills });
  } catch (err) {
    console.error("[tt/techniques] Shot detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create references route**

```typescript
// src/app/api/tt/references/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const shot = request.nextUrl.searchParams.get("shot");

  try {
    const references = await prisma.tTTechniqueReference.findMany({
      where: shot ? { shot } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(references);
  } catch (err) {
    console.error("[tt/references] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { shot, playerName, mechanicsBreakdown, extractionNotes, comparisonNotes, videoLinks } = body as {
    shot?: string;
    playerName?: string;
    mechanicsBreakdown?: string;
    extractionNotes?: string;
    comparisonNotes?: string;
    videoLinks?: Array<{ url: string; timestamp?: string; description?: string }>;
  };

  if (!shot || !playerName) {
    return NextResponse.json({ error: "shot and playerName are required" }, { status: 400 });
  }

  try {
    const ref = await prisma.tTTechniqueReference.create({
      data: {
        shot,
        playerName,
        mechanicsBreakdown: mechanicsBreakdown || null,
        extractionNotes: extractionNotes || null,
        comparisonNotes: comparisonNotes || null,
        videoLinks: videoLinks || null,
      },
    });
    return NextResponse.json(ref, { status: 201 });
  } catch (err) {
    console.error("[tt/references] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, ...data } = body as {
    id?: string;
    mechanicsBreakdown?: string;
    extractionNotes?: string;
    comparisonNotes?: string;
    videoLinks?: Array<{ url: string; timestamp?: string; description?: string }>;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const ref = await prisma.tTTechniqueReference.update({
      where: { id },
      data: {
        ...(data.mechanicsBreakdown !== undefined ? { mechanicsBreakdown: data.mechanicsBreakdown } : {}),
        ...(data.extractionNotes !== undefined ? { extractionNotes: data.extractionNotes } : {}),
        ...(data.comparisonNotes !== undefined ? { comparisonNotes: data.comparisonNotes } : {}),
        ...(data.videoLinks !== undefined ? { videoLinks: data.videoLinks } : {}),
      },
    });
    return NextResponse.json(ref);
  } catch (err) {
    console.error("[tt/references] Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/api/tt/techniques/" "src/app/api/tt/references/"
git commit -m "feat(tt): add techniques and references API routes — rating history, shot detail, pro player references"
```

---

## Task 4: API Routes — Equipment, Matches, Boost, Periods

**Files:**
- Create: `src/app/api/tt/equipment/route.ts`
- Create: `src/app/api/tt/matches/route.ts`
- Create: `src/app/api/tt/matches/[id]/route.ts`
- Create: `src/app/api/tt/boost/route.ts`
- Create: `src/app/api/tt/periods/route.ts`

- [ ] **Step 1: Create equipment route**

```typescript
// src/app/api/tt/equipment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const logs = await prisma.tTEquipmentLog.findMany({
      orderBy: { dateStarted: "desc" },
    });
    return NextResponse.json(logs);
  } catch (err) {
    console.error("[tt/equipment] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { item, type, side, blade, dateStarted, dateEnded, satisfaction, pros, cons, verdict, revisitConditions, notes } = body as {
    item?: string;
    type?: string;
    side?: string;
    blade?: string;
    dateStarted?: string;
    dateEnded?: string;
    satisfaction?: number;
    pros?: string;
    cons?: string;
    verdict?: string;
    revisitConditions?: string;
    notes?: string;
  };

  if (!item || !type || !dateStarted) {
    return NextResponse.json({ error: "item, type, and dateStarted are required" }, { status: 400 });
  }

  try {
    const log = await prisma.tTEquipmentLog.create({
      data: {
        item,
        type,
        side: side || null,
        blade: blade || null,
        dateStarted: new Date(dateStarted),
        dateEnded: dateEnded ? new Date(dateEnded) : null,
        satisfaction: satisfaction ?? null,
        pros: pros || null,
        cons: cons || null,
        verdict: verdict || null,
        revisitConditions: revisitConditions || null,
        notes: notes || null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("[tt/equipment] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, ...data } = body as {
    id?: string;
    dateEnded?: string;
    satisfaction?: number;
    pros?: string;
    cons?: string;
    verdict?: string;
    revisitConditions?: string;
    notes?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const log = await prisma.tTEquipmentLog.update({
      where: { id },
      data: {
        ...(data.dateEnded !== undefined ? { dateEnded: data.dateEnded ? new Date(data.dateEnded) : null } : {}),
        ...(data.satisfaction !== undefined ? { satisfaction: data.satisfaction } : {}),
        ...(data.pros !== undefined ? { pros: data.pros } : {}),
        ...(data.cons !== undefined ? { cons: data.cons } : {}),
        ...(data.verdict !== undefined ? { verdict: data.verdict } : {}),
        ...(data.revisitConditions !== undefined ? { revisitConditions: data.revisitConditions } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
    return NextResponse.json(log);
  } catch (err) {
    console.error("[tt/equipment] Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create matches list + create route**

```typescript
// src/app/api/tt/matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50", 10);

  try {
    const matches = await prisma.tTMatch.findMany({
      orderBy: { date: "desc" },
      take: limit,
    });
    return NextResponse.json(matches);
  } catch (err) {
    console.error("[tt/matches] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, opponent, opponentNotes, result, scores, blade, tournament, whatWorked, whatBroke, tacticalNotes, servesUsed, receiveNotes, peakMode } = body as {
    date?: string;
    opponent?: string;
    opponentNotes?: string;
    result?: string;
    scores?: Array<{ you: number; them: number }>;
    blade?: string;
    tournament?: string;
    whatWorked?: string;
    whatBroke?: string;
    tacticalNotes?: string;
    servesUsed?: string;
    receiveNotes?: string;
    peakMode?: number;
  };

  if (!date || !opponent || !result || !blade) {
    return NextResponse.json({ error: "date, opponent, result, and blade are required" }, { status: 400 });
  }

  try {
    const match = await prisma.tTMatch.create({
      data: {
        date: new Date(date),
        opponent,
        opponentNotes: opponentNotes || null,
        result,
        scores: scores || null,
        blade,
        tournament: tournament || null,
        whatWorked: whatWorked || null,
        whatBroke: whatBroke || null,
        tacticalNotes: tacticalNotes || null,
        servesUsed: servesUsed || null,
        receiveNotes: receiveNotes || null,
        peakMode: peakMode ?? null,
      },
    });
    return NextResponse.json(match, { status: 201 });
  } catch (err) {
    console.error("[tt/matches] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create match detail route**

```typescript
// src/app/api/tt/matches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const match = await prisma.tTMatch.findUnique({ where: { id } });
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(match);
  } catch (err) {
    console.error("[tt/matches] Get error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const match = await prisma.tTMatch.update({
      where: { id },
      data: body as Record<string, unknown>,
    });
    return NextResponse.json(match);
  } catch (err) {
    console.error("[tt/matches] Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    await prisma.tTMatch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tt/matches] Delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create boost log route**

```typescript
// src/app/api/tt/boost/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const logs = await prisma.tTBoostLog.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(logs);
  } catch (err) {
    console.error("[tt/boost] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rubber, blade, side, booster, date, notes } = body as {
    rubber?: string;
    blade?: string;
    side?: string;
    booster?: string;
    date?: string;
    notes?: string;
  };

  if (!rubber || !blade || !side || !booster || !date) {
    return NextResponse.json({ error: "rubber, blade, side, booster, and date are required" }, { status: 400 });
  }

  try {
    const log = await prisma.tTBoostLog.create({
      data: {
        rubber,
        blade,
        side,
        booster,
        date: new Date(date),
        notes: notes || null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("[tt/boost] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create periods route**

```typescript
// src/app/api/tt/periods/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const phases = await prisma.tTPeriodPhase.findMany({
      orderBy: { startMonth: "asc" },
    });
    return NextResponse.json(phases);
  } catch (err) {
    console.error("[tt/periods] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, startMonth, endMonth, focusAreas, targets } = body as {
    name?: string;
    startMonth?: string;
    endMonth?: string;
    focusAreas?: string[];
    targets?: string[];
  };

  if (!name || !startMonth || !endMonth || !focusAreas || !targets) {
    return NextResponse.json({ error: "name, startMonth, endMonth, focusAreas, and targets are required" }, { status: 400 });
  }

  try {
    const phase = await prisma.tTPeriodPhase.create({
      data: {
        name,
        startMonth: new Date(startMonth),
        endMonth: new Date(endMonth),
        focusAreas,
        targets,
      },
    });
    return NextResponse.json(phase, { status: 201 });
  } catch (err) {
    console.error("[tt/periods] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, reviewNotes, focusAreas, targets } = body as {
    id?: string;
    reviewNotes?: string;
    focusAreas?: string[];
    targets?: string[];
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const phase = await prisma.tTPeriodPhase.update({
      where: { id },
      data: {
        ...(reviewNotes !== undefined ? { reviewNotes } : {}),
        ...(focusAreas ? { focusAreas } : {}),
        ...(targets ? { targets } : {}),
      },
    });
    return NextResponse.json(phase);
  } catch (err) {
    console.error("[tt/periods] Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/api/tt/equipment/" "src/app/api/tt/matches/" "src/app/api/tt/boost/" "src/app/api/tt/periods/"
git commit -m "feat(tt): add equipment, matches, boost, and periods API routes"
```

---

## Task 5: Sidebar Registration + TT Layout

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx`
- Create: `src/app/(dashboard)/dashboard/tt/layout.tsx`

- [ ] **Step 1: Add TT module to Sidebar MODULES array**

In `src/components/dashboard/Sidebar.tsx`, find the MODULES array and add the TT entry. Use 卓 (table) as the kanji icon:

```typescript
{ label: "Tsukuyomi", href: "/dashboard/tt", icon: "卓" },
```

Add it after the last existing module entry in the array.

- [ ] **Step 2: Create TT layout with sub-navigation**

```typescript
// src/app/(dashboard)/dashboard/tt/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TT_SECTIONS = [
  { label: "Hub", href: "/dashboard/tt", icon: "殿" },
  { label: "Log", href: "/dashboard/tt/log", icon: "記" },
  { label: "Atlas", href: "/dashboard/tt/atlas", icon: "写" },
  { label: "Lab", href: "/dashboard/tt/lab", icon: "器" },
  { label: "Matches", href: "/dashboard/tt/matches", icon: "戦" },
  { label: "Plan", href: "/dashboard/tt/plan", icon: "道" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function TTLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard/tt") return pathname === "/dashboard/tt";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen">
      {/* Sub-navigation */}
      <nav className="sticky top-0 z-30 border-b border-[var(--ink-wash-light)] bg-[var(--ink-deep)]/95 backdrop-blur-sm">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 lg:px-6">
          <span className="mr-3 font-mono text-[var(--vermillion)] text-xs tracking-wider uppercase">
            月読
          </span>
          {TT_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors"
              style={{
                color: isActive(s.href) ? "var(--vermillion)" : "var(--parchment-muted)",
              }}
            >
              <span className="text-xs">{s.icon}</span>
              <span>{s.label}</span>
              {isActive(s.href) && (
                <motion.div
                  layoutId="tt-tab-indicator"
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: "var(--vermillion-wash)" }}
                  transition={{ duration: 0.3, ease: [...ease] }}
                />
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [...ease] }}
        className="p-4 lg:p-6"
      >
        {children}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build compiles**

```bash
cd /Users/mac/prod/MACC
npx next build --no-lint 2>&1 | tail -20
```

Expected: Build succeeds with new layout recognized.

- [ ] **Step 4: Commit**

```bash
cd /Users/mac/prod/MACC
git add src/components/dashboard/Sidebar.tsx "src/app/(dashboard)/dashboard/tt/layout.tsx"
git commit -m "feat(tt): register Tsukuyomi module in sidebar + add sub-navigation layout"
```

---

## Task 6: Dashboard Hub Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/tt/page.tsx`

- [ ] **Step 1: Create the dashboard hub page**

```typescript
// src/app/(dashboard)/dashboard/tt/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

type Session = {
  id: string;
  date: string;
  duration: number;
  blade: string;
  mode1Respected: boolean | null;
  peakMode: number | null;
  energyLevel: number | null;
};

type TechniqueRating = {
  id: string;
  shot: string;
  rating: number;
  date: string;
};

type PeriodPhase = {
  id: string;
  name: string;
  startMonth: string;
  endMonth: string;
  focusAreas: string[];
  targets: string[];
};

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

const SPOTLIGHT_SHOTS = ["bh-flick", "bh-counter-loop", "fh-block"];

const NATIONALS_DATE = new Date("2026-11-01");

export default function TTDashboard() {
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [techniques, setTechniques] = useState<TechniqueRating[]>([]);
  const [currentPhase, setCurrentPhase] = useState<PeriodPhase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tt/sessions?limit=1").then((r) => r.json()),
      fetch("/api/tt/techniques").then((r) => r.json()),
      fetch("/api/tt/periods").then((r) => r.json()),
    ])
      .then(([sessions, techs, phases]) => {
        setLastSession(sessions[0] || null);
        setTechniques(techs);

        const now = new Date();
        const active = (phases as PeriodPhase[]).find(
          (p) => new Date(p.startMonth) <= now && new Date(p.endMonth) >= now
        );
        setCurrentPhase(active || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const daysToNationals = Math.ceil(
    (NATIONALS_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const spotlightTechniques = techniques.filter((t) =>
    SPOTLIGHT_SHOTS.includes(t.shot)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-mono text-sm text-[var(--parchment-muted)]">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1
            className="font-serif text-2xl font-semibold"
            style={{ color: "var(--parchment)" }}
          >
            月読 — Tsukuyomi
          </h1>
          <p
            className="mt-1 font-mono text-xs"
            style={{ color: "var(--parchment-muted)" }}
          >
            "You were in my genjutsu from ball 1"
          </p>
        </div>
        <div className="text-right">
          <div
            className="font-mono text-3xl font-bold"
            style={{ color: "var(--vermillion)" }}
          >
            {daysToNationals}
          </div>
          <div
            className="font-mono text-xs"
            style={{ color: "var(--parchment-muted)" }}
          >
            days to nationals
          </div>
        </div>
      </div>

      {/* Current Phase */}
      {currentPhase && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ease: [...ease] }}
          className="rounded-lg border p-4"
          style={{
            borderColor: "var(--ink-mid)",
            backgroundColor: "var(--ink-dark)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: "var(--gold-seal)" }}
            >
              Current Phase
            </span>
            <span
              className="font-serif text-sm"
              style={{ color: "var(--parchment)" }}
            >
              {currentPhase.name}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {currentPhase.focusAreas.map((area) => (
              <span
                key={area}
                className="rounded-full px-2.5 py-0.5 font-mono text-xs"
                style={{
                  backgroundColor: "var(--vermillion-wash)",
                  color: "var(--vermillion-glow)",
                }}
              >
                {area}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Last Session */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, ease: [...ease] }}
        className="rounded-lg border p-4"
        style={{
          borderColor: "var(--ink-mid)",
          backgroundColor: "var(--ink-dark)",
        }}
      >
        <span
          className="font-mono text-xs uppercase tracking-wider"
          style={{ color: "var(--parchment-muted)" }}
        >
          Last Session
        </span>
        {lastSession ? (
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div
                className="font-mono text-xs"
                style={{ color: "var(--parchment-dim)" }}
              >
                Date
              </div>
              <div
                className="font-mono text-sm"
                style={{ color: "var(--parchment)" }}
              >
                {new Date(lastSession.date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div
                className="font-mono text-xs"
                style={{ color: "var(--parchment-dim)" }}
              >
                Duration
              </div>
              <div
                className="font-mono text-sm"
                style={{ color: "var(--parchment)" }}
              >
                {lastSession.duration}min
              </div>
            </div>
            <div>
              <div
                className="font-mono text-xs"
                style={{ color: "var(--parchment-dim)" }}
              >
                Blade
              </div>
              <div
                className="font-mono text-sm"
                style={{ color: "var(--parchment)" }}
              >
                {lastSession.blade}
              </div>
            </div>
            <div>
              <div
                className="font-mono text-xs"
                style={{ color: "var(--parchment-dim)" }}
              >
                Mode 1 Respected?
              </div>
              <div
                className="font-mono text-sm"
                style={{
                  color: lastSession.mode1Respected
                    ? "var(--gold-seal)"
                    : lastSession.mode1Respected === false
                    ? "var(--vermillion)"
                    : "var(--parchment-dim)",
                }}
              >
                {lastSession.mode1Respected === true
                  ? "Yes"
                  : lastSession.mode1Respected === false
                  ? "No"
                  : "—"}
              </div>
            </div>
          </div>
        ) : (
          <p
            className="mt-2 font-mono text-sm"
            style={{ color: "var(--parchment-dim)" }}
          >
            No sessions logged yet.
          </p>
        )}
      </motion.div>

      {/* Technique Spotlight */}
      {spotlightTechniques.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: [...ease] }}
          className="rounded-lg border p-4"
          style={{
            borderColor: "var(--ink-mid)",
            backgroundColor: "var(--ink-dark)",
          }}
        >
          <span
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: "var(--parchment-muted)" }}
          >
            Technique Spotlight
          </span>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {spotlightTechniques.map((t) => (
              <Link
                key={t.shot}
                href={`/dashboard/tt/atlas/${t.shot}`}
                className="flex items-center justify-between rounded-md p-3 transition-colors hover:bg-[var(--ink-mid)]"
              >
                <span
                  className="font-mono text-sm"
                  style={{ color: "var(--parchment)" }}
                >
                  {t.shot.replace(/-/g, " ")}
                </span>
                <span
                  className="font-mono text-lg font-bold"
                  style={{
                    color:
                      t.rating >= 8
                        ? "var(--gold-seal)"
                        : t.rating >= 6
                        ? "var(--parchment)"
                        : "var(--vermillion)",
                  }}
                >
                  {t.rating}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ease: [...ease] }}
        className="flex gap-3"
      >
        <Link
          href="/dashboard/tt/log?new=1"
          className="flex-1 rounded-lg py-3 text-center font-mono text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--vermillion)",
            color: "var(--parchment)",
          }}
        >
          Log Session
        </Link>
        <Link
          href="/dashboard/tt/matches?new=1"
          className="flex-1 rounded-lg border py-3 text-center font-mono text-sm font-medium transition-colors"
          style={{
            borderColor: "var(--ink-mid)",
            color: "var(--parchment-muted)",
          }}
        >
          Log Match
        </Link>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders**

```bash
cd /Users/mac/prod/MACC
npx next build --no-lint 2>&1 | grep -E "(dashboard/tt|Error)" | head -10
```

Expected: No build errors for the TT pages.

- [ ] **Step 3: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/(dashboard)/dashboard/tt/page.tsx"
git commit -m "feat(tt): add Tsukuyomi dashboard hub — phase display, last session, technique spotlight, nationals countdown"
```

---

## Task 7: Training Log Pages

**Files:**
- Create: `src/app/(dashboard)/dashboard/tt/log/page.tsx`
- Create: `src/app/(dashboard)/dashboard/tt/log/[id]/page.tsx`

- [ ] **Step 1: Create training log list + create page**

```typescript
// src/app/(dashboard)/dashboard/tt/log/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

const CATEGORIES = [
  { value: "sharingan", label: "Sharingan", desc: "Serve/Receive" },
  { value: "amaterasu", label: "Amaterasu", desc: "Forehand" },
  { value: "totsuka", label: "Totsuka", desc: "Kill/Attack" },
  { value: "yata-mirror", label: "Yata Mirror", desc: "Block/Defense" },
];

type Session = {
  id: string;
  date: string;
  duration: number;
  blade: string;
  mode1Respected: boolean | null;
  peakMode: number | null;
  energyLevel: number | null;
  notes: string | null;
  drills: Array<{
    id: string;
    name: string;
    category: string;
    technique: string | null;
    rating: number | null;
    notes: string | null;
  }>;
};

type DrillInput = {
  name: string;
  category: string;
  technique: string;
  rating: string;
  notes: string;
};

const emptyDrill = (): DrillInput => ({
  name: "",
  category: "sharingan",
  technique: "",
  rating: "",
  notes: "",
});

export default function TrainingLog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showNew = searchParams.get("new") === "1";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(showNew);
  const [saving, setSaving] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("240");
  const [location, setLocation] = useState("");
  const [blade, setBlade] = useState("FZD ALC");
  const [mode1Respected, setMode1Respected] = useState<string>("yes");
  const [peakMode, setPeakMode] = useState("3");
  const [energyLevel, setEnergyLevel] = useState("7");
  const [notes, setNotes] = useState("");
  const [drills, setDrills] = useState<DrillInput[]>([emptyDrill()]);

  useEffect(() => {
    fetch("/api/tt/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  function addDrill() {
    setDrills((prev) => [...prev, emptyDrill()]);
  }

  function updateDrill(index: number, field: keyof DrillInput, value: string) {
    setDrills((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  function removeDrill(index: number) {
    setDrills((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      date,
      duration: parseInt(duration, 10),
      location: location || undefined,
      blade,
      mode1Respected: mode1Respected === "yes" ? true : mode1Respected === "no" ? false : undefined,
      peakMode: peakMode ? parseInt(peakMode, 10) : undefined,
      energyLevel: energyLevel ? parseInt(energyLevel, 10) : undefined,
      notes: notes || undefined,
      drills: drills
        .filter((d) => d.name.trim())
        .map((d) => ({
          name: d.name,
          category: d.category,
          technique: d.technique || undefined,
          rating: d.rating ? parseInt(d.rating, 10) : undefined,
          notes: d.notes || undefined,
        })),
    };

    const res = await fetch("/api/tt/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const created = await res.json();
      setSessions((prev) => [created, ...prev]);
      setShowForm(false);
      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setDuration("240");
      setLocation("");
      setNotes("");
      setDrills([emptyDrill()]);
    }
    setSaving(false);
  }

  const inputClass =
    "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] placeholder:text-[var(--parchment-dim)] focus:border-[var(--vermillion)] focus:outline-none";
  const labelClass = "block font-mono text-xs text-[var(--parchment-muted)] mb-1";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="font-serif text-xl font-semibold"
          style={{ color: "var(--parchment)" }}
        >
          記 — Training Log
        </h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md px-3 py-1.5 font-mono text-sm"
            style={{
              backgroundColor: "var(--vermillion)",
              color: "var(--parchment)",
            }}
          >
            New Session
          </button>
        )}
      </div>

      {/* New Session Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ease: [...ease] }}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border p-4"
            style={{
              borderColor: "var(--ink-mid)",
              backgroundColor: "var(--ink-dark)",
            }}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Blade</label>
                <select
                  value={blade}
                  onChange={(e) => setBlade(e.target.value)}
                  className={inputClass}
                >
                  <option value="FZD ALC">FZD ALC</option>
                  <option value="Q968">Q968</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Mode 1 Respected?</label>
                <select
                  value={mode1Respected}
                  onChange={(e) => setMode1Respected(e.target.value)}
                  className={inputClass}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Unsure</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Peak Mode (1-4)</label>
                <select
                  value={peakMode}
                  onChange={(e) => setPeakMode(e.target.value)}
                  className={inputClass}
                >
                  {[1, 2, 3, 4].map((m) => (
                    <option key={m} value={m}>
                      {m} — {MODE_NAMES[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Energy (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Drills */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass}>Drills</label>
                <button
                  type="button"
                  onClick={addDrill}
                  className="font-mono text-xs"
                  style={{ color: "var(--vermillion)" }}
                >
                  + Add drill
                </button>
              </div>
              <div className="space-y-3">
                {drills.map((drill, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-5"
                    style={{ borderColor: "var(--ink-mid)" }}
                  >
                    <input
                      type="text"
                      placeholder="Drill name"
                      value={drill.name}
                      onChange={(e) => updateDrill(i, "name", e.target.value)}
                      className={inputClass}
                    />
                    <select
                      value={drill.category}
                      onChange={(e) =>
                        updateDrill(i, "category", e.target.value)
                      }
                      className={inputClass}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Technique tag"
                      value={drill.technique}
                      onChange={(e) =>
                        updateDrill(i, "technique", e.target.value)
                      }
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min={1}
                      max={10}
                      placeholder="Rating"
                      value={drill.rating}
                      onChange={(e) => updateDrill(i, "rating", e.target.value)}
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Notes"
                        value={drill.notes}
                        onChange={(e) =>
                          updateDrill(i, "notes", e.target.value)
                        }
                        className={inputClass}
                      />
                      {drills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDrill(i)}
                          className="text-[var(--parchment-dim)] hover:text-[var(--vermillion)]"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="Session notes..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md px-4 py-2 font-mono text-sm"
                style={{
                  backgroundColor: "var(--vermillion)",
                  color: "var(--parchment)",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Session"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 font-mono text-sm"
                style={{ color: "var(--parchment-muted)" }}
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Session List */}
      {loading ? (
        <div className="py-10 text-center font-mono text-sm text-[var(--parchment-muted)]">
          Loading...
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-10 text-center font-mono text-sm text-[var(--parchment-dim)]">
          No sessions logged yet. Start training.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, ease: [...ease] }}
            >
              <Link
                href={`/dashboard/tt/log/${s.id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-[var(--vermillion-wash)]"
                style={{
                  borderColor: "var(--ink-mid)",
                  backgroundColor: "var(--ink-dark)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="font-mono text-sm"
                    style={{ color: "var(--parchment)" }}
                  >
                    {new Date(s.date).toLocaleDateString()}
                  </div>
                  <div
                    className="font-mono text-xs"
                    style={{ color: "var(--parchment-muted)" }}
                  >
                    {s.duration}min · {s.blade}
                  </div>
                  {s.peakMode && (
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-xs"
                      style={{
                        backgroundColor:
                          s.peakMode === 3
                            ? "var(--gold-seal-dim)"
                            : "var(--ink-mid)",
                        color:
                          s.peakMode === 3
                            ? "var(--gold-seal-glow)"
                            : "var(--parchment-muted)",
                      }}
                    >
                      {MODE_NAMES[s.peakMode]}
                    </span>
                  )}
                </div>
                <div>
                  {s.mode1Respected === true && (
                    <span
                      className="font-mono text-xs"
                      style={{ color: "var(--gold-seal)" }}
                    >
                      M1 ✓
                    </span>
                  )}
                  {s.mode1Respected === false && (
                    <span
                      className="font-mono text-xs"
                      style={{ color: "var(--vermillion)" }}
                    >
                      M1 ✗
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create session detail page**

```typescript
// src/app/(dashboard)/dashboard/tt/log/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

const CATEGORY_LABELS: Record<string, string> = {
  sharingan: "Sharingan",
  amaterasu: "Amaterasu",
  totsuka: "Totsuka",
  "yata-mirror": "Yata Mirror",
};

type Session = {
  id: string;
  date: string;
  duration: number;
  location: string | null;
  blade: string;
  mode1Respected: boolean | null;
  peakMode: number | null;
  energyLevel: number | null;
  notes: string | null;
  drills: Array<{
    id: string;
    name: string;
    category: string;
    technique: string | null;
    rating: number | null;
    notes: string | null;
  }>;
};

export default function SessionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tt/sessions/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSession)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/tt/sessions/${id}`, { method: "DELETE" });
    router.push("/dashboard/tt/log");
  }

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-muted)]">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-dim)]">
        Session not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tt/log"
          className="font-mono text-xs text-[var(--parchment-muted)] hover:text-[var(--vermillion)]"
        >
          ← Back to log
        </Link>
        <button
          onClick={handleDelete}
          className="font-mono text-xs text-[var(--parchment-dim)] hover:text-[var(--vermillion)]"
        >
          Delete
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [...ease] }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1
            className="font-serif text-xl font-semibold"
            style={{ color: "var(--parchment)" }}
          >
            {new Date(session.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h1>
          <div className="mt-1 flex items-center gap-3 font-mono text-sm text-[var(--parchment-muted)]">
            <span>{session.duration}min</span>
            <span>·</span>
            <span>{session.blade}</span>
            {session.location && (
              <>
                <span>·</span>
                <span>{session.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div
          className="grid grid-cols-3 gap-4 rounded-lg border p-4"
          style={{
            borderColor: "var(--ink-mid)",
            backgroundColor: "var(--ink-dark)",
          }}
        >
          <div>
            <div className="font-mono text-xs text-[var(--parchment-dim)]">
              Mode 1 Respected
            </div>
            <div
              className="mt-1 font-mono text-lg font-bold"
              style={{
                color:
                  session.mode1Respected === true
                    ? "var(--gold-seal)"
                    : session.mode1Respected === false
                    ? "var(--vermillion)"
                    : "var(--parchment-dim)",
              }}
            >
              {session.mode1Respected === true
                ? "Yes"
                : session.mode1Respected === false
                ? "No"
                : "—"}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs text-[var(--parchment-dim)]">
              Peak Mode
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-[var(--parchment)]">
              {session.peakMode
                ? `${session.peakMode} — ${MODE_NAMES[session.peakMode]}`
                : "—"}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs text-[var(--parchment-dim)]">
              Energy
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-[var(--parchment)]">
              {session.energyLevel ?? "—"}/10
            </div>
          </div>
        </div>

        {/* Drills */}
        {session.drills.length > 0 && (
          <div>
            <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-[var(--parchment-muted)]">
              Drills
            </h2>
            <div className="space-y-2">
              {session.drills.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-md border p-3"
                  style={{
                    borderColor: "var(--ink-mid)",
                    backgroundColor: "var(--ink-dark)",
                  }}
                >
                  <div>
                    <div className="font-mono text-sm text-[var(--parchment)]">
                      {d.name}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs text-[var(--parchment-dim)]">
                      <span>{CATEGORY_LABELS[d.category] || d.category}</span>
                      {d.technique && <span>· {d.technique}</span>}
                      {d.notes && <span>· {d.notes}</span>}
                    </div>
                  </div>
                  {d.rating && (
                    <span
                      className="font-mono text-lg font-bold"
                      style={{
                        color:
                          d.rating >= 8
                            ? "var(--gold-seal)"
                            : d.rating >= 6
                            ? "var(--parchment)"
                            : "var(--vermillion)",
                      }}
                    >
                      {d.rating}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {session.notes && (
          <div>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--parchment-muted)]">
              Notes
            </h2>
            <p className="font-mono text-sm leading-relaxed text-[var(--parchment)]">
              {session.notes}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/(dashboard)/dashboard/tt/log/"
git commit -m "feat(tt): add training log — session list, new session form with drill tracking, session detail view"
```

---

## Task 8: Technique Atlas — Overview Grid

**Files:**
- Create: `src/app/(dashboard)/dashboard/tt/atlas/page.tsx`

- [ ] **Step 1: Create the atlas overview page**

```typescript
// src/app/(dashboard)/dashboard/tt/atlas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

type TechniqueRating = {
  id: string;
  shot: string;
  rating: number;
  date: string;
};

type Reference = {
  shot: string;
  playerName: string;
};

const SHOT_CATALOG = [
  { slug: "bh-flick", name: "BH Flick", category: "sharingan" },
  { slug: "bh-opening-loop", name: "BH Opening Loop", category: "totsuka" },
  { slug: "bh-counter-loop", name: "BH Counter Loop", category: "totsuka" },
  { slug: "bh-block-redirect", name: "BH Block/Redirect", category: "yata-mirror" },
  { slug: "bh-kill-finish", name: "BH Kill/Finish", category: "totsuka" },
  { slug: "bh-push-touch", name: "BH Push/Touch", category: "sharingan" },
  { slug: "fh-opening-loop", name: "FH Opening Loop", category: "amaterasu" },
  { slug: "fh-counter-loop", name: "FH Counter Loop", category: "amaterasu" },
  { slug: "fh-kill-smash", name: "FH Kill/Smash", category: "amaterasu" },
  { slug: "fh-block", name: "FH Block", category: "yata-mirror" },
  { slug: "fh-flick", name: "FH Flick", category: "sharingan" },
  { slug: "fh-push-touch", name: "FH Push/Touch", category: "sharingan" },
  { slug: "pendulum-serve", name: "Pendulum Serve", category: "sharingan" },
  { slug: "reverse-pendulum", name: "Reverse Pendulum", category: "sharingan" },
  { slug: "backhand-serve", name: "Backhand Serve", category: "sharingan" },
  { slug: "receive", name: "Receive", category: "sharingan" },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  sharingan: { bg: "var(--vermillion-wash)", text: "var(--vermillion-glow)" },
  amaterasu: { bg: "rgba(201, 168, 76, 0.12)", text: "var(--gold-seal-glow)" },
  totsuka: { bg: "rgba(208, 58, 44, 0.2)", text: "var(--vermillion)" },
  "yata-mirror": { bg: "rgba(107, 99, 90, 0.2)", text: "var(--sumi-gray-light)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  sharingan: "写輪眼 Sharingan",
  amaterasu: "天照 Amaterasu",
  totsuka: "十拳剣 Totsuka",
  "yata-mirror": "八咫鏡 Yata Mirror",
};

export default function TechniqueAtlas() {
  const [ratings, setRatings] = useState<TechniqueRating[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/tt/techniques").then((r) => r.json()),
      fetch("/api/tt/references").then((r) => r.json()),
    ])
      .then(([techs, refs]) => {
        setRatings(techs);
        setReferences(refs);
      })
      .finally(() => setLoading(false));
  }, []);

  const ratingMap = new Map(ratings.map((r) => [r.shot, r.rating]));
  const refMap = new Map(references.map((r) => [r.shot, r.playerName]));

  const categories = ["all", "sharingan", "amaterasu", "totsuka", "yata-mirror"];
  const filtered =
    filter === "all"
      ? SHOT_CATALOG
      : SHOT_CATALOG.filter((s) => s.category === filter);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-muted)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1
        className="font-serif text-xl font-semibold"
        style={{ color: "var(--parchment)" }}
      >
        写 — Technique Atlas
      </h1>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className="rounded-full px-3 py-1 font-mono text-xs transition-colors"
            style={{
              backgroundColor:
                filter === c ? "var(--vermillion)" : "var(--ink-mid)",
              color:
                filter === c ? "var(--parchment)" : "var(--parchment-muted)",
            }}
          >
            {c === "all" ? "All" : CATEGORY_LABELS[c]?.split(" ")[1] || c}
          </button>
        ))}
      </div>

      {/* Shot grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((shot, i) => {
          const rating = ratingMap.get(shot.slug);
          const ref = refMap.get(shot.slug);
          const colors = CATEGORY_COLORS[shot.category];

          return (
            <motion.div
              key={shot.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, ease: [...ease] }}
            >
              <Link
                href={`/dashboard/tt/atlas/${shot.slug}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-[var(--vermillion-wash)]"
                style={{
                  borderColor: "var(--ink-mid)",
                  backgroundColor: "var(--ink-dark)",
                }}
              >
                <div>
                  <div
                    className="font-mono text-sm"
                    style={{ color: "var(--parchment)" }}
                  >
                    {shot.name}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {shot.category}
                    </span>
                    {ref && (
                      <span className="font-mono text-[10px] text-[var(--parchment-dim)]">
                        → {ref}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="font-mono text-2xl font-bold"
                  style={{
                    color: rating
                      ? rating >= 8
                        ? "var(--gold-seal)"
                        : rating >= 6
                        ? "var(--parchment)"
                        : "var(--vermillion)"
                      : "var(--ink-mid)",
                  }}
                >
                  {rating ?? "—"}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/(dashboard)/dashboard/tt/atlas/page.tsx"
git commit -m "feat(tt): add technique atlas overview — filterable shot grid with ratings and reference player tags"
```

---

## Task 9: Technique Atlas — Shot Detail Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/tt/atlas/[shot]/page.tsx`

- [ ] **Step 1: Create shot detail page with reference model**

```typescript
// src/app/(dashboard)/dashboard/tt/atlas/[shot]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

type Rating = {
  id: string;
  shot: string;
  rating: number;
  date: string;
  notes: string | null;
};

type Reference = {
  id: string;
  shot: string;
  playerName: string;
  mechanicsBreakdown: string | null;
  extractionNotes: string | null;
  comparisonNotes: string | null;
  videoLinks: Array<{ url: string; timestamp?: string; description?: string }> | null;
};

type DrillEntry = {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  session: { date: string; blade: string };
};

type ShotData = {
  shot: string;
  ratings: Rating[];
  references: Reference[];
  recentDrills: DrillEntry[];
};

export default function ShotDetail({
  params,
}: {
  params: Promise<{ shot: string }>;
}) {
  const { shot } = use(params);
  const [data, setData] = useState<ShotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [newRating, setNewRating] = useState("");
  const [newRatingNotes, setNewRatingNotes] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    fetch(`/api/tt/techniques/${shot}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [shot]);

  async function submitRating() {
    if (!newRating) return;
    setSavingRating(true);
    const res = await fetch("/api/tt/techniques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shot,
        rating: parseInt(newRating, 10),
        notes: newRatingNotes || undefined,
      }),
    });
    if (res.ok) {
      const entry = await res.json();
      setData((prev) =>
        prev ? { ...prev, ratings: [...prev.ratings, entry] } : prev
      );
      setNewRating("");
      setNewRatingNotes("");
    }
    setSavingRating(false);
  }

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-muted)]">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-dim)]">
        Shot not found.
      </div>
    );
  }

  const currentRating = data.ratings.length
    ? data.ratings[data.ratings.length - 1].rating
    : null;

  const prevRating = data.ratings.length > 1
    ? data.ratings[data.ratings.length - 2].rating
    : null;

  const trend = currentRating && prevRating
    ? currentRating > prevRating
      ? "↑"
      : currentRating < prevRating
      ? "↓"
      : "→"
    : null;

  const inputClass =
    "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] placeholder:text-[var(--parchment-dim)] focus:border-[var(--vermillion)] focus:outline-none";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/tt/atlas"
          className="font-mono text-xs text-[var(--parchment-muted)] hover:text-[var(--vermillion)]"
        >
          ← Atlas
        </Link>
        <div className="mt-2 flex items-baseline gap-4">
          <h1
            className="font-serif text-xl font-semibold"
            style={{ color: "var(--parchment)" }}
          >
            {shot.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </h1>
          {currentRating && (
            <span
              className="font-mono text-3xl font-bold"
              style={{
                color:
                  currentRating >= 8
                    ? "var(--gold-seal)"
                    : currentRating >= 6
                    ? "var(--parchment)"
                    : "var(--vermillion)",
              }}
            >
              {currentRating}
              {trend && (
                <span className="ml-1 text-lg">
                  {trend}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Your Game */}
        <div className="space-y-6">
          <h2
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: "var(--gold-seal)" }}
          >
            Your Game
          </h2>

          {/* Rating History */}
          {data.ratings.length > 0 && (
            <div
              className="rounded-lg border p-4"
              style={{
                borderColor: "var(--ink-mid)",
                backgroundColor: "var(--ink-dark)",
              }}
            >
              <h3 className="mb-3 font-mono text-xs text-[var(--parchment-muted)]">
                Rating History
              </h3>
              <div className="flex items-end gap-1" style={{ height: 80 }}>
                {data.ratings.map((r) => (
                  <div
                    key={r.id}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${(r.rating / 10) * 100}%`,
                      backgroundColor:
                        r.rating >= 8
                          ? "var(--gold-seal)"
                          : r.rating >= 6
                          ? "var(--parchment-muted)"
                          : "var(--vermillion)",
                      minWidth: 8,
                      maxWidth: 24,
                    }}
                    title={`${r.rating}/10 — ${new Date(r.date).toLocaleDateString()}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add Rating */}
          <div
            className="rounded-lg border p-4"
            style={{
              borderColor: "var(--ink-mid)",
              backgroundColor: "var(--ink-dark)",
            }}
          >
            <h3 className="mb-3 font-mono text-xs text-[var(--parchment-muted)]">
              Log Rating
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={10}
                placeholder="1-10"
                value={newRating}
                onChange={(e) => setNewRating(e.target.value)}
                className={`${inputClass} w-20`}
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newRatingNotes}
                onChange={(e) => setNewRatingNotes(e.target.value)}
                className={inputClass}
              />
              <button
                onClick={submitRating}
                disabled={savingRating || !newRating}
                className="rounded-md px-3 py-2 font-mono text-sm"
                style={{
                  backgroundColor: "var(--vermillion)",
                  color: "var(--parchment)",
                  opacity: savingRating || !newRating ? 0.5 : 1,
                }}
              >
                Save
              </button>
            </div>
          </div>

          {/* Recent Drills */}
          {data.recentDrills.length > 0 && (
            <div>
              <h3 className="mb-2 font-mono text-xs text-[var(--parchment-muted)]">
                Recent Drill Log
              </h3>
              <div className="space-y-1">
                {data.recentDrills.slice(0, 10).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-md px-3 py-2"
                    style={{ backgroundColor: "var(--ink-dark)" }}
                  >
                    <div>
                      <span className="font-mono text-sm text-[var(--parchment)]">
                        {d.name}
                      </span>
                      <span className="ml-2 font-mono text-xs text-[var(--parchment-dim)]">
                        {new Date(d.session.date).toLocaleDateString()} ·{" "}
                        {d.session.blade}
                      </span>
                    </div>
                    {d.rating && (
                      <span className="font-mono text-sm font-bold text-[var(--parchment)]">
                        {d.rating}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Reference Model */}
        <div className="space-y-6">
          <h2
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: "var(--vermillion)" }}
          >
            Reference Model
          </h2>

          {data.references.length > 0 ? (
            data.references.map((ref) => (
              <div
                key={ref.id}
                className="space-y-4 rounded-lg border p-4"
                style={{
                  borderColor: "var(--ink-mid)",
                  backgroundColor: "var(--ink-dark)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-serif text-lg font-semibold"
                    style={{ color: "var(--parchment)" }}
                  >
                    {ref.playerName}
                  </span>
                </div>

                {ref.mechanicsBreakdown && (
                  <div>
                    <h4 className="font-mono text-xs text-[var(--parchment-dim)]">
                      Mechanics
                    </h4>
                    <p className="mt-1 font-mono text-sm leading-relaxed text-[var(--parchment)]">
                      {ref.mechanicsBreakdown}
                    </p>
                  </div>
                )}

                {ref.extractionNotes && (
                  <div>
                    <h4 className="font-mono text-xs text-[var(--parchment-dim)]">
                      What You're Extracting
                    </h4>
                    <p className="mt-1 font-mono text-sm leading-relaxed text-[var(--parchment)]">
                      {ref.extractionNotes}
                    </p>
                  </div>
                )}

                {ref.comparisonNotes && (
                  <div>
                    <h4 className="font-mono text-xs text-[var(--parchment-dim)]">
                      Gap Analysis
                    </h4>
                    <p className="mt-1 font-mono text-sm leading-relaxed text-[var(--parchment)]">
                      {ref.comparisonNotes}
                    </p>
                  </div>
                )}

                {ref.videoLinks && ref.videoLinks.length > 0 && (
                  <div>
                    <h4 className="font-mono text-xs text-[var(--parchment-dim)]">
                      Video Study
                    </h4>
                    <div className="mt-1 space-y-1">
                      {ref.videoLinks.map((v, i) => (
                        <a
                          key={i}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block font-mono text-sm text-[var(--vermillion)] hover:underline"
                        >
                          {v.description || v.url}
                          {v.timestamp && (
                            <span className="ml-1 text-[var(--parchment-dim)]">
                              @{v.timestamp}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div
              className="rounded-lg border p-6 text-center"
              style={{
                borderColor: "var(--ink-mid)",
                backgroundColor: "var(--ink-dark)",
              }}
            >
              <p className="font-mono text-sm text-[var(--parchment-dim)]">
                No reference model added yet.
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--parchment-dim)]">
                Use the seed endpoint or add via API to populate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/(dashboard)/dashboard/tt/atlas/"
git commit -m "feat(tt): add technique atlas shot detail — rating history, drill log, pro reference model with video study"
```

---

## Task 10: Equipment Lab Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/tt/lab/page.tsx`

- [ ] **Step 1: Create the equipment lab page**

```typescript
// src/app/(dashboard)/dashboard/tt/lab/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

type EquipmentLog = {
  id: string;
  item: string;
  type: string;
  side: string | null;
  blade: string | null;
  dateStarted: string;
  dateEnded: string | null;
  satisfaction: number | null;
  pros: string | null;
  cons: string | null;
  verdict: string | null;
  revisitConditions: string | null;
  notes: string | null;
};

type BoostLog = {
  id: string;
  rubber: string;
  blade: string;
  side: string;
  booster: string;
  date: string;
  notes: string | null;
};

const CURRENT_SETUP = [
  {
    blade: "FZD ALC",
    weight: "195g",
    role: "Ball 3 dominance, lighter, immediate",
    fh: "J&H C57.5 + Haifu Yellow",
    bh: "J&H C52.5 + Falco Tempo Long",
  },
  {
    blade: "Q968",
    weight: "203g",
    role: "Extended rallies, explosive ceiling",
    fh: "J&H C57.5 + Haifu Yellow",
    bh: "J&H C52.5 + Falco Tempo Long",
  },
];

export default function EquipmentLab() {
  const [equipment, setEquipment] = useState<EquipmentLog[]>([]);
  const [boosts, setBoosts] = useState<BoostLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"setup" | "timeline" | "boosts">("setup");
  const [showBoostForm, setShowBoostForm] = useState(false);
  const [boostForm, setBoostForm] = useState({
    rubber: "J&H C57.5",
    blade: "FZD ALC",
    side: "fh",
    booster: "Haifu Yellow",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/tt/equipment").then((r) => r.json()),
      fetch("/api/tt/boost").then((r) => r.json()),
    ])
      .then(([eq, bo]) => {
        setEquipment(eq);
        setBoosts(bo);
      })
      .finally(() => setLoading(false));
  }, []);

  async function submitBoost(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tt/boost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(boostForm),
    });
    if (res.ok) {
      const created = await res.json();
      setBoosts((prev) => [created, ...prev]);
      setShowBoostForm(false);
    }
  }

  const latestBoost = (blade: string, side: string) => {
    const match = boosts.find((b) => b.blade === blade && b.side === side);
    if (!match) return null;
    const days = Math.floor(
      (Date.now() - new Date(match.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return { date: match.date, daysAgo: days };
  };

  const inputClass =
    "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] focus:border-[var(--vermillion)] focus:outline-none";
  const labelClass = "block font-mono text-xs text-[var(--parchment-muted)] mb-1";

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-muted)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1
        className="font-serif text-xl font-semibold"
        style={{ color: "var(--parchment)" }}
      >
        器 — Equipment Lab
      </h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["setup", "timeline", "boosts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-md px-3 py-1.5 font-mono text-xs transition-colors"
            style={{
              backgroundColor:
                tab === t ? "var(--vermillion)" : "var(--ink-mid)",
              color:
                tab === t ? "var(--parchment)" : "var(--parchment-muted)",
            }}
          >
            {t === "setup"
              ? "Current Setup"
              : t === "timeline"
              ? "Timeline"
              : "Boost Log"}
          </button>
        ))}
      </div>

      {/* Current Setup */}
      {tab === "setup" && (
        <div className="space-y-4">
          {CURRENT_SETUP.map((blade) => {
            const fhBoost = latestBoost(blade.blade, "fh");
            const bhBoost = latestBoost(blade.blade, "bh");

            return (
              <motion.div
                key={blade.blade}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: [...ease] }}
                className="rounded-lg border p-4"
                style={{
                  borderColor: "var(--ink-mid)",
                  backgroundColor: "var(--ink-dark)",
                }}
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <span
                      className="font-serif text-lg font-semibold"
                      style={{ color: "var(--parchment)" }}
                    >
                      {blade.blade}
                    </span>
                    <span className="ml-2 font-mono text-xs text-[var(--parchment-dim)]">
                      {blade.weight}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[var(--parchment-muted)]">
                    {blade.role}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-xs text-[var(--parchment-dim)]">
                      FH
                    </div>
                    <div className="font-mono text-sm text-[var(--parchment)]">
                      {blade.fh}
                    </div>
                    {fhBoost && (
                      <div
                        className="mt-1 font-mono text-xs"
                        style={{
                          color:
                            fhBoost.daysAgo > 21
                              ? "var(--vermillion)"
                              : "var(--parchment-dim)",
                        }}
                      >
                        Boosted {fhBoost.daysAgo}d ago
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-mono text-xs text-[var(--parchment-dim)]">
                      BH
                    </div>
                    <div className="font-mono text-sm text-[var(--parchment)]">
                      {blade.bh}
                    </div>
                    {bhBoost && (
                      <div
                        className="mt-1 font-mono text-xs"
                        style={{
                          color:
                            bhBoost.daysAgo > 21
                              ? "var(--vermillion)"
                              : "var(--parchment-dim)",
                        }}
                      >
                        Boosted {bhBoost.daysAgo}d ago
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      {tab === "timeline" && (
        <div className="space-y-3">
          {equipment.length === 0 ? (
            <p className="py-10 text-center font-mono text-sm text-[var(--parchment-dim)]">
              No equipment history logged yet.
            </p>
          ) : (
            equipment.map((eq) => (
              <div
                key={eq.id}
                className="rounded-lg border p-4"
                style={{
                  borderColor: "var(--ink-mid)",
                  backgroundColor: "var(--ink-dark)",
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-sm text-[var(--parchment)]">
                    {eq.item}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-xs"
                    style={{
                      backgroundColor:
                        eq.verdict === "kept"
                          ? "rgba(201, 168, 76, 0.15)"
                          : eq.verdict === "discarded"
                          ? "var(--vermillion-wash)"
                          : "var(--ink-mid)",
                      color:
                        eq.verdict === "kept"
                          ? "var(--gold-seal)"
                          : eq.verdict === "discarded"
                          ? "var(--vermillion)"
                          : "var(--parchment-muted)",
                    }}
                  >
                    {eq.verdict || "testing"}
                  </span>
                </div>
                <div className="mt-1 font-mono text-xs text-[var(--parchment-dim)]">
                  {eq.type} · {eq.side?.toUpperCase()} · {eq.blade} ·{" "}
                  {new Date(eq.dateStarted).toLocaleDateString()}
                  {eq.dateEnded &&
                    ` → ${new Date(eq.dateEnded).toLocaleDateString()}`}
                </div>
                {eq.pros && (
                  <p className="mt-2 font-mono text-xs text-[var(--gold-seal)]">
                    + {eq.pros}
                  </p>
                )}
                {eq.cons && (
                  <p className="font-mono text-xs text-[var(--vermillion)]">
                    - {eq.cons}
                  </p>
                )}
                {eq.notes && (
                  <p className="mt-1 font-mono text-xs text-[var(--parchment-muted)]">
                    {eq.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Boost Log */}
      {tab === "boosts" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowBoostForm(!showBoostForm)}
            className="rounded-md px-3 py-1.5 font-mono text-sm"
            style={{
              backgroundColor: "var(--vermillion)",
              color: "var(--parchment)",
            }}
          >
            Log Boost
          </button>

          <AnimatePresence>
            {showBoostForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={submitBoost}
                className="grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-3"
                style={{
                  borderColor: "var(--ink-mid)",
                  backgroundColor: "var(--ink-dark)",
                }}
              >
                <div>
                  <label className={labelClass}>Rubber</label>
                  <select
                    value={boostForm.rubber}
                    onChange={(e) =>
                      setBoostForm((p) => ({ ...p, rubber: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option>J&H C57.5</option>
                    <option>J&H C52.5</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Blade</label>
                  <select
                    value={boostForm.blade}
                    onChange={(e) =>
                      setBoostForm((p) => ({ ...p, blade: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option>FZD ALC</option>
                    <option>Q968</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Side</label>
                  <select
                    value={boostForm.side}
                    onChange={(e) =>
                      setBoostForm((p) => ({ ...p, side: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="fh">FH</option>
                    <option value="bh">BH</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Booster</label>
                  <select
                    value={boostForm.booster}
                    onChange={(e) =>
                      setBoostForm((p) => ({ ...p, booster: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option>Haifu Yellow</option>
                    <option>Falco Tempo Long</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input
                    type="date"
                    value={boostForm.date}
                    onChange={(e) =>
                      setBoostForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-md px-3 py-2 font-mono text-sm"
                    style={{
                      backgroundColor: "var(--vermillion)",
                      color: "var(--parchment)",
                    }}
                  >
                    Save
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {boosts.length === 0 ? (
              <p className="py-10 text-center font-mono text-sm text-[var(--parchment-dim)]">
                No boosts logged yet.
              </p>
            ) : (
              boosts.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-md border p-3"
                  style={{
                    borderColor: "var(--ink-mid)",
                    backgroundColor: "var(--ink-dark)",
                  }}
                >
                  <div>
                    <span className="font-mono text-sm text-[var(--parchment)]">
                      {b.rubber} · {b.side.toUpperCase()}
                    </span>
                    <span className="ml-2 font-mono text-xs text-[var(--parchment-dim)]">
                      on {b.blade} · {b.booster}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[var(--parchment-muted)]">
                    {new Date(b.date).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/(dashboard)/dashboard/tt/lab/"
git commit -m "feat(tt): add equipment lab — current setup, rubber timeline, boost tracker"
```

---

## Task 11: Match Journal Pages

**Files:**
- Create: `src/app/(dashboard)/dashboard/tt/matches/page.tsx`
- Create: `src/app/(dashboard)/dashboard/tt/matches/[id]/page.tsx`

- [ ] **Step 1: Create match journal list + create page**

```typescript
// src/app/(dashboard)/dashboard/tt/matches/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

type Match = {
  id: string;
  date: string;
  opponent: string;
  result: string;
  blade: string;
  tournament: string | null;
  peakMode: number | null;
};

type ScoreInput = { you: string; them: string };

export default function MatchJournal() {
  const searchParams = useSearchParams();
  const showNew = searchParams.get("new") === "1";

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(showNew);
  const [saving, setSaving] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [opponent, setOpponent] = useState("");
  const [opponentNotes, setOpponentNotes] = useState("");
  const [blade, setBlade] = useState("FZD ALC");
  const [tournament, setTournament] = useState("");
  const [scores, setScores] = useState<ScoreInput[]>([
    { you: "", them: "" },
    { you: "", them: "" },
    { you: "", them: "" },
  ]);
  const [whatWorked, setWhatWorked] = useState("");
  const [whatBroke, setWhatBroke] = useState("");
  const [tacticalNotes, setTacticalNotes] = useState("");
  const [servesUsed, setServesUsed] = useState("");
  const [receiveNotes, setReceiveNotes] = useState("");
  const [peakMode, setPeakMode] = useState("3");

  useEffect(() => {
    fetch("/api/tt/matches")
      .then((r) => r.json())
      .then(setMatches)
      .finally(() => setLoading(false));
  }, []);

  function updateScore(i: number, field: "you" | "them", value: string) {
    setScores((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  }

  function addGame() {
    setScores((prev) => [...prev, { you: "", them: "" }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const validScores = scores
      .filter((s) => s.you && s.them)
      .map((s) => ({ you: parseInt(s.you, 10), them: parseInt(s.them, 10) }));

    const yourWins = validScores.filter((s) => s.you > s.them).length;
    const theirWins = validScores.filter((s) => s.them > s.you).length;
    const result = `${yourWins}-${theirWins}`;

    const res = await fetch("/api/tt/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        opponent,
        opponentNotes: opponentNotes || undefined,
        result,
        scores: validScores,
        blade,
        tournament: tournament || undefined,
        whatWorked: whatWorked || undefined,
        whatBroke: whatBroke || undefined,
        tacticalNotes: tacticalNotes || undefined,
        servesUsed: servesUsed || undefined,
        receiveNotes: receiveNotes || undefined,
        peakMode: peakMode ? parseInt(peakMode, 10) : undefined,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      setMatches((prev) => [created, ...prev]);
      setShowForm(false);
      setOpponent("");
      setOpponentNotes("");
      setScores([
        { you: "", them: "" },
        { you: "", them: "" },
        { you: "", them: "" },
      ]);
      setWhatWorked("");
      setWhatBroke("");
      setTacticalNotes("");
      setServesUsed("");
      setReceiveNotes("");
    }
    setSaving(false);
  }

  const isWin = (result: string) => {
    const [a, b] = result.split("-").map(Number);
    return a > b;
  };

  const inputClass =
    "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] placeholder:text-[var(--parchment-dim)] focus:border-[var(--vermillion)] focus:outline-none";
  const labelClass = "block font-mono text-xs text-[var(--parchment-muted)] mb-1";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="font-serif text-xl font-semibold"
          style={{ color: "var(--parchment)" }}
        >
          戦 — Match Journal
        </h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md px-3 py-1.5 font-mono text-sm"
            style={{
              backgroundColor: "var(--vermillion)",
              color: "var(--parchment)",
            }}
          >
            New Match
          </button>
        )}
      </div>

      {/* New Match Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ease: [...ease] }}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border p-4"
            style={{
              borderColor: "var(--ink-mid)",
              backgroundColor: "var(--ink-dark)",
            }}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Opponent</label>
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Blade</label>
                <select
                  value={blade}
                  onChange={(e) => setBlade(e.target.value)}
                  className={inputClass}
                >
                  <option>FZD ALC</option>
                  <option>Q968</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tournament</label>
                <input
                  type="text"
                  value={tournament}
                  onChange={(e) => setTournament(e.target.value)}
                  className={inputClass}
                  placeholder="Practice / event name"
                />
              </div>
            </div>

            {/* Scores */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass}>Scores</label>
                <button
                  type="button"
                  onClick={addGame}
                  className="font-mono text-xs text-[var(--vermillion)]"
                >
                  + Add game
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {scores.map((s, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="font-mono text-xs text-[var(--parchment-dim)]">
                      G{i + 1}:
                    </span>
                    <input
                      type="number"
                      value={s.you}
                      onChange={(e) => updateScore(i, "you", e.target.value)}
                      className={`${inputClass} w-14 text-center`}
                      placeholder="You"
                    />
                    <span className="text-[var(--parchment-dim)]">-</span>
                    <input
                      type="number"
                      value={s.them}
                      onChange={(e) => updateScore(i, "them", e.target.value)}
                      className={`${inputClass} w-14 text-center`}
                      placeholder="Opp"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Opponent Style</label>
              <input
                type="text"
                value={opponentNotes}
                onChange={(e) => setOpponentNotes(e.target.value)}
                className={inputClass}
                placeholder="Playing style, strengths, weaknesses"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>What Worked</label>
                <textarea
                  value={whatWorked}
                  onChange={(e) => setWhatWorked(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>What Broke</label>
                <textarea
                  value={whatBroke}
                  onChange={(e) => setWhatBroke(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Serves Used</label>
                <input
                  type="text"
                  value={servesUsed}
                  onChange={(e) => setServesUsed(e.target.value)}
                  className={inputClass}
                  placeholder="Which serves worked?"
                />
              </div>
              <div>
                <label className={labelClass}>Receive Notes</label>
                <input
                  type="text"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className={inputClass}
                  placeholder="What gave trouble?"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tactical Notes (for next time)</label>
                <textarea
                  value={tacticalNotes}
                  onChange={(e) => setTacticalNotes(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Peak Mode</label>
                <select
                  value={peakMode}
                  onChange={(e) => setPeakMode(e.target.value)}
                  className={inputClass}
                >
                  {[1, 2, 3, 4].map((m) => (
                    <option key={m} value={m}>
                      {m} — {MODE_NAMES[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md px-4 py-2 font-mono text-sm"
                style={{
                  backgroundColor: "var(--vermillion)",
                  color: "var(--parchment)",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Match"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 font-mono text-sm text-[var(--parchment-muted)]"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Match List */}
      {loading ? (
        <div className="py-10 text-center font-mono text-sm text-[var(--parchment-muted)]">
          Loading...
        </div>
      ) : matches.length === 0 ? (
        <div className="py-10 text-center font-mono text-sm text-[var(--parchment-dim)]">
          No matches logged yet.
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, ease: [...ease] }}
            >
              <Link
                href={`/dashboard/tt/matches/${m.id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-[var(--vermillion-wash)]"
                style={{
                  borderColor: "var(--ink-mid)",
                  backgroundColor: "var(--ink-dark)",
                }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="font-mono text-lg font-bold"
                    style={{
                      color: isWin(m.result)
                        ? "var(--gold-seal)"
                        : "var(--vermillion)",
                    }}
                  >
                    {m.result}
                  </span>
                  <div>
                    <div className="font-mono text-sm text-[var(--parchment)]">
                      vs {m.opponent}
                    </div>
                    <div className="font-mono text-xs text-[var(--parchment-dim)]">
                      {new Date(m.date).toLocaleDateString()} · {m.blade}
                      {m.tournament && ` · ${m.tournament}`}
                    </div>
                  </div>
                </div>
                {m.peakMode && (
                  <span className="font-mono text-xs text-[var(--parchment-muted)]">
                    {MODE_NAMES[m.peakMode]}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create match detail page**

```typescript
// src/app/(dashboard)/dashboard/tt/matches/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

const MODE_NAMES: Record<number, string> = {
  1: "Calibration",
  2: "Building",
  3: "Susanoo",
  4: "Override",
};

type Match = {
  id: string;
  date: string;
  opponent: string;
  opponentNotes: string | null;
  result: string;
  scores: Array<{ you: number; them: number }> | null;
  blade: string;
  tournament: string | null;
  whatWorked: string | null;
  whatBroke: string | null;
  tacticalNotes: string | null;
  servesUsed: string | null;
  receiveNotes: string | null;
  peakMode: number | null;
};

export default function MatchDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tt/matches/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setMatch)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this match?")) return;
    await fetch(`/api/tt/matches/${id}`, { method: "DELETE" });
    router.push("/dashboard/tt/matches");
  }

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-muted)]">
        Loading...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-dim)]">
        Match not found.
      </div>
    );
  }

  const isWin = () => {
    const [a, b] = match.result.split("-").map(Number);
    return a > b;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tt/matches"
          className="font-mono text-xs text-[var(--parchment-muted)] hover:text-[var(--vermillion)]"
        >
          ← Back to matches
        </Link>
        <button
          onClick={handleDelete}
          className="font-mono text-xs text-[var(--parchment-dim)] hover:text-[var(--vermillion)]"
        >
          Delete
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [...ease] }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-baseline gap-4">
          <span
            className="font-mono text-4xl font-bold"
            style={{
              color: isWin() ? "var(--gold-seal)" : "var(--vermillion)",
            }}
          >
            {match.result}
          </span>
          <div>
            <h1 className="font-serif text-xl font-semibold text-[var(--parchment)]">
              vs {match.opponent}
            </h1>
            <div className="font-mono text-xs text-[var(--parchment-muted)]">
              {new Date(match.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              · {match.blade}
              {match.tournament && ` · ${match.tournament}`}
            </div>
          </div>
        </div>

        {/* Scorecard */}
        {match.scores && match.scores.length > 0 && (
          <div
            className="rounded-lg border p-4"
            style={{
              borderColor: "var(--ink-mid)",
              backgroundColor: "var(--ink-dark)",
            }}
          >
            <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-[var(--parchment-muted)]">
              Scorecard
            </h2>
            <div className="flex gap-4">
              {match.scores.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="font-mono text-xs text-[var(--parchment-dim)]">
                    G{i + 1}
                  </div>
                  <div
                    className="font-mono text-lg font-bold"
                    style={{
                      color:
                        s.you > s.them
                          ? "var(--gold-seal)"
                          : "var(--vermillion)",
                    }}
                  >
                    {s.you}-{s.them}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {match.whatWorked && (
            <div
              className="rounded-lg border p-4"
              style={{
                borderColor: "var(--ink-mid)",
                backgroundColor: "var(--ink-dark)",
              }}
            >
              <h3 className="font-mono text-xs text-[var(--gold-seal)]">
                What Worked
              </h3>
              <p className="mt-2 font-mono text-sm leading-relaxed text-[var(--parchment)]">
                {match.whatWorked}
              </p>
            </div>
          )}
          {match.whatBroke && (
            <div
              className="rounded-lg border p-4"
              style={{
                borderColor: "var(--ink-mid)",
                backgroundColor: "var(--ink-dark)",
              }}
            >
              <h3 className="font-mono text-xs text-[var(--vermillion)]">
                What Broke
              </h3>
              <p className="mt-2 font-mono text-sm leading-relaxed text-[var(--parchment)]">
                {match.whatBroke}
              </p>
            </div>
          )}
          {match.servesUsed && (
            <div
              className="rounded-lg border p-4"
              style={{
                borderColor: "var(--ink-mid)",
                backgroundColor: "var(--ink-dark)",
              }}
            >
              <h3 className="font-mono text-xs text-[var(--parchment-muted)]">
                Serves Used
              </h3>
              <p className="mt-2 font-mono text-sm text-[var(--parchment)]">
                {match.servesUsed}
              </p>
            </div>
          )}
          {match.receiveNotes && (
            <div
              className="rounded-lg border p-4"
              style={{
                borderColor: "var(--ink-mid)",
                backgroundColor: "var(--ink-dark)",
              }}
            >
              <h3 className="font-mono text-xs text-[var(--parchment-muted)]">
                Receive Notes
              </h3>
              <p className="mt-2 font-mono text-sm text-[var(--parchment)]">
                {match.receiveNotes}
              </p>
            </div>
          )}
        </div>

        {/* Opponent Scouting Card */}
        {match.opponentNotes && (
          <div
            className="rounded-lg border p-4"
            style={{
              borderColor: "var(--ink-mid)",
              backgroundColor: "var(--ink-dark)",
            }}
          >
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--parchment-muted)]">
              Scouting — {match.opponent}
            </h2>
            <p className="font-mono text-sm leading-relaxed text-[var(--parchment)]">
              {match.opponentNotes}
            </p>
          </div>
        )}

        {/* Tactical Notes */}
        {match.tacticalNotes && (
          <div
            className="rounded-lg border-l-2 p-4"
            style={{
              borderColor: "var(--vermillion)",
              backgroundColor: "var(--ink-dark)",
            }}
          >
            <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--vermillion)]">
              Next Time
            </h2>
            <p className="font-mono text-sm leading-relaxed text-[var(--parchment)]">
              {match.tacticalNotes}
            </p>
          </div>
        )}

        {/* Peak Mode */}
        {match.peakMode && (
          <div className="font-mono text-xs text-[var(--parchment-dim)]">
            Peak mode: {match.peakMode} — {MODE_NAMES[match.peakMode]}
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/(dashboard)/dashboard/tt/matches/"
git commit -m "feat(tt): add match journal — match list, new match form with scorecard, match detail with scouting card"
```

---

## Task 12: Periodization Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/tt/plan/page.tsx`

- [ ] **Step 1: Create periodization calendar page**

```typescript
// src/app/(dashboard)/dashboard/tt/plan/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

type PeriodPhase = {
  id: string;
  name: string;
  startMonth: string;
  endMonth: string;
  focusAreas: string[];
  targets: string[];
  reviewNotes: string | null;
};

const NATIONALS_DATE = new Date("2026-11-01");

export default function Periodization() {
  const [phases, setPhases] = useState<PeriodPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    fetch("/api/tt/periods")
      .then((r) => r.json())
      .then(setPhases)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const daysToNationals = Math.ceil(
    (NATIONALS_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  function isCurrentPhase(phase: PeriodPhase) {
    return new Date(phase.startMonth) <= now && new Date(phase.endMonth) >= now;
  }

  function isPastPhase(phase: PeriodPhase) {
    return new Date(phase.endMonth) < now;
  }

  async function saveReview(phaseId: string) {
    const res = await fetch("/api/tt/periods", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: phaseId, reviewNotes: reviewText }),
    });
    if (res.ok) {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === phaseId ? { ...p, reviewNotes: reviewText } : p
        )
      );
      setEditingReview(null);
    }
  }

  const inputClass =
    "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm border-[var(--ink-mid)] text-[var(--parchment)] focus:border-[var(--vermillion)] focus:outline-none";

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[var(--parchment-muted)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-baseline justify-between">
        <h1
          className="font-serif text-xl font-semibold"
          style={{ color: "var(--parchment)" }}
        >
          道 — Road to Nationals
        </h1>
        <div className="text-right">
          <div
            className="font-mono text-2xl font-bold"
            style={{ color: "var(--vermillion)" }}
          >
            {daysToNationals}
          </div>
          <div className="font-mono text-xs text-[var(--parchment-muted)]">
            days remaining
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {phases.length === 0 ? (
          <p className="py-10 text-center font-mono text-sm text-[var(--parchment-dim)]">
            No phases defined yet. Seed the periodization data to get started.
          </p>
        ) : (
          phases.map((phase, i) => {
            const current = isCurrentPhase(phase);
            const past = isPastPhase(phase);

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: [...ease] }}
                className="rounded-lg border p-5"
                style={{
                  borderColor: current
                    ? "var(--vermillion)"
                    : "var(--ink-mid)",
                  backgroundColor: "var(--ink-dark)",
                  opacity: past ? 0.6 : 1,
                }}
              >
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-3">
                    {current && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: "var(--vermillion)" }}
                      />
                    )}
                    <h2
                      className="font-serif text-lg font-semibold"
                      style={{ color: "var(--parchment)" }}
                    >
                      {phase.name}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-[var(--parchment-dim)]">
                    {new Date(phase.startMonth).toLocaleDateString("en-US", {
                      month: "short",
                    })}{" "}
                    —{" "}
                    {new Date(phase.endMonth).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Focus Areas */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {phase.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full px-2.5 py-0.5 font-mono text-xs"
                      style={{
                        backgroundColor: current
                          ? "var(--vermillion-wash)"
                          : "var(--ink-mid)",
                        color: current
                          ? "var(--vermillion-glow)"
                          : "var(--parchment-muted)",
                      }}
                    >
                      {area}
                    </span>
                  ))}
                </div>

                {/* Targets */}
                <div className="mt-3 space-y-1">
                  {phase.targets.map((target) => (
                    <div
                      key={target}
                      className="flex items-center gap-2 font-mono text-sm"
                      style={{ color: "var(--parchment-muted)" }}
                    >
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{
                          backgroundColor: "var(--parchment-dim)",
                        }}
                      />
                      {target}
                    </div>
                  ))}
                </div>

                {/* Review Notes */}
                {(past || current) && (
                  <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--ink-mid)" }}>
                    {editingReview === phase.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          rows={3}
                          className={inputClass}
                          placeholder="Phase review — what progressed, what didn't, what carries forward?"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveReview(phase.id)}
                            className="rounded-md px-3 py-1 font-mono text-xs"
                            style={{
                              backgroundColor: "var(--vermillion)",
                              color: "var(--parchment)",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingReview(null)}
                            className="font-mono text-xs text-[var(--parchment-dim)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {phase.reviewNotes ? (
                          <p className="font-mono text-sm text-[var(--parchment-muted)]">
                            {phase.reviewNotes}
                          </p>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingReview(phase.id);
                              setReviewText(phase.reviewNotes || "");
                            }}
                            className="font-mono text-xs text-[var(--parchment-dim)] hover:text-[var(--vermillion)]"
                          >
                            + Add phase review
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/(dashboard)/dashboard/tt/plan/"
git commit -m "feat(tt): add periodization page — phase timeline with targets, focus areas, review notes"
```

---

## Task 13: Seed Data Endpoint

**Files:**
- Create: `src/app/api/tt/seed/route.ts`

- [ ] **Step 1: Create seed endpoint with initial technique ratings, references, equipment history, and periodization phases**

```typescript
// src/app/api/tt/seed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const today = new Date().toISOString().split("T")[0];

    // Seed technique ratings
    const ratings = [
      { shot: "bh-flick", rating: 5 },
      { shot: "bh-opening-loop", rating: 8 },
      { shot: "bh-counter-loop", rating: 6 },
      { shot: "bh-block-redirect", rating: 8 },
      { shot: "bh-kill-finish", rating: 7 },
      { shot: "bh-push-touch", rating: 8 },
      { shot: "fh-opening-loop", rating: 9 },
      { shot: "fh-counter-loop", rating: 8 },
      { shot: "fh-kill-smash", rating: 9 },
      { shot: "fh-block", rating: 4 },
      { shot: "fh-flick", rating: 4 },
      { shot: "fh-push-touch", rating: 8 },
    ];

    await prisma.tTTechniqueRating.createMany({
      data: ratings.map((r) => ({
        shot: r.shot,
        rating: r.rating,
        date: new Date(today),
        notes: "Initial baseline assessment",
      })),
    });

    // Seed technique references
    const references = [
      {
        shot: "bh-flick",
        playerName: "Lin Yun-Ju",
        extractionNotes: "Wrist snap, timing, receive-to-attack transition. Compact motion that generates speed without big backswing.",
      },
      {
        shot: "bh-opening-loop",
        playerName: "Lin Shidong",
        extractionNotes: "Compact swing that generates power without a big windup. Rally sustain — can maintain backhand pressure over extended exchanges.",
      },
      {
        shot: "bh-opening-loop",
        playerName: "Fan Zhendong",
        extractionNotes: "Raw power from any position. The ability to open with authority whether close, mid, or far from the table.",
      },
      {
        shot: "bh-counter-loop",
        playerName: "Lin Shidong",
        extractionNotes: "Rally sustain and consistency. FZD-style backhand with more spin variation.",
      },
      {
        shot: "bh-block-redirect",
        playerName: "Fan Zhendong",
        extractionNotes: "Versatility — punch block, active block, redirect. Uses block to set up the next attacking ball.",
      },
      {
        shot: "bh-kill-finish",
        playerName: "Fan Zhendong",
        extractionNotes: "The statement shot. Walk-off energy. Power, flatness, and placement that ends rallies with authority.",
      },
      {
        shot: "fh-opening-loop",
        playerName: "Fan Zhendong",
        extractionNotes: "Complete forehand reference — loop, drive, counter, kill. The Amaterasu standard.",
      },
      {
        shot: "fh-counter-loop",
        playerName: "Fan Zhendong",
        extractionNotes: "Mid-range bombs in rallies at extreme ends of the board. Hugo Calderano's effortless quality is also a reference here.",
      },
      {
        shot: "fh-kill-smash",
        playerName: "Fan Zhendong",
        extractionNotes: "The Amaterasu finish. Beautiful, powerful, undeniable.",
      },
      {
        shot: "pendulum-serve",
        playerName: "Lin Yun-Ju",
        extractionNotes: "Extended arm pendulum. 5+ spin variations from the same motion — no-spin, backspin, heavy backspin, back-side, side.",
      },
      {
        shot: "backhand-serve",
        playerName: "Dimitrij Ovtcharov",
        extractionNotes: "Good variance of top, back, side from backhand position. Used as a curveball in close games.",
      },
      {
        shot: "receive",
        playerName: "Lin Yun-Ju",
        extractionNotes: "Flick mastery and receive-to-attack transition. The ability to threaten on every short serve.",
      },
    ];

    await prisma.tTTechniqueReference.createMany({
      data: references,
    });

    // Seed equipment history (BH rubber journey)
    const equipmentHistory = [
      {
        item: "Dignics 09C",
        type: "rubber",
        side: "bh",
        blade: "FZD ALC",
        dateStarted: new Date("2025-06-01"),
        dateEnded: new Date("2025-08-01"),
        satisfaction: 5,
        pros: "Good starter rubber coming back to the sport",
        cons: "High arc felt strange, lacked directness",
        verdict: "discarded",
      },
      {
        item: "Dignics 05",
        type: "rubber",
        side: "bh",
        blade: "FZD ALC",
        dateStarted: new Date("2025-08-01"),
        dateEnded: new Date("2025-11-01"),
        satisfaction: 6,
        pros: "Excellent in rallies, open ball environments",
        cons: "Too sensitive for serve receive and short game",
        verdict: "discarded",
      },
      {
        item: "Zyre 03",
        type: "rubber",
        side: "bh",
        blade: "FZD ALC",
        dateStarted: new Date("2025-11-01"),
        dateEnded: new Date("2026-02-01"),
        satisfaction: 7,
        pros: "Over-the-table play, topspin rallies, driving/flat balls almost unbeatable. Natural catapult.",
        cons: "No chop game, lack of feel/flexibility. Felt vulnerable on BH side. Swordmaster cloak — no armor, no room for error.",
        verdict: "discarded",
        revisitConditions: "If flick and short game become strong enough to not need defensive options",
      },
      {
        item: "Xiom J&H C52.5",
        type: "rubber",
        side: "bh",
        blade: "FZD ALC",
        dateStarted: new Date("2026-02-01"),
        satisfaction: 8,
        pros: "Tack, easier to play, some Zyre capabilities plus 09C positives without the high arc. Chinese-feeling sponge with catapult.",
        cons: "Still learning its niches. Requires active play.",
        verdict: "kept",
        notes: "Boosted with Falco Tempo Long. Current rubber on both blades.",
      },
    ];

    await prisma.tTEquipmentLog.createMany({
      data: equipmentHistory,
    });

    // Seed periodization phases
    const phases = [
      {
        name: "Foundation",
        startMonth: new Date("2026-04-01"),
        endMonth: new Date("2026-05-31"),
        focusAreas: ["BH flick rebuild", "Mode 1 discipline", "Footwork efficiency"],
        targets: ["Flick 5→6.5", "Conscious calibration every session", "Reduce unforced errors from rushing"],
      },
      {
        name: "Development",
        startMonth: new Date("2026-06-01"),
        endMonth: new Date("2026-07-31"),
        focusAreas: ["BH counter-loop consistency", "FH block development", "Fitness ramp"],
        targets: ["Counter 6→7.5", "Crossover zone improvement", "Calisthenics 3x/week"],
      },
      {
        name: "Integration",
        startMonth: new Date("2026-08-01"),
        endMonth: new Date("2026-09-30"),
        focusAreas: ["Full game under pressure", "Serve/receive sharpening", "Match simulation"],
        targets: ["All systems working under pressure", "Serve variation mastery", "Tournament-pace rallies in practice"],
      },
      {
        name: "Competition",
        startMonth: new Date("2026-10-01"),
        endMonth: new Date("2026-11-30"),
        focusAreas: ["Broward tournament reps", "Tactical prep", "Peaking"],
        targets: ["Peak form for nationals", "Opponent-specific gameplans", "Mental game under tournament pressure"],
      },
    ];

    await prisma.tTPeriodPhase.createMany({
      data: phases,
    });

    return NextResponse.json({
      seeded: {
        ratings: ratings.length,
        references: references.length,
        equipment: equipmentHistory.length,
        phases: phases.length,
      },
    });
  } catch (err) {
    console.error("[tt/seed] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/prod/MACC
git add "src/app/api/tt/seed/"
git commit -m "feat(tt): add seed endpoint — initial technique ratings, pro references, equipment history, periodization phases"
```

---

## Task 14: Build Verification + Final Commit

- [ ] **Step 1: Run full build**

```bash
cd /Users/mac/prod/MACC
npx next build --no-lint 2>&1 | tail -30
```

Expected: Build succeeds with all TT routes compiled.

- [ ] **Step 2: Fix any build errors**

Address any TypeScript or import errors from the build output.

- [ ] **Step 3: Run Prisma generate to confirm schema**

```bash
cd /Users/mac/prod/MACC
npx prisma generate
```

Expected: Prisma client generates successfully.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
cd /Users/mac/prod/MACC
git add -A
git commit -m "fix(tt): resolve build errors from Tsukuyomi module"
```

- [ ] **Step 5: Push to GitHub**

```bash
cd /Users/mac/prod/MACC
git push origin main
```
