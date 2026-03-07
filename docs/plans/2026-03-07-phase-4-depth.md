# Phase 4: Depth Modules Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the remaining 5 dashboard modules — Investments, People (Contacts), Travel, Creative Projects, Reading — completing the full MikeOS feature set.

**Architecture:** Each module follows the established CRUD pattern: API route (`route.ts` for GET/POST) + dynamic route (`[id]/route.ts` for PATCH/DELETE) + dashboard page with Framer Motion animations. Models with child relations (Investment→InvestmentNote, Contact→ContactInteraction) get nested API endpoints.

**Tech Stack:** Next.js 16 App Router, Prisma 7, TypeScript, Framer Motion, Tailwind CSS v4

---

## Reference Patterns

**API Route (list + create):** `src/app/api/goals/route.ts`
- GET: `prisma.goal.findMany({ where, orderBy })` with query param filters
- POST: `prisma.goal.create({ data })` with JSON body
- Both start with `const denied = requireAuth(request); if (denied) return denied;`

**API Route (update + delete):** `src/app/api/goals/[id]/route.ts`
- PATCH: `prisma.goal.update({ where: { id }, data })` — only updates provided fields
- DELETE: `prisma.goal.delete({ where: { id } })`
- Next.js 16: `const { id } = await params;`

**Dashboard Page:** `src/app/(dashboard)/dashboard/goals/page.tsx`
- "use client", useState for data + form inputs, useCallback/useEffect for fetch
- motion.div with staggered entry animations, AnimatePresence for list transitions
- Sumi-e design tokens: `bg-ink-dark/40`, `border-sumi-gray-dark/12`, `text-parchment`, `text-vermillion`

**Auth:** `import { requireAuth } from "@/lib/auth";`

**Prisma:** `import { prisma } from "@/lib/prisma";`

**Sidebar Routes (already configured):**
- `/dashboard/investments` (株)
- `/dashboard/people` (人)
- `/dashboard/travel` (旅)
- `/dashboard/creative` (芸)
- `/dashboard/reading` (読)

---

### Task 1: Investment Tracker — API Routes

**Files:**
- Create: `src/app/api/investments/route.ts`
- Create: `src/app/api/investments/[id]/route.ts`
- Create: `src/app/api/investments/[id]/notes/route.ts`

**Step 1: Create list + create route**

```typescript
// src/app/api/investments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;

  const investments = await prisma.investment.findMany({
    orderBy: { createdAt: "desc" },
    include: { notes: { orderBy: { createdAt: "desc" }, take: 3 } },
  });
  return NextResponse.json(investments);
}

export async function POST(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;

  const body = await request.json();
  const { symbol, thesis, entryPrice, currentPrice } = body;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const investment = await prisma.investment.create({
    data: {
      symbol: symbol.toUpperCase(),
      thesis: thesis || "",
      entryPrice: entryPrice ? parseFloat(entryPrice) : null,
      currentPrice: currentPrice ? parseFloat(currentPrice) : null,
    },
  });
  return NextResponse.json(investment, { status: 201 });
}
```

**Step 2: Create update + delete route**

```typescript
// src/app/api/investments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAuth(request);
  if (denied) return denied;
  const { id } = await params;

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.symbol !== undefined) data.symbol = body.symbol.toUpperCase();
  if (body.thesis !== undefined) data.thesis = body.thesis;
  if (body.entryPrice !== undefined) data.entryPrice = body.entryPrice ? parseFloat(body.entryPrice) : null;
  if (body.currentPrice !== undefined) data.currentPrice = body.currentPrice ? parseFloat(body.currentPrice) : null;

  const investment = await prisma.investment.update({ where: { id }, data });
  return NextResponse.json(investment);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAuth(request);
  if (denied) return denied;
  const { id } = await params;

  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

**Step 3: Create notes sub-route**

```typescript
// src/app/api/investments/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAuth(request);
  if (denied) return denied;
  const { id } = await params;

  const body = await request.json();
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const note = await prisma.investmentNote.create({
    data: { investmentId: id, content: body.content.trim() },
  });
  return NextResponse.json(note, { status: 201 });
}
```

**Step 4: Verify routes compile**

Run: `npx next build --no-lint 2>&1 | head -30` or test with curl after dev server

**Step 5: Commit**

```bash
git add src/app/api/investments/
git commit -m "feat: add investment tracker API routes"
```

---

### Task 2: Investment Tracker — Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/investments/page.tsx`

