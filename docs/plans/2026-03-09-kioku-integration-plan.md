# Kioku Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the standalone Kioku knowledge graph into Me.io's `/dashboard/knowledge` as a full-page immersive experience with ink swirl transition, sumi-e garden visualization, conversational chat, and auto-extraction from Kemi conversations.

**Architecture:** Kioku becomes a self-contained section within Me.io's dashboard. It has its own dark theme (scoped via CSS variables), its own chat identity ("the brain"), and shares Me.io's PostgreSQL database (existing Node/Link/NodeRecall/Message/Journal tables). Kemi conversations auto-extract entities into the same graph in the background.

**Tech Stack:** Next.js 16, Prisma 7, Claude Sonnet 4.6 (extraction), d3-force (graph physics), Canvas 2D (sumi-e rendering), Web Speech API (voice input), Framer Motion (transitions)

**Source Reference:** Kioku standalone at `/Users/mac/Prod/Kioku/chat/`

---

## Task 1: Port Kioku Types and Slugify

**Files:**
- Modify: `src/lib/kioku/types.ts`
- Create: `src/lib/kioku/slugify.ts`

**Step 1: Update types.ts with Kioku's full type definitions**

Replace `src/lib/kioku/types.ts` with:

```typescript
export interface ExtractedNode {
  name: string;
  tags: string[];
  fields: Record<string, unknown>;
}

export interface ExtractedLink {
  source: string;
  target: string;
  rel: string;
}

export interface ExtractedUpdate {
  node: string;
  append: string;
}

export interface CuriosityEntry {
  observation: string;
  relevance: string;
}

export interface ExtractionResult {
  nodes: ExtractedNode[];
  links: ExtractedLink[];
  updates: ExtractedUpdate[];
  reply: string;
  follow_up: string;
  curiosity: CuriosityEntry[];
}

export interface ProcessResult {
  reply: string;
  follow_up: string;
  created: string[];
  updated: string[];
  source_type: string;
}

export interface IngestResult {
  source_type: string;
  text: string;
  metadata: Record<string, string>;
}

export interface KiokuNode {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  status: string;
  fields: Record<string, unknown>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryResult {
  content: string;
  similarity: number;
}

export interface Insight {
  kind: "unconnected_cluster" | "stale_thread" | "emerging_theme";
  description: string;
  relatedNodes: string[];
}
```

**Step 2: Create slugify.ts**

```typescript
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/lib/kioku/types.ts src/lib/kioku/slugify.ts
git commit -m "feat(kioku): port types and slugify from standalone Kioku"
```

---

## Task 2: Port Extraction Pipeline

**Files:**
- Create: `src/lib/kioku/extractor.ts` (rewrite)
- Create: `src/lib/kioku/pipeline.ts` (rewrite)
- Create: `src/lib/kioku/insights.ts`
- Modify: `src/lib/kioku/store.ts` (rewrite with bidirectional links)

**Step 1: Create extractor.ts**

