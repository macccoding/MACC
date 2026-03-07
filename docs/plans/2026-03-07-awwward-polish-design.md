# Awwward Polish — Design Document

> **Date:** March 7, 2026
> **Project:** mikechen.xyz public site visual overhaul
> **Goal:** Elevate from strong wireframe to Awwward-level polish

---

## Problem

The public site has a strong concept (sumi-e scroll story) but execution gaps:
- Images sit as hard rectangles on parchment — no edge blending
- Parchment → dark transitions are flat CSS gradients
- Huge dead space between content (100-125vh of empty parchment)
- Menu button invisible on light backgrounds
- Missing atmospheric detail between sections
- Dark section images look framed, not immersive

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WebGL library | OGL (~24KB gzip) | Minimal, shader-focused, no 3D overhead |
| Image treatment | Remove backgrounds + ink-bleed SVG masks | Art composites directly on site parchment |
| Parchment texture | Real seamless texture image | SVG noise lacks tactile warmth |
| Transition effect | GLSL Simplex noise ink spill | Scroll-driven, reversible, organic |
| Atmospheric fill | OGL GPU particle system | Fills dead space without being distracting |
| Image animations | Selective — koi, wolf, submerged, river, spiral, enso | Static where stillness serves the moment |
| Scroll pacing | Tighten spans ~25-30% + atmosphere | Faster flow, no barren zones |
| Execution strategy | One-shot implementation | Reduce friction/disjointedness |

---

## Architecture

### Single Shared OGL Canvas

One fullscreen `<canvas>` managed by OGL, layered behind HTML content (z-index 0). All shader effects render here — ink wash, particles, ink spill transition — coordinated by scroll position fed as uniforms.

```
┌─────────────────────────────────────┐
│  HTML Content (z-10+)               │
│  - Text, images, Framer Motion      │
├─────────────────────────────────────┤
│  OGL Canvas (z-0, fixed)            │
│  - Ink wash background shader       │
│  - Ambient particles                │
│  - Ink spill transition shader      │
│  - Image-local effects (wolf, koi)  │
├─────────────────────────────────────┤
│  Body background + parchment texture│
└─────────────────────────────────────┘
```

### Scroll Integration

Framer Motion `useScroll` feeds normalized scroll position into OGL via a React context (`ScrollGLContext`). OGL reads `uScrollY` (0–1 global) and section-specific progress uniforms each frame.

### Fallback

If WebGL2 unavailable: keep current Canvas 2D ink wash, use CSS gradient transitions, skip particles. Graceful degradation via `canvas.getContext('webgl2')` check.

---

## Workstream Details

### 1. Parchment Texture

Replace `body::after` SVG noise overlay with a real seamless parchment texture.
- Tile as `background-image` on body, opacity ~0.15-0.25
- Warm fibers, slight discoloration, handmade paper feel
- Generate via AI or source a royalty-free seamless washi texture
- The OGL ink wash blobs render on top as atmospheric depth

### 2. Image Background Removal

All ~20 AI-generated sumi-e images have baked parchment/dark backgrounds. Process to transparent:
- **Parchment images** (hero-wanderer, mandeville, forking-paths, the-weight, enso-moment, winding-river, divine-brush, spiral-seasons, wolf-running, text images, footer-enso, floating objects): Remove warm background
- **Dark images** (submerged, koi): Remove dark background
- Tool: `sharp` script or manual batch processing
- After removal: art composites naturally onto site parchment via alpha, `mix-blend-multiply` becomes optional enhancement rather than requirement

Fix floating object layout (Act 1): Replace absolute positioning with CSS grid that guarantees no overlap while keeping organic scattered feel via slight rotations/offsets.

### 3. Ink-Bleed Edge Masks

For images with defined edges post-background-removal, apply SVG filter masks:

```svg
<filter id="ink-bleed">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="[per-image]" />
  <feDisplacementMap in="SourceGraphic" scale="20" />
</filter>
```

Applied via CSS `filter: url(#ink-bleed)` or `mask-image` referencing the filter. Each image gets a unique seed for variety. Combined with soft radial gradient mask at edges.

### 4. OGL Ink Wash Background

Replace Canvas 2D `InkWashBackground` with GPU fragment shader:
- Same visual concept: warm ink blobs drifting organically
- Proper Gaussian falloff (smoother than Canvas radial gradients)
- Scroll-reactive: blobs shift with scroll velocity for parallax depth
- Uniform: `uTime`, `uScrollVelocity`
- ~15-25 metaballs blended in shader space

### 5. Ink Spill Transition

GLSL fragment shader using layered Simplex noise:
- Uniform `uProgress` (0.0 = parchment, 1.0 = ink-deep), driven by scroll
- **Phase 1** (0.0–0.3): Tendrils seep from edges/bottom
- **Phase 2** (0.3–0.7): Rapid flood, irregular noise coastlines
- **Phase 3** (0.7–1.0): Last pockets dissolve
- Two noise octaves: large slow shapes + fine grain detail
- Soft feathered edge (20-30px) at ink/parchment boundary
- Color transitions through `--ink-dark` → `--ink-deep` with warm undertones
- Scroll-reversible: scroll up and ink recedes
- Return transition (dark→parchment) uses different noise seed
- Transition zone: ~70vh scroll distance (up from 50vh)
- Submerged figure fades in during last 30% of ink flood