**Step 1: Build the investments dashboard page**

Full page with:
- Header: "Investments" title + subtitle "Track your portfolio thesis and positions."
- Add form: symbol input + optional entry price + "Add" button
- Investment cards showing: symbol (large), thesis, entry/current price, P&L percentage
- Expandable notes section per investment with add-note input
- Each card has hover actions: edit thesis, delete
- Color-code P&L: green for gain, red for loss
- Framer Motion staggered entry, AnimatePresence for list

Key UI details:
- Symbol displayed as large mono text
- P&L calculated client-side: `((current - entry) / entry * 100).toFixed(1)%`
- Notes shown as a collapsible list under each card
- Add note: inline text input that appears on click

**Step 2: Verify page renders**

Navigate to `/dashboard/investments` in browser

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/investments/"
git commit -m "feat: add investments dashboard page"
```

---

### Task 3: People (Contacts) — API Routes

**Files:**
- Create: `src/app/api/contacts/route.ts`
- Create: `src/app/api/contacts/[id]/route.ts`
- Create: `src/app/api/contacts/[id]/interactions/route.ts`

**Step 1: Create list + create route**

```typescript
// src/app/api/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;

  const search = request.nextUrl.searchParams.get("search") || "";
  const contacts = await prisma.contact.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { lastInteraction: { sort: "desc", nulls: "last" } },
    include: { interactions: { orderBy: { date: "desc" }, take: 3 } },
  });
  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;

  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { name: body.name.trim(), context: body.context || "" },
  });
  return NextResponse.json(contact, { status: 201 });
}
```

**Step 2: Create update + delete route**

```typescript
// src/app/api/contacts/[id]/route.ts
// PATCH: update name, context, lastInteraction
// DELETE: delete contact (cascades interactions)
// Same pattern as investments/[id]/route.ts
```

**Step 3: Create interactions sub-route**

```typescript
// src/app/api/contacts/[id]/interactions/route.ts
// POST: create interaction with { notes, date? }
// Also updates contact.lastInteraction to the interaction date
```

**Step 4: Commit**

```bash
git add src/app/api/contacts/
git commit -m "feat: add contacts/people API routes"
```

---

### Task 4: People (Contacts) — Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/people/page.tsx`

**Step 1: Build the people dashboard page**

Full page with:
- Header: "People" + "Your relationships and interactions."
- Search input for filtering contacts
- Add contact form: name + context
- Contact cards showing: name, context, last interaction date, interaction count
- Expandable interaction log per contact
- Add interaction: date + notes inline form
- "Days since last contact" indicator with color coding (green <7d, yellow <30d, red >30d)
- Hover actions: edit context, delete

**Step 2: Verify page renders**

Navigate to `/dashboard/people` in browser

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/people/"
git commit -m "feat: add people dashboard page"
```

---

### Task 5: Travel / Bucket List — API Routes

**Files:**
- Create: `src/app/api/travel/route.ts`
- Create: `src/app/api/travel/[id]/route.ts`

**Step 1: Create list + create route**

```typescript
// src/app/api/travel/route.ts
// GET: findMany with optional category and status filters
// POST: create with title, category (trip/destination/experience), status (planning/booked/completed), budget
```

**Step 2: Create update + delete route**

```typescript
// src/app/api/travel/[id]/route.ts
// PATCH: update title, category, status, budget
// DELETE: delete travel item
```

**Step 3: Commit**

```bash
git add src/app/api/travel/
git commit -m "feat: add travel/bucket list API routes"
```

---

### Task 6: Travel / Bucket List — Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/travel/page.tsx`