Port from `/Users/mac/Prod/Kioku/chat/lib/extractor.ts`. This is the Claude extraction with Kioku's full system prompt personality. Key adaptations:
- Import Anthropic from `@anthropic-ai/sdk` (Me.io's existing package)
- Import `ExtractionResult` from `./types`
- Update model to `claude-sonnet-4-6`
- Keep the full EXTRACTION_SYSTEM_PROMPT exactly as-is from Kioku (the personality is core)

The extractor accepts `message`, `vaultContext`, and `history` — returns parsed `ExtractionResult`.

**Step 2: Rewrite store.ts with bidirectional links**

Port from Kioku's `pipeline.ts` store function. Key behavior:
- `upsertNode(name, tags, fields)` — upsert by slug
- `appendNote(name, text)` — append to existing node's notes
- `createBidirectionalLink(source, target, relation)` — creates both forward and reverse links
- `recordSurfacedNodes(extraction)` — upsert NodeRecall with surface count increment
- `journalLog(line)` — append to today's Journal entry
- All use Me.io's `prisma` import from `@/lib/prisma`

**Step 3: Create pipeline.ts**

Port from `/Users/mac/Prod/Kioku/chat/lib/pipeline.ts`. Key functions:
- `processText(message)` — full chat pipeline: save message → build context → extract → store → embed → return reply
- `processExtractOnly(text)` — extraction-only mode for Kemi background use (no reply generation, no message saving)
- `buildVaultContext()` — serialize all nodes into context string for Claude
- `buildHistory(limit)` — load last N messages as conversation turns
- `buildNudgeContext()` — find stale nodes via raw SQL query

Adaptations from Kioku:
- Import `prisma` from `@/lib/prisma` (not `./prisma`)
- Import `slugify` from `./slugify`
- Remove `embedNodesBatch` import (defer embedding to later task)
- Remove `ingest` import (separate task)
- Role naming: save as `"assistant"` not `"brain"`
- Use `todayJamaica()` from `./utils` for journal dates
- Raw SQL in `buildNudgeContext` uses table names from `@@map` directives: `"nodes"` for Node, `"node_recalls"` for NodeRecall

**Step 4: Create insights.ts**

Port from `/Users/mac/Prod/Kioku/chat/lib/insights.ts`. Three insight generators:
- `findUnconnectedClusters()` — nodes sharing tags but not linked
- `findStaleThreads(staleDays)` — nodes not updated in N days
- `findEmergingThemes(threshold)` — tags appearing on N+ nodes
- `generateInsights()` — runs all three in parallel, returns combined

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/lib/kioku/extractor.ts src/lib/kioku/pipeline.ts src/lib/kioku/store.ts src/lib/kioku/insights.ts
git commit -m "feat(kioku): port extraction pipeline, store, and insights from standalone Kioku"
```

---

## Task 3: Wire Kemi Auto-Extraction

**Files:**
- Modify: `src/lib/kemi/agent.ts` (~line 228, after the existing `remember()` call)

**Step 1: Add background extraction call**

After the existing `remember()` fire-and-forget block (around line 228-234), add:

```typescript
// Fire-and-forget knowledge graph extraction
if (userMessage.length >= 50) {
  import("@/lib/kioku/pipeline").then(({ processExtractOnly }) => {
    const text = `User: ${userMessage}\nAssistant: ${content}`;
    processExtractOnly(text).catch((err: unknown) =>
      console.error("[kemi] Failed to extract to knowledge graph:", err)
    );
  });
}
```

This runs the extraction pipeline in extract-only mode (no reply, no message saving) so Kemi conversations populate the knowledge graph without affecting Kemi's behavior.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/kemi/agent.ts
git commit -m "feat(kioku): wire Kemi conversations into knowledge graph extraction"
```

---

## Task 4: Port Kioku API Routes

**Files:**
- Modify: `src/app/api/kioku/nodes/route.ts` (enhance existing)
- Modify: `src/app/api/kioku/graph/route.ts` (enhance existing)
- Create: `src/app/api/kioku/chat/route.ts`
- Create: `src/app/api/kioku/ingest/route.ts`
- Create: `src/app/api/kioku/insights/route.ts`
- Create: `src/app/api/kioku/messages/route.ts`
- Create: `src/app/api/kioku/search/route.ts`
- Create: `src/app/api/kioku/search/semantic/route.ts`

**Note:** All routes use `requireAuth` from `@/lib/auth` for PIN authentication (matching Me.io's existing pattern). Use `find` via Bash for `[slug]` directory since glob doesn't match brackets.

**Step 1: Create chat route**

`/api/kioku/chat` — POST. Accepts `{ text: string }`, calls `processText()` from pipeline, returns `{ reply, follow_up, created, updated }`.

**Step 2: Create ingest route**

`/api/kioku/ingest` — POST. Accepts FormData with `file`, `source_type`, `context`, `url` fields. Calls `processIngest()`. For MVP, support text context only — image/PDF/audio ingestion added in Task 8.

**Step 3: Create insights route**

`/api/kioku/insights` — GET. Calls `generateInsights()`, returns `{ insights }`.

**Step 4: Create messages route**

`/api/kioku/messages` — GET. Accepts `?limit=50&offset=0`. Returns paginated Kioku chat messages with `{ messages, total }`.

**Step 5: Create search route**

`/api/kioku/search` — GET. Accepts `?q=`. Text search on node name and notes (case-insensitive contains). Returns `{ results: [{ name, slug, tags }] }`.

**Step 6: Create semantic search route**

`/api/kioku/search/semantic` — GET. Accepts `?q=&limit=10`. For MVP, fall back to text search. Vector similarity search added when embedding pipeline is wired.

**Step 7: Enhance existing nodes route**

Add slug-based detail endpoint. Create `src/app/api/kioku/nodes/[slug]/route.ts` (use Bash `mkdir -p` since glob can't match brackets). GET returns node with connections (both source and target links), fields, notes.

**Step 8: Enhance existing graph route**

Update to include `link_count` and `updated` timestamp per node. Support optional `?center=slug&depth=N` for subgraph queries.

**Step 9: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 10: Commit**

```bash
git add src/app/api/kioku/
git commit -m "feat(kioku): add chat, ingest, insights, messages, search API routes"
```

---

## Task 5: Port Sumi-E Rendering Engine

**Files:**
- Create: `src/lib/kioku/sumi.ts`
- Create: `src/lib/kioku/theme.ts`

**Step 1: Port sumi.ts**

Port from `/Users/mac/Prod/Kioku/chat/app/lib/sumi.ts`. This is the canvas rendering engine (~490 lines). Key functions:
- `drawSumiBackground(ctx, width, height, colors)` — ink wash background with atmospheric depth
- `drawSumiNode(ctx, x, y, radius, color, opacity, selected)` — brush-stroke node rendering with bezier curves
- `drawSumiEdge(ctx, x1, y1, x2, y2, color)` — variable-width edge lines
- `drawSumiLabel(ctx, x, y, text, color)` — text labels
- `seededRandom(seed)` — deterministic randomness for consistent brush strokes
- `getNodeColor(tags)` — maps node tags to colors (indigo/moss/rust/plum/teal/ochre)

Copy exactly as-is from Kioku. No adaptations needed — it's pure canvas rendering with no framework dependencies.

**Step 2: Create theme.ts**

Port Kioku's theme system. Define:
- `KIOKU_COLORS` — dark theme color palette (`bg: #1A1A1E`, `bgRaised: #222226`, `text: #E8E0D4`, `muted: #6B6B73`, `accent: #E04D2E`, `border: rgba(232,224,212,0.10)`)
- `NODE_COLORS` — per-tag color map (person→indigo, place→moss, concept→rust, event→plum, work→teal, memory→ochre)
- `buildKiokuCSSProperties()` — returns CSS custom property object for applying to DOM

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/lib/kioku/sumi.ts src/lib/kioku/theme.ts
git commit -m "feat(kioku): port sumi-e rendering engine and theme system"
```

---

## Task 6: Port Garden Component and useGarden Hook

**Files:**
- Create: `src/hooks/useGarden.ts`
- Create: `src/components/kioku/Garden.tsx`

**Dependencies:** Install `d3-force` first:
```bash
npm install d3-force && npm install -D @types/d3-force
```

**Step 1: Port useGarden hook**

Port from `/Users/mac/Prod/Kioku/chat/app/hooks/useGarden.ts`. This hook:
- Fetches graph data from `/api/kioku/graph`
- Runs d3-force simulation (forceLink, forceManyBody, forceCenter, forceCollide)
- Tracks node positions, handles resize
- Calculates recency glow (nodes updated recently glow brighter)
- Returns `{ nodes, edges, width, height, canvasRef, selectedNode, setSelectedNode, searchHighlight, setSearchHighlight }`

Adaptations:
- Use Me.io's fetch pattern (no separate auth needed, PIN cookie handled automatically)

**Step 2: Port Garden.tsx**

Port from `/Users/mac/Prod/Kioku/chat/app/components/Garden.tsx` (~220 lines). This component:
- Renders `<canvas>` element filling its container
- Uses `useGarden` hook for data and simulation
- Renders via sumi-e functions from `@/lib/kioku/sumi`
- Handles mouse/touch events: click (select node), hover (tooltip), drag (pan), wheel (zoom)
- Search input overlay (top-left) that highlights matching nodes
- Calls `onSelectNode(slug)` callback when a node is clicked

Adaptations:
- Import sumi functions from `@/lib/kioku/sumi`
- Import theme colors from `@/lib/kioku/theme`
- Use `"use client"` directive

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/hooks/useGarden.ts src/components/kioku/Garden.tsx package.json package-lock.json
git commit -m "feat(kioku): port Garden component with d3-force simulation and sumi-e rendering"
```

---

## Task 7: Port ChatPanel, NodeDetail, InsightCards, EntityFeed

**Files:**
- Create: `src/components/kioku/ChatPanel.tsx`
- Create: `src/components/kioku/NodeDetail.tsx`
- Create: `src/components/kioku/InsightCards.tsx`
- Create: `src/components/kioku/EntityFeed.tsx`

**Step 1: Port ChatPanel.tsx**

Port from `/Users/mac/Prod/Kioku/chat/app/components/ChatPanel.tsx` (~285 lines). Features:
- Message list with role-based styling (user right-aligned, brain left-aligned)
- Text input with Enter-to-send
- Voice input via Web Speech API (mic button)
- File/image upload buttons (trigger `/api/kioku/ingest`)
- EntityFeed inline after each brain message showing created/updated nodes
- Auto-scroll to latest message
- Loading state with animated dots

Adaptations:
- Use Kioku theme colors (dark background, warm beige text)
- Import `EntityFeed` from same directory
- Fetch from `/api/kioku/chat` (POST) and `/api/kioku/messages` (GET)
- Voice button reuses Web Speech API pattern from `src/lib/voice/speech-recognition.ts`
- Header text: `話 Chat` with Yuji Syuku font

**Step 2: Port NodeDetail.tsx**

Port from `/Users/mac/Prod/Kioku/chat/app/components/NodeDetail.tsx` (~360 lines). Features:
- Full-screen slide-up overlay (from bottom)
- Swipe-to-close (drag down >100px)
- Backdrop with decreasing opacity during drag
- Sections with Japanese labels:
  - Connections (繋がり) — bidirectional links with relation labels
  - Attributes (属性) — key-value pairs from `fields` JSON
  - Story (物語) — full notes text
  - Related (縁) — nodes found via `/api/kioku/search?q=nodeName`
- Close button (top-right X)
- Drag handle indicator (centered bar at top)

Adaptations:
- Fetch node data from `/api/kioku/nodes/[slug]`
- Use Framer Motion for slide-up animation (Me.io already has it)
- Kioku theme colors

**Step 3: Port InsightCards.tsx**

Port from `/Users/mac/Prod/Kioku/chat/app/components/InsightCards.tsx` (~120 lines). Features:
- Floating card positioned bottom-left of garden canvas
- Auto-rotates through insights every 8 seconds
- Three kinds with poetic labels:
  - `unconnected_cluster` → "scattered leaves"
  - `stale_thread` → "fading path"
  - `emerging_theme` → "first light"
- Fade transition between cards
- Tap/click to cycle manually

Adaptations:
- Fetch from `/api/kioku/insights`
- Kioku theme colors

**Step 4: Create EntityFeed.tsx**

Small component (~60 lines) showing created/updated node names inline in chat:
- Created nodes: underlined, accent color (`#E04D2E`)
- Updated nodes: muted gray
- Clickable — triggers `onSelectNode(name)` callback

**Step 5: Verify build**

Run: `npm run build`

**Step 6: Commit**

```bash
git add src/components/kioku/
git commit -m "feat(kioku): port ChatPanel, NodeDetail, InsightCards, EntityFeed components"
```

---

## Task 8: Create Ink Transition Component

**Files:**
- Create: `src/components/kioku/InkTransition.tsx`

**Step 1: Implement ink swirl animation**

Canvas-based overlay component (~150 lines):

- Props: `{ active: boolean, direction: "in" | "out", onComplete: () => void }`
- Renders `<canvas>` fixed over entire viewport (z-index 9999)
- Animation sequence (800ms total):
  - **Phase 1 (0-200ms):** Dark circle expands from center point. Uses `ctx.arc()` with rapidly increasing radius.
  - **Phase 2 (200-500ms):** Organic bloom — multiple overlapping circles with noise-perturbed centers and varying radii. Creates ink-in-water tendrils effect using 8-12 offset circles with `globalCompositeOperation: "source-over"`.
  - **Phase 3 (500-650ms):** Fill — radius exceeds viewport diagonal. Everything dark.
  - **Phase 4 (650-800ms):** Canvas fades opacity from 1 to 0 via `requestAnimationFrame`. Kioku page renders underneath.
- For `direction: "out"`: reverse the sequence (expand from edges to center reveal)
- Color: `#1A1A1E` (Kioku background)
- Respects `prefers-reduced-motion`: instant opacity transition (no canvas animation)
- Removes from DOM after `onComplete` fires

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/kioku/InkTransition.tsx
git commit -m "feat(kioku): create ink swirl page transition animation"
```

---

## Task 9: Create useKiokuTheme Hook

**Files:**
- Create: `src/hooks/useKiokuTheme.ts`

**Step 1: Implement theme hook**

Port from Kioku's `useTheme` but simplified (always dark in Me.io context):

- On mount: applies Kioku CSS custom properties to `document.documentElement`
- On unmount: removes them (restores Me.io's default theme)
- CSS variables set: `--kioku-bg`, `--kioku-bg-raised`, `--kioku-text`, `--kioku-muted`, `--kioku-accent`, `--kioku-border`, `--kioku-overlay`
- Also sets `data-theme="kioku"` on `<html>` for CSS selectors
- Returns `{ colors }` object for components that need values programmatically

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/hooks/useKiokuTheme.ts
git commit -m "feat(kioku): create scoped theme hook for knowledge page"
```

---

## Task 10: Rewrite Knowledge Page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/knowledge/page.tsx` (full rewrite)

**Step 1: Add Kioku fonts**

Add Google Fonts imports for Yuji Syuku and Zen Kaku Gothic New. Use `next/font/google` with `display: "swap"` and `variable` CSS class. Apply font variables only within the knowledge page container.

**Step 2: Rewrite knowledge page**

The page becomes the Kioku experience:

- Uses `useKiokuTheme()` to apply dark theme on mount
- Uses `InkTransition` for entry animation (plays on first mount)
- Two-tab layout: `庭 Garden` | `話 Chat`
- **Garden tab (default):**
  - `<Garden>` component fills the content area
  - `<InsightCards>` floating bottom-left
  - Search bar overlaid top-left (part of Garden component)
  - Click node → `<NodeDetail>` slides up
- **Chat tab:**
  - Desktop: split layout — `<Garden>` (60% left) + `<ChatPanel>` (40% right)
  - Mobile: `<ChatPanel>` full-screen with "← 庭" back button
- Tab bar at top: minimal, Yuji Syuku font, accent underline on active tab
- Container has `font-family` set to Zen Kaku Gothic New (body) with Yuji Syuku for headings
- Background color: `var(--kioku-bg)` applied to outermost div
- The dashboard sidebar remains visible but gets `opacity-80` treatment when Kioku theme is active

**Step 3: Handle sidebar theme blending**

In the knowledge page, dispatch a custom event or use a layout context to signal the sidebar should darken. Alternatively, add a CSS rule:
```css
[data-theme="kioku"] .dashboard-sidebar {
  background-color: #151518;
  border-color: rgba(232, 224, 212, 0.05);
}
```
Add this to Me.io's global CSS or a kioku-specific stylesheet.

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Test locally**

Run: `npm run dev`
- Navigate to `/dashboard/knowledge`
- Ink transition should play
- Garden should render (may be empty if no nodes yet)
- Chat tab should show input
- Type a message in chat → should get reply + see nodes created
- Click a node → NodeDetail should slide up

**Step 6: Commit**

```bash
git add src/app/(dashboard)/dashboard/knowledge/page.tsx
git commit -m "feat(kioku): rewrite knowledge page with Garden, Chat, and ink transition"
```

---

## Task 11: Add Kioku Theme CSS

**Files:**
- Modify: `src/app/globals.css` (or create `src/styles/kioku.css`)

**Step 1: Add Kioku-scoped styles**

Add CSS rules that only apply when `data-theme="kioku"` is set:

```css
/* Kioku theme overrides */
[data-theme="kioku"] {
  --kioku-bg: #1A1A1E;
  --kioku-bg-raised: #222226;
  --kioku-text: #E8E0D4;
  --kioku-muted: #6B6B73;
  --kioku-accent: #E04D2E;
  --kioku-border: rgba(232, 224, 212, 0.10);
  --kioku-overlay: rgba(26, 26, 30, 0.85);
}

/* Sidebar darkening when in Kioku */
[data-theme="kioku"] [data-sidebar] {
  background-color: #151518 !important;
  border-color: rgba(232, 224, 212, 0.05) !important;
}

[data-theme="kioku"] [data-sidebar] * {
  color: #E8E0D4 !important;
}

/* Kioku animations */
@keyframes sumi-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Kioku scrollbar */
[data-theme="kioku"] ::-webkit-scrollbar {
  width: 5px;
}
[data-theme="kioku"] ::-webkit-scrollbar-thumb {
  background: rgba(232, 224, 212, 0.15);
  border-radius: 3px;
}
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(kioku): add scoped CSS theme and animations"
```

---

## Task 12: Add File Ingestion Support

**Files:**
- Create: `src/lib/kioku/ingest.ts`

**Step 1: Create ingestion module**

Port from Kioku's ingest concept. MVP supports:
- `text` — pass-through (already handled by chat)
- `image` — send to Claude vision API for OCR/description
- `url` — fetch page content via simple HTML-to-text extraction
- `pdf` — extract text via `pdf-parse` package (install: `npm install pdf-parse`)

Each ingester returns `IngestResult` with `{ source_type, text, metadata }`.

```typescript
export async function ingest(
  sourceType: string,
  data: Buffer | string,
  options: Record<string, string> = {}
): Promise<IngestResult> {
  switch (sourceType) {
    case "image": return ingestImage(data as Buffer, options);
    case "url": return ingestUrl(data as string);
    case "pdf": return ingestPdf(data as Buffer, options);
    default: return { source_type: sourceType, text: String(data), metadata: {} };
  }
}
```

**Step 2: Update ingest API route**

Update `/api/kioku/ingest/route.ts` to call the real `ingest()` function.

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/lib/kioku/ingest.ts package.json package-lock.json
git commit -m "feat(kioku): add multi-modal ingestion (image, URL, PDF)"
```

---

## Task 13: Deploy and Test End-to-End

**Files:** None (deployment task)

**Step 1: Full build verification**

Run: `npm run build`
Expected: Clean build, no errors

**Step 2: Deploy to Vercel**

Run: `npx vercel --prod`

**Step 3: Test on production**

Navigate to `https://mikechen.xyz/dashboard/knowledge`:
1. Ink transition plays on entry
2. Garden renders (empty or with existing nodes)
3. Switch to Chat tab
4. Send a message: "I've been thinking about learning Rust for systems programming"
5. Kioku should reply conversationally and extract nodes (e.g., "Rust", "Systems Programming")
6. Switch back to Garden — new nodes should appear
7. Click a node — NodeDetail slides up with connections
8. Navigate away — reverse ink transition plays
9. Talk to Kemi in the slide-out panel about something — check that nodes appear in the garden after refresh

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(kioku): post-deploy fixes"
```

---

## Task Dependency Graph

```
Task 1 (types/slugify)
  └── Task 2 (pipeline/extractor/store/insights)
        ├── Task 3 (Kemi auto-extraction)
        ├── Task 4 (API routes)
        │     └── Task 7 (ChatPanel/NodeDetail/InsightCards)
        │           └── Task 10 (knowledge page rewrite)
        └── Task 12 (file ingestion)

Task 5 (sumi-e engine/theme)
  └── Task 6 (Garden + useGarden)
        └── Task 10 (knowledge page rewrite)

Task 8 (InkTransition)
  └── Task 10 (knowledge page rewrite)

Task 9 (useKiokuTheme)
  └── Task 10 (knowledge page rewrite)
        └── Task 11 (CSS theme)
              └── Task 13 (deploy + test)
```

**Parallel tracks:**
- Track A: Tasks 1 → 2 → 3/4 → 7
- Track B: Tasks 5 → 6
- Track C: Tasks 8, 9 (independent)
- Merge: Task 10 (needs A + B + C)
- Final: Tasks 11 → 12 → 13
