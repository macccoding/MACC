# Kioku Integration into Me.io — Design Document

**Date:** 2026-03-09
**Status:** Approved

## Overview

Port the standalone Kioku knowledge graph application into Me.io's dashboard as the `/dashboard/knowledge` section. Kioku becomes the unified knowledge layer fed by both its own conversational chat and Kemi's executive assistant conversations.

## Key Decisions

1. **Full page takeover** — The knowledge page switches to Kioku's dark sumi-e theme (`#1A1A1E`), completely distinct from Me.io's parchment/vermillion aesthetic
2. **Ink swirl transition** — Canvas-based ink bloom animation (~800ms) when entering/leaving the knowledge section
3. **Separate identities** — Kioku chat ("the brain", warm/curious/knowledge-focused) lives on the knowledge page. Kemi chat ("the assistant") stays in the slide-out panel. Different personalities, same graph.
4. **Both feed the graph** — Kemi conversations auto-extract entities in the background (fire-and-forget). Kioku conversations extract via its full conversational pipeline.
5. **Morning letter deferred** — Focus on garden + chat + extraction pipeline. Daily digest and audio recap come later.

## Page Experience

### Ink Transition Animation

Triggered on navigation to/from `/dashboard/knowledge`:

1. **Ink drop** (0–200ms) — Dark circle expands from viewport center
2. **Bloom** (200–500ms) — Organic tendrils spread outward (perlin noise edges, not clean circle)
3. **Fill** (500–650ms) — Ink saturates the viewport
4. **Reveal** (650–800ms) — Fades to `#1A1A1E`, garden canvas appears with cascade delay

Canvas overlay (`position: fixed`, high z-index). Reverse animation when navigating away. Respects `prefers-reduced-motion`.

### Views

**Garden (default):**
- Full canvas with sumi-e brush-stroke nodes, ink wash background
- D3-force directed layout
- Search bar overlaid top-left, insight cards floating bottom-left
- Click node → NodeDetail slides up from bottom
- Touch + mouse: drag, zoom/pan, hover tooltips

**Chat:**
- Desktop: split layout — garden 60% left, chat panel 40% right
- Mobile: full-screen chat with "Back to Garden" button
- Multi-modal input: text, voice (Web Speech API), image, file
- Entity feed shows created/updated nodes inline after each message

Toggle via minimal tab bar: `庭 Garden` | `話 Chat`

### Theme (scoped to knowledge page)

- **Background:** `#1A1A1E` (charcoal)
- **Surfaces:** `#222226`
- **Text:** `#E8E0D4` (warm beige)
- **Muted:** `#6B6B73`
- **Accent:** `#E04D2E` (vermillion — shared with Me.io)
- **Fonts:** Yuji Syuku (brush headings), Zen Kaku Gothic New (body) — loaded dynamically
- **Node colors:** Indigo (person), Moss (place), Rust (concept), Plum (event), Teal (work), Ochre (memory)
- **CSS variables** applied via `useKiokuTheme` hook, scoped to knowledge page

## Database Schema

### Modified Tables

**NodeRecall** — Add unique constraint on `nodeId` (1:1 with Node)

**Link** — Add unique constraint on `(sourceNodeId, targetNodeId, relation)` for upsert

### New Table

```prisma
model Digest {
  id        String   @id @default(cuid())
  date      DateTime @unique @db.Date
  bullets   Json
  highlight String?
  question  String?
  createdAt DateTime @default(now())
}
```

### Unchanged

- `Node` (already has fields JSON, tags[], embedding vector, status)
- `Message` (already has role, content, followUp, createdNodes[], updatedNodes[])
- `memory_entries` (Kemi's vector memory, untouched)

### Conventions

- Embeddings: 1536-dim (OpenAI text-embedding-3-small), not Kioku's 512-dim
- Role naming: `"user" | "assistant"` (Kioku's `"brain"` mapped to `"assistant"`)
- Links: Bidirectional (every link creates a reverse link)

## Extraction Pipeline

### Kioku Chat Flow

```
User message
  → buildVaultContext() — snapshot of all nodes + tags + links
  → buildHistory() — last 20 messages
  → buildNudgeContext() — 5 stale/forgotten nodes
  → Claude Sonnet 4.6 extraction (full system prompt + personality)
  → Parse JSON: { nodes[], links[], updates[], reply, follow_up }
  → Store: upsert nodes, create bidirectional links, append notes
  → Update NodeRecall surface counts
  → Embed nodes async (best-effort)
  → Return { reply, followUp, created[], updated[] }
```

### Kemi Background Extraction

In `agent.ts`, after existing `remember()` call:
- Fire-and-forget `extractAndStore(conversationText)` for messages >= 50 chars
- Uses same pipeline but extraction-only mode (no reply generated)
- Kemi's personality unaffected

### Extraction Model

Claude Sonnet 4.6 with Kioku's full system prompt (warm, curious personality for chat; neutral for background extraction).

## Component Architecture

### New Components (`src/components/kioku/`)

| Component | Lines (est.) | Purpose |
|-----------|-------------|---------|
| `Garden.tsx` | ~220 | Canvas graph with sumi-e rendering, force layout |
| `ChatPanel.tsx` | ~285 | Conversational interface, multi-modal input, entity feed |
| `NodeDetail.tsx` | ~360 | Slide-up overlay with connections, attributes, story, related |
| `InsightCards.tsx` | ~120 | Floating auto-rotating insight cards on garden |
| `InkTransition.tsx` | ~150 | Ink swirl page transition animation |
| `EntityFeed.tsx` | ~60 | Inline display of created/updated nodes in chat |

### Library (`src/lib/kioku/`)

| File | Purpose |
|------|---------|
| `pipeline.ts` | Extraction orchestrator (processText, processIngest) |
| `extractor.ts` | Claude system prompt + JSON parsing |
| `store.ts` | Enhanced: bidirectional links, vault context builder |
| `recall.ts` | Text + semantic search |
| `sumi.ts` | Canvas rendering engine (brush strokes, ink wash, atmosphere) |
| `types.ts` | ExtractionResult, KiokuNode, etc. |

### Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useGarden.ts` | D3-force simulation, node positioning, recency glow |
| `useKiokuTheme.ts` | Applies scoped CSS variables for sumi-e theme |

### Page

`src/app/(dashboard)/dashboard/knowledge/page.tsx` — Fully rewritten. Replaces current list/graph MVP with Kioku experience.

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/kioku/chat` | POST | Message → extraction → reply + created/updated nodes |
| `/api/kioku/ingest` | POST | Image/PDF/audio/URL → extraction → entities |
| `/api/kioku/graph` | GET | Full graph or subgraph (`?center=slug&depth=N`) |
| `/api/kioku/nodes` | GET | List/search nodes |
| `/api/kioku/nodes/[slug]` | GET | Node detail + connections + related |
| `/api/kioku/search` | GET | Text search |
| `/api/kioku/search/semantic` | GET | Vector similarity search |
| `/api/kioku/insights` | GET | AI-generated insight cards |
| `/api/kioku/messages` | GET | Paginated Kioku chat history |

## Dependencies

- `d3-force` — Graph physics simulation (~15KB gzipped)
- `pdf-parse` — PDF text extraction for file ingestion

## Out of Scope (Deferred)

- Morning letter / daily digest UI
- Audio recap generation (TTS)
- Export features (narrative markdown, subgraph JSON)
- Python sidecar (all extraction runs in Node via Claude)
- Obsidian vault integration