**Step 1: Build the travel dashboard page**

Full page with:
- Header: "Travel" + "Places to go, things to experience."
- Add form: title + category dropdown (trip/destination/experience) + optional budget
- Filter tabs: Planning | Booked | Completed
- Cards showing: title, category badge, budget (formatted as currency), status
- Hover actions: cycle status (planning → booked → completed), delete
- Category shown as colored badge (trip=blue, destination=amber, experience=green)

**Step 2: Verify page renders**

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/travel/"
git commit -m "feat: add travel dashboard page"
```

---

### Task 7: Creative Projects — API Routes

**Files:**
- Create: `src/app/api/creative/route.ts`
- Create: `src/app/api/creative/[id]/route.ts`

**Step 1: Create list + create route**

```typescript
// src/app/api/creative/route.ts
// GET: findMany with optional status filter (in_progress/completed/idea)
// POST: create with title, description, status
```

**Step 2: Create update + delete route**

```typescript
// src/app/api/creative/[id]/route.ts
// PATCH: update title, description, status, images
// DELETE: delete creative project
```

**Step 3: Commit**

```bash
git add src/app/api/creative/
git commit -m "feat: add creative projects API routes"
```

---

### Task 8: Creative Projects — Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/creative/page.tsx`

**Step 1: Build the creative projects dashboard page**

Full page with:
- Header: "Creative" + "Projects, ideas, and works in progress."
- Add form: title + optional description
- Filter tabs: In Progress | Ideas | Completed
- Project cards: title, description preview (truncated), status badge, created date
- Status badge colors: in_progress=vermillion, idea=amber, completed=green
- Hover actions: cycle status, delete
- Click to expand full description (inline toggle)

**Step 2: Verify page renders**

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/creative/"
git commit -m "feat: add creative projects dashboard page"
```

---

### Task 9: Reading / Media — API Routes

**Files:**
- Create: `src/app/api/reading/route.ts`
- Create: `src/app/api/reading/[id]/route.ts`

**Step 1: Create list + create route**

```typescript
// src/app/api/reading/route.ts
// GET: findMany with optional status filter (to_read/reading/completed) and type filter (book/article/paper/podcast)
// POST: create with title, type, status
```

**Step 2: Create update + delete route**

```typescript
// src/app/api/reading/[id]/route.ts
// PATCH: update title, type, status, rating (1-5), notes
// DELETE: delete reading item
```

**Step 3: Commit**

```bash
git add src/app/api/reading/
git commit -m "feat: add reading/media API routes"
```

---

### Task 10: Reading / Media — Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/reading/page.tsx`

**Step 1: Build the reading dashboard page**

Full page with:
- Header: "Reading" + "Books, articles, and media to consume."
- Add form: title + type dropdown (book/article/paper/podcast)
- Filter tabs: To Read | Reading | Completed
- Cards: title, type badge, rating stars (if completed), notes preview
- Type badge icons/colors: book=amber, article=blue, paper=green, podcast=purple
- Rating: clickable star display (1-5) that PATCHes on click
- Notes: expandable text area that auto-saves on blur
- Hover actions: cycle status, delete

**Step 2: Verify page renders**

**Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/reading/"
git commit -m "feat: add reading dashboard page"
```

---

### Task 11: Final Verification & Dashboard Brief Update

**Files:**
- Modify: `src/app/api/dashboard/brief/route.ts`

**Step 1: Update dashboard brief to include new module counts**

Add to the brief API response:
- `investments`: count of investments
- `contacts`: count of contacts
- `travelItems`: count of travel items with status breakdown
- `creativeProjects`: count of creative projects with status breakdown
- `readingItems`: count of reading items with status breakdown

**Step 2: Verify full build compiles**

Run: `npx next build --no-lint`

**Step 3: Verify all routes work**

Check route count matches expected (32 existing + 10 new = ~42 routes)

**Step 4: Commit**

```bash
git add src/app/api/dashboard/brief/route.ts
git commit -m "feat: update dashboard brief with phase 4 module counts"
```