Replaces both `<div style="linear-gradient(...)">` transition elements.

### 6. Atmospheric Particles

OGL GPU particle system on the shared canvas:

**Parchment sections:**
- 40-60 tiny ink motes (1-3px)
- Opacity 0.03-0.08, very faint
- Drift slowly upward and laterally (dust in sunbeam)
- Scroll velocity adds wind push

**Dark sections:**
- 30-40 golden/warm particles (embers, bioluminescence)
- Opacity 0.05-0.12 (slightly brighter on dark bg)
- Drift upward slowly
- Ties to "ember in your chest" narrative

Particles visibility-culled outside viewport. Capped count.

### 7. Image Animations

Selective — only where motion serves the narrative:

| Image | Animation | Method |
|-------|-----------|--------|
| Hero wanderer | Faint mist/fog drifting across mountains | OGL particles clipped to image region |
| Koi fish | Gentle sway as if swimming | CSS keyframe transform (subtle oscillation) |
| Wolf running | Trailing particles/bloom behind wolf on scroll enter | OGL particle emitter triggered by viewport |
| Submerged figure | Rising bubbles | OGL particle emitter at image position |
| Winding river | Subtle water shimmer | OGL distortion shader on image texture |
| Spiral seasons | Slow rotation (~360° per 60s) | CSS keyframe rotation |
| Enso moment | Golden glow pulses at gap | CSS radial-gradient animation |

**Static (intentionally):** Mandeville, forking paths, the weight, divine brush, all text images.

### 8. UI Polish

**Menu button:** IntersectionObserver detects parchment vs dark section. Dark ink lines on parchment, light parchment lines on dark. 300ms crossfade transition. Restyle as minimal ink mark rather than traditional hamburger.

**Scroll progress indicator:** Thin vermillion line (2px) on left viewport edge, grows top-to-bottom with scroll. Opacity 0.3 idle, 0.6 active.

**Footer:**
- Seigaiha wave opacity 3% → 8%
- Enso image background removed
- Faint vermillion radial glow behind enso
- Social link hover: brush-stroke underline draw-on

**ScrollTextReveal:**
- Base word opacity 0.08 → 0.15 (ghost preview)
- Remove `will-change-[opacity,transform]` from Word spans (hurts perf on 200+ elements)

**Scroll spans tightened ~25-30%:**
- 2.2 → 1.6, 2.0 → 1.5, 1.8 → 1.4, 2.5 → 1.8, 1.3 → 1.0, 1.5 → 1.2, 1.2 → 1.0

**BrushDividers:** Add 2-3 between acts as visual rhythm connectors. Component exists, currently unused on main page.

**Loading screen:** Add brief OGL ink-splash particles from ensō brush endpoint before fade.

---

## What Gets Deleted

- `InkWashBackground.tsx` (Canvas 2D) — replaced by OGL shader
- Both CSS gradient transition `<div>`s in page.tsx — replaced by ink spill shader
- `body::after` SVG noise overlay in globals.css — replaced by real texture
- `will-change-[opacity,transform]` on ScrollTextReveal Word spans

## What Stays Untouched

- Framer Motion scroll text reveal (tuned, not replaced)
- Framer Motion parallax on StoryImage
- InkCursor (Canvas 2D, separate concern, works fine)
- All dashboard code, API routes, everything non-public
- LoadingScreen (small enhancement only)

---

## File Plan

### New Files
- `src/components/gl/GLCanvas.tsx` — Shared OGL canvas + React context
- `src/components/gl/shaders/ink-wash.frag` — Ink wash background shader
- `src/components/gl/shaders/ink-wash.vert` — Vertex shader (passthrough)
- `src/components/gl/shaders/ink-spill.frag` — Ink spill transition shader
- `src/components/gl/shaders/noise.glsl` — Shared Simplex noise functions
- `src/components/gl/InkSpillTransition.tsx` — Scroll-driven transition component
- `src/components/gl/AtmosphericParticles.tsx` — Ambient particle system
- `src/components/gl/ImageEffects.tsx` — Per-image OGL effects (wolf particles, bubbles, shimmer)
- `public/textures/parchment-seamless.jpg` — Real paper texture
- `scripts/remove-backgrounds.ts` — Image processing script

### Modified Files
- `src/app/(public)/page.tsx` — New layout, tightened spans, BrushDividers, animation wrappers
- `src/app/(public)/layout.tsx` — GLCanvas replaces InkWashBackground
- `src/app/globals.css` — Real texture, remove SVG noise, remove will-change
- `src/components/ink/ScrollTextReveal.tsx` — Base opacity bump, remove will-change
- `src/components/ink/StoryImage.tsx` — Ink-bleed mask support, animation props
- `src/components/ui/MenuButton.tsx` — Adaptive color, sumi-e restyle
- `src/components/ui/Footer.tsx` — Opacity boost, glow, hover effects
- `src/components/ink/WavePattern.tsx` — Opacity adjustment
- `src/components/ink/LoadingScreen.tsx` — Ink splash particles on exit
- `package.json` — Add `ogl` dependency

### Deleted Files
- `src/components/ink/InkWashBackground.tsx` — Replaced by OGL

---

*One-shot implementation — all workstreams executed together for cohesion.*
