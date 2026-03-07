# Phase 1: Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the Next.js project, implement the sumi-e design system, build the public landing page scroll experience, hidden dashboard entrance with PIN auth, and basic dashboard layout.

**Architecture:** Single Next.js 16 monolith with Supabase PostgreSQL. Public site uses static generation with Canvas/WebGL ink effects. Dashboard is SSR behind Supabase Auth. Route groups `(public)` and `(dashboard)` separate the two faces. Tailwind v4 with custom sumi-e design tokens.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Supabase (DB + Auth + WebAuthn), Framer Motion, Canvas 2D / WebGL (ink effects), Howler.js (sound), Prisma 7.

**Reference:** Design doc at `docs/plans/2026-03-07-mikechen-xyz-design.md`

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts` (or `postcss.config.mjs` for Tailwind v4)
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/mac/prod/me.io
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

When prompted, accept defaults. If directory is non-empty, it will ask — say yes.

Expected: Next.js 16 project scaffolded with Tailwind v4, App Router, src/ directory.

**Step 2: Verify it runs**

Run: `cd /Users/mac/prod/me.io && npm run dev`

Expected: Dev server starts at localhost:3000, default Next.js page renders.

**Step 3: Clean up defaults**

Remove all default content from `src/app/page.tsx` — replace with a minimal placeholder:
```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-[#1A1814] text-[#F5EDE0] flex items-center justify-center">
      <h1 className="text-4xl font-serif">mikechen.xyz</h1>
    </main>
  );
}
```

Remove default styles from `src/app/globals.css` except the Tailwind imports.

**Step 4: Commit**

```bash
git add -A
git commit -m "scaffold: initialize Next.js 16 project with Tailwind v4"
```

---

## Task 2: Install Core Dependencies

**Step 1: Install production dependencies**

Run:
```bash
cd /Users/mac/prod/me.io
npm install framer-motion @supabase/supabase-js @supabase/ssr howler @rive-app/react-canvas prisma
```

**Step 2: Install dev dependencies**

Run:
```bash
npm install -D @types/howler
```

**Step 3: Initialize Prisma**

Run:
```bash
npx prisma init --datasource-provider postgresql
```

Expected: Creates `prisma/schema.prisma` and `.env` with `DATABASE_URL` placeholder.

**Step 4: Add .env to .gitignore**

Verify `.gitignore` includes `.env` and `.env.local`. Add if missing.

**Step 5: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma .gitignore
git commit -m "deps: install core dependencies (Framer Motion, Supabase, Prisma, Howler, Rive)"
```

---

## Task 3: Sumi-e Design System — Tailwind Config & CSS Tokens

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/styles/sumi-e/tokens.css`
- Modify: Tailwind config (if v4, `globals.css` `@theme` block)

**Step 1: Create design tokens**

Create `src/styles/sumi-e/tokens.css`:
```css
:root {
  /* Sumi-e Color Palette */
  --ink-black: #1A1814;
  --ink-dark: #2A2520;
  --ink-mid: #3D3630;
  --parchment: #F5EDE0;
  --parchment-muted: #B8A99A;
  --parchment-dim: #8A7E72;
  --vermillion: #D03A2C;
  --vermillion-glow: #E8503F;
  --vermillion-dark: #A12E23;
  --ink-wash: rgba(26, 24, 20, 0.6);
  --ink-wash-light: rgba(26, 24, 20, 0.3);
  --gold-seal: #C9A84C;
  --gold-seal-glow: #DFC068;
  --sumi-gray: #6B635A;
  --sumi-gray-light: #8A8278;

  /* Typography Scale (fluid) */
  --text-hero: clamp(3rem, 12vw, 10rem);
  --text-display: clamp(2.5rem, 8vw, 7rem);
  --text-heading: clamp(2rem, 5vw, 4rem);
  --text-subheading: clamp(1.25rem, 3vw, 2rem);
  --text-body: clamp(1rem, 1.2vw, 1.25rem);
  --text-small: clamp(0.8rem, 1vw, 0.9rem);

  /* Spacing */
  --space-section: clamp(4rem, 10vw, 10rem);
  --space-element: clamp(2rem, 4vw, 4rem);
  --space-card: clamp(1rem, 2vw, 2rem);

  /* Transitions */
  --ease-ink: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-slow: 800ms;
  --duration-medium: 400ms;
  --duration-fast: 200ms;
}
```

**Step 2: Update globals.css with Tailwind v4 theme**

```css
@import "./sumi-e/tokens.css" layer(base);
@import "tailwindcss";

@theme {
  --color-ink-black: #1A1814;
  --color-ink-dark: #2A2520;
  --color-ink-mid: #3D3630;
  --color-parchment: #F5EDE0;
  --color-parchment-muted: #B8A99A;
  --color-parchment-dim: #8A7E72;
  --color-vermillion: #D03A2C;
  --color-vermillion-glow: #E8503F;
  --color-vermillion-dark: #A12E23;
  --color-gold-seal: #C9A84C;
  --color-gold-seal-glow: #DFC068;
  --color-sumi-gray: #6B635A;
  --color-sumi-gray-light: #8A8278;

  --font-serif: "Noto Serif", "Georgia", serif;
  --font-mono: "IBM Plex Mono", "Menlo", monospace;
  --font-brush: "BrushDisplay", serif; /* Custom brush font - placeholder */
}

/* Base styles */
body {
  background-color: var(--ink-black);
  color: var(--parchment);
  font-family: var(--font-serif);
}

/* Utility classes */
.ink-wash-overlay {
  background: var(--ink-wash);
  backdrop-filter: blur(12px);
}

.vermillion-glow {
  box-shadow: 0 0 20px rgba(208, 58, 44, 0.3);
}

.brush-stroke-underline {
  background-image: url("data:image/svg+xml,..."); /* SVG brush stroke */
  background-repeat: no-repeat;
  background-position: bottom center;
  background-size: 100% 4px;
}
```

**Step 3: Set up Google Fonts in root layout**

Update `src/app/layout.tsx`:
```tsx
import { Noto_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "Mike Chen",
  description: "Build things. Taste everything. Design the rest.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSerif.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-ink-black text-parchment font-serif antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 4: Verify design tokens work**

Update `src/app/page.tsx` to use the new tokens:
```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-ink-black text-parchment flex flex-col items-center justify-center gap-4">
      <h1 className="text-vermillion" style={{ fontSize: "var(--text-hero)" }}>
        MC
      </h1>
      <p className="text-parchment-muted font-mono text-sm tracking-widest uppercase">
        mikechen.xyz
      </p>
    </main>
  );
}
```

Run dev server, verify colors render correctly.

**Step 5: Commit**

```bash
git add src/styles/ src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "design: implement sumi-e design system tokens and typography"
```

---

## Task 4: Washi Paper Grain Texture Overlay

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add grain texture overlay to body**

Add to `globals.css` after the base styles:
```css
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  mix-blend-mode: overlay;
}
```

**Step 2: Verify the grain overlay is visible but subtle**

Run dev server, check that the background has a warm paper-like grain texture.

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "design: add washi paper grain texture overlay"
```

---

## Task 5: Custom Ink Brush Cursor

**Files:**
- Create: `src/components/ink/InkCursor.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Create the InkCursor component**

Create `src/components/ink/InkCursor.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface InkDrop {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vy: number;
  life: number;
}

export function InkCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dropsRef = useRef<InkDrop[]>([]);
  const frameRef = useRef<number>(0);
  const lastDropRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Skip on mobile/touch devices
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Spawn ink drops at intervals
      const now = Date.now();
      if (now - lastDropRef.current > 80) {
        lastDropRef.current = now;
        dropsRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 4,
          y: e.clientY + 8,
          size: Math.random() * 2.5 + 1,
          opacity: Math.random() * 0.4 + 0.2,
          vy: Math.random() * 0.8 + 0.3,
          life: 1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw cursor dot
      const { x, y } = mouseRef.current;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 237, 224, 0.8)";
      ctx.fill();

      // Update and draw drops
      const drops = dropsRef.current;
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        drop.y += drop.vy;
        drop.life -= 0.008;
        drop.size *= 0.998;

        if (drop.life <= 0) {
          drops.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26, 24, 20, ${drop.opacity * drop.life})`;
        ctx.fill();
      }

      // Cap drops array
      if (drops.length > 50) {
        drops.splice(0, drops.length - 50);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9998] pointer-events-none"
      aria-hidden="true"
    />
  );
}
```

**Step 2: Hide default cursor and add InkCursor to layout**

Add to `globals.css`:
```css
@media (pointer: fine) {
  * {
    cursor: none !important;
  }
}
```

Update `src/app/layout.tsx` to include `<InkCursor />` inside `<body>`:
```tsx
import { InkCursor } from "@/components/ink/InkCursor";
// ... existing imports

// Inside body:
<body className="bg-ink-black text-parchment font-serif antialiased">
  <InkCursor />
  {children}
</body>
```

**Step 3: Verify cursor works**

Run dev server. Move mouse — should see custom dot cursor with ink drops dripping down and fading.

**Step 4: Commit**

```bash
git add src/components/ink/InkCursor.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: custom ink brush cursor with dripping ink trail"
```

---

## Task 6: Animated Ink Wash Background

**Files:**
- Create: `src/components/ink/InkWashBackground.tsx`

**Step 1: Create the ink wash canvas background**

Create `src/components/ink/InkWashBackground.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";

interface InkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  phase: number;
  speed: number;
}

export function InkWashBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<InkParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    const count = Math.min(Math.floor(window.innerWidth / 30), 40);
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      radius: Math.random() * 120 + 60,
      opacity: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.002 + 0.001,
    }));

    let time = 0;

    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        // Gentle drifting motion
        p.x += p.vx + Math.sin(time * p.speed + p.phase) * 0.2;
        p.y += p.vy + Math.cos(time * p.speed * 0.7 + p.phase) * 0.15;

        // Wrap around edges
        if (p.x < -p.radius) p.x = canvas.width + p.radius;
        if (p.x > canvas.width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = canvas.height + p.radius;
        if (p.y > canvas.height + p.radius) p.y = -p.radius;

        // Draw ink wash blob
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.radius
        );
        const dynamicOpacity = p.opacity * (0.7 + 0.3 * Math.sin(time * p.speed + p.phase));
        gradient.addColorStop(0, `rgba(42, 37, 32, ${dynamicOpacity})`);
        gradient.addColorStop(0.5, `rgba(42, 37, 32, ${dynamicOpacity * 0.5})`);
        gradient.addColorStop(1, "rgba(42, 37, 32, 0)");

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
```

**Step 2: Add to the home page for testing**

Update `src/app/page.tsx`:
```tsx
import { InkWashBackground } from "@/components/ink/InkWashBackground";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center gap-4">
      <InkWashBackground />
      <h1 className="relative z-10 text-vermillion" style={{ fontSize: "var(--text-hero)" }}>
        MC
      </h1>
      <p className="relative z-10 text-parchment-muted font-mono text-sm tracking-widest uppercase">
        mikechen.xyz
      </p>
    </main>
  );
}
```

**Step 3: Verify animation**

Run dev server. Should see subtle, slowly drifting ink wash blobs behind the text. Movement should feel organic, like ink bleeding into water.

**Step 4: Commit**

```bash
git add src/components/ink/InkWashBackground.tsx src/app/page.tsx
git commit -m "feat: animated ink wash background canvas"
```

---

## Task 7: Loading Screen — Brush Stroke Name Draw

**Files:**
- Create: `src/components/ink/LoadingScreen.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create the loading screen component**

Create `src/components/ink/LoadingScreen.tsx`:
```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const STROKE_DURATION = 0.6;
const STAGGER_DELAY = 0.15;
const HOLD_DURATION = 800; // ms to hold after animation completes

// SVG paths for "MIKE CHEN" — each letter is a brush-stroke path
// These are simplified placeholder paths — replace with AI-generated brush letterforms
const LETTERS = [
  { char: "M", path: "M10,80 L30,10 L50,50 L70,10 L90,80", width: 100 },
  { char: "I", path: "M50,10 L50,80", width: 60 },
  { char: "K", path: "M20,10 L20,80 M20,45 L60,10 M20,45 L60,80", width: 70 },
  { char: "E", path: "M20,10 L60,10 M20,10 L20,80 M20,45 L50,45 M20,80 L60,80", width: 70 },
  { char: " ", path: "", width: 30 },
  { char: "C", path: "M60,10 Q10,10 10,45 Q10,80 60,80", width: 70 },
  { char: "H", path: "M15,10 L15,80 M15,45 L55,45 M55,10 L55,80", width: 70 },
  { char: "E", path: "M20,10 L60,10 M20,10 L20,80 M20,45 L50,45 M20,80 L60,80", width: 70 },
  { char: "N", path: "M15,80 L15,10 L55,80 L55,10", width: 70 },
];

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const totalLetters = LETTERS.filter((l) => l.char !== " ").length;
  const animDuration = (totalLetters * STAGGER_DELAY + STROKE_DURATION) * 1000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, animDuration + HOLD_DURATION);
    return () => clearTimeout(timer);
  }, [animDuration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10000] bg-ink-black flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg
            viewBox="0 0 640 100"
            className="w-[80vw] max-w-[640px] h-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {(() => {
              let xOffset = 0;
              let letterIndex = 0;
              return LETTERS.map((letter, i) => {
                const currentX = xOffset;
                xOffset += letter.width;
                if (letter.char === " ") return null;
                const idx = letterIndex++;
                return (
                  <motion.path
                    key={i}
                    d={letter.path}
                    transform={`translate(${currentX}, 0)`}
                    stroke="#D03A2C"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: 1,
                      stroke: ["#D03A2C", "#F5EDE0"],
                    }}
                    transition={{
                      pathLength: {
                        duration: STROKE_DURATION,
                        delay: idx * STAGGER_DELAY,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      opacity: {
                        duration: 0.1,
                        delay: idx * STAGGER_DELAY,
                      },
                      stroke: {
                        duration: 0.4,
                        delay: idx * STAGGER_DELAY + STROKE_DURATION,
                      },
                    }}
                  />
                );
              });
            })()}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Add LoadingScreen to root layout**

Update `src/app/layout.tsx` — add `<LoadingScreen />` before `{children}`:
```tsx
import { LoadingScreen } from "@/components/ink/LoadingScreen";

// Inside body:
<body className="bg-ink-black text-parchment font-serif antialiased">
  <LoadingScreen />
  <InkCursor />
  {children}
</body>
```

**Step 3: Verify loading screen**

Run dev server. On page load, should see "MIKE CHEN" drawing stroke-by-stroke in vermillion, fading to parchment, then the screen fades out revealing the site.

Note: The SVG paths above are placeholders. In Phase 5, we'll replace these with AI-generated brush calligraphy letterforms.

**Step 4: Commit**

```bash
git add src/components/ink/LoadingScreen.tsx src/app/layout.tsx
git commit -m "feat: loading screen with brush stroke name draw animation"
```

---

## Task 8: Route Group Structure

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/projects/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Remove: `src/app/page.tsx` (move to `(public)`)

**Step 1: Create public route group layout**

Create `src/app/(public)/layout.tsx`:
```tsx
import { InkWashBackground } from "@/components/ink/InkWashBackground";
import { InkSeal } from "@/components/ink/InkSeal";
import { MenuButton } from "@/components/ui/MenuButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InkWashBackground />
      <MenuButton />
      <InkSeal />
      {children}
    </>
  );
}
```

Note: `InkSeal` and `MenuButton` will be built in Tasks 9 and 10.

**Step 2: Move home page to public route group**

Move `src/app/page.tsx` content to `src/app/(public)/page.tsx`. Delete the old `src/app/page.tsx`, or replace it with a redirect:

`src/app/(public)/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="relative z-10 text-vermillion" style={{ fontSize: "var(--text-hero)" }}>
        MC
      </h1>
      <p className="relative z-10 text-parchment-muted font-mono text-sm tracking-widest uppercase">
        mikechen.xyz
      </p>
    </main>
  );
}
```

**Step 3: Create projects page placeholder**

Create `src/app/(public)/projects/page.tsx`:
```tsx
export default function ProjectsPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <h1 className="relative z-10 text-parchment" style={{ fontSize: "var(--text-heading)" }}>
        Things I've Built
      </h1>
    </main>
  );
}
```

**Step 4: Create dashboard route group layout (placeholder)**

Create `src/app/(dashboard)/layout.tsx`:
```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink-black">
      {/* Sidebar and Kemi will go here */}
      <main className="text-parchment p-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 5: Create dashboard home placeholder**

Create `src/app/(dashboard)/dashboard/page.tsx`:
```tsx
export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-vermillion" style={{ fontSize: "var(--text-heading)" }}>
        Dashboard
      </h1>
      <p className="text-parchment-muted mt-4">Welcome back, Mike.</p>
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add src/app/
git commit -m "structure: set up (public) and (dashboard) route groups"
```

---

## Task 9: Hidden Ink Seal (Dashboard Entrance)

**Files:**
- Create: `src/components/ink/InkSeal.tsx`
- Create: `src/components/ink/PinOverlay.tsx`

**Step 1: Create the InkSeal component**

Create `src/components/ink/InkSeal.tsx`:
```tsx
"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PinOverlay } from "./PinOverlay";

export function InkSeal() {
  const [showPin, setShowPin] = useState(false);
  const [ripple, setRipple] = useState(false);

  const handleClick = useCallback(() => {
    setRipple(true);
    setTimeout(() => {
      setRipple(false);
      setShowPin(true);
    }, 600);
  }, []);

  return (
    <>
      {/* The seal — looks decorative, secretly clickable */}
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center opacity-20 hover:opacity-30 transition-opacity duration-500"
        aria-label="decorative seal"
        style={{ cursor: "none" }}
      >
        <motion.div
          className="w-full h-full rounded-full border border-vermillion/30 flex items-center justify-center"
          animate={ripple ? {
            scale: [1, 1.8, 2.5],
            opacity: [0.3, 0.15, 0],
          } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Hanko seal mark */}
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-vermillion/40">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
            <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="serif">
              陳
            </text>
          </svg>
        </motion.div>
      </button>

      {/* PIN overlay */}
      {showPin && <PinOverlay onClose={() => setShowPin(false)} />}
    </>
  );
}
```

**Step 2: Create the PinOverlay component**

Create `src/components/ink/PinOverlay.tsx`:
```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface PinOverlayProps {
  onClose: () => void;
}

export function PinOverlay({ onClose }: PinOverlayProps) {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Focus first input on mount
    inputsRef.current[0]?.focus();
  }, []);

  const handleInput = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;

      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      setError(false);

      if (value && index < 3) {
        inputsRef.current[index + 1]?.focus();
      }

      // Check PIN when all 4 digits entered
      if (value && index === 3 && newPin.every((d) => d !== "")) {
        setChecking(true);
        // Call auth API
        fetch("/api/auth/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: newPin.join("") }),
        })
          .then((res) => {
            if (res.ok) {
              router.push("/dashboard");
            } else {
              setError(true);
              setPin(["", "", "", ""]);
              inputsRef.current[0]?.focus();
            }
          })
          .catch(() => {
            setError(true);
            setPin(["", "", "", ""]);
            inputsRef.current[0]?.focus();
          })
          .finally(() => setChecking(false));
      }
    },
    [pin, router]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !pin[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [pin, onClose]
  );

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Ink wash backdrop */}
      <div className="absolute inset-0 bg-ink-black/90 backdrop-blur-sm" />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Seal icon */}
        <svg viewBox="0 0 48 48" className="w-16 h-16 text-vermillion/60">
          <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <text x="24" y="32" textAnchor="middle" fill="currentColor" fontSize="20" fontFamily="serif">
            陳
          </text>
        </svg>

        {/* PIN inputs */}
        <div className="flex gap-4">
          {pin.map((digit, i) => (
            <motion.input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={checking}
              className={`w-12 h-14 text-center text-xl font-mono bg-transparent border-b-2 text-parchment outline-none transition-colors ${
                error
                  ? "border-vermillion"
                  : "border-sumi-gray focus:border-parchment"
              }`}
              animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {error && (
          <motion.p
            className="text-vermillion text-sm font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            incorrect
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
```

**Step 3: Verify the seal and PIN overlay**

Run dev server. The seal should appear as a very subtle element in the bottom-right corner (barely visible). Clicking it should show an ink ripple, then a PIN entry overlay.

**Step 4: Commit**

```bash
git add src/components/ink/InkSeal.tsx src/components/ink/PinOverlay.tsx
git commit -m "feat: hidden ink seal with PIN overlay for secret dashboard entrance"
```

---

## Task 10: Menu Button & Navigation Overlay

**Files:**
- Create: `src/components/ui/MenuButton.tsx`
- Create: `src/components/ui/NavigationOverlay.tsx`

**Step 1: Create the MenuButton component**

Create `src/components/ui/MenuButton.tsx`:
```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NavigationOverlay } from "./NavigationOverlay";

export function MenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-6 right-6 z-[200] w-10 h-10 flex flex-col items-center justify-center gap-1.5"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <motion.span
          className="block w-6 h-[1.5px] bg-parchment/60"
          animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          className="block w-6 h-[1.5px] bg-parchment/60"
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
        <motion.span
          className="block w-6 h-[1.5px] bg-parchment/60"
          animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </button>

      <NavigationOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

**Step 2: Create the NavigationOverlay component**

Create `src/components/ui/NavigationOverlay.tsx`:
```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface NavigationOverlayProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Things I've Built", href: "/projects" },
];

export function NavigationOverlay({ open, onClose }: NavigationOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Ink wash backdrop */}
          <motion.div
            className="absolute inset-0 bg-ink-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Navigation links */}
          <nav className="relative z-10 flex flex-col items-center gap-8">
            {NAV_ITEMS.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{
                  delay: i * 0.1 + 0.15,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="text-parchment hover:text-vermillion transition-colors duration-300 font-serif"
                  style={{ fontSize: "var(--text-heading)" }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}

            {/* Email at bottom */}
            <motion.a
              href="mailto:hello@mikechen.xyz"
              className="mt-8 text-parchment-muted hover:text-parchment font-mono text-sm tracking-wider transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              hello@mikechen.xyz
            </motion.a>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 3: Verify navigation**

Run dev server. Click the hamburger menu — should see full-screen ink wash overlay with navigation links that animate in. Links should navigate to the correct pages.

**Step 4: Commit**

```bash
git add src/components/ui/MenuButton.tsx src/components/ui/NavigationOverlay.tsx
git commit -m "feat: minimal menu button with ink wash navigation overlay"
```

---

## Task 11: Scroll Text Reveal Component

**Files:**
- Create: `src/components/ink/ScrollTextReveal.tsx`

**Step 1: Create the scroll-triggered text reveal component**

This is the core component for the philosophy scroll — text reveals word-by-word as you scroll, like Directionless.

Create `src/components/ink/ScrollTextReveal.tsx`:
```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollTextRevealProps {
  text: string;
  className?: string;
  /** How many viewport heights this text section spans */
  scrollSpan?: number;
}

export function ScrollTextReveal({
  text,
  className = "",
  scrollSpan = 1.5,
}: ScrollTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(" ");

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.3"],
  });

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ minHeight: `${scrollSpan * 50}vh` }}
    >
      <div className="sticky top-1/3 px-6 md:px-12 lg:px-24 max-w-4xl mx-auto">
        <p className="font-serif leading-relaxed" style={{ fontSize: "var(--text-subheading)" }}>
          {words.map((word, i) => (
            <Word
              key={`${word}-${i}`}
              word={word}
              index={i}
              total={words.length}
              scrollProgress={scrollYProgress}
            />
          ))}
        </p>
      </div>
    </div>
  );
}

function Word({
  word,
  index,
  total,
  scrollProgress,
}: {
  word: string;
  index: number;
  total: number;
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(scrollProgress, [start, end], [0.15, 1]);

  return (
    <motion.span className="inline-block mr-[0.3em]" style={{ opacity }}>
      {word}
    </motion.span>
  );
}
```

**Step 2: Test it on the home page**

Update `src/app/(public)/page.tsx`:
```tsx
import { InkWashBackground } from "@/components/ink/InkWashBackground";
import { ScrollTextReveal } from "@/components/ink/ScrollTextReveal";

export default function Home() {
  return (
    <main className="relative">
      <InkWashBackground />

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-vermillion" style={{ fontSize: "var(--text-hero)" }}>
          MC
        </h1>
        <p className="text-parchment-muted font-mono text-sm tracking-widest uppercase">
          mikechen.xyz
        </p>
      </section>

      {/* Philosophy scroll */}
      <section className="relative z-10">
        <ScrollTextReveal
          text="Abundance favors the persistent, not the deserving. I believe in building things with your hands. In tasting everything life puts in front of you. In showing up when it's hard."
          scrollSpan={2}
        />

        <ScrollTextReveal
          text="Stay humble. Care for the people around you. The grind isn't glamorous but the results speak for themselves."
          scrollSpan={1.5}
        />
      </section>
    </main>
  );
}
```

**Step 3: Verify scroll reveal**

Run dev server. Scroll down — text should reveal word-by-word, going from dim to fully visible as you scroll through each section.

**Step 4: Commit**

```bash
git add src/components/ink/ScrollTextReveal.tsx src/app/\(public\)/page.tsx
git commit -m "feat: scroll-triggered word-by-word text reveal component"
```

---

## Task 12: Brush Stroke Page Transition

**Files:**
- Create: `src/components/ink/PageTransition.tsx`
- Modify: `src/app/(public)/layout.tsx`

**Step 1: Create the brush stroke wipe transition**

Create `src/components/ink/PageTransition.tsx`:
```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname}>
        {/* Brush stroke wipe overlay */}
        <motion.div
          className="fixed inset-0 z-[500] bg-vermillion origin-left pointer-events-none"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0 }}
          exit={{ scaleX: [0, 1, 1, 0] }}
          transition={{
            duration: 0.8,
            times: [0, 0.4, 0.6, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        {/* Page content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Wrap public layout with PageTransition**

Update `src/app/(public)/layout.tsx`:
```tsx
import { InkWashBackground } from "@/components/ink/InkWashBackground";
import { InkSeal } from "@/components/ink/InkSeal";
import { MenuButton } from "@/components/ui/MenuButton";
import { PageTransition } from "@/components/ink/PageTransition";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InkWashBackground />
      <MenuButton />
      <InkSeal />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
```

**Step 3: Verify transitions**

Navigate between Home and Projects via the menu overlay. Should see a vermillion brush stroke wipe across the screen during transitions.

**Step 4: Commit**

```bash
git add src/components/ink/PageTransition.tsx src/app/\(public\)/layout.tsx
git commit -m "feat: brush stroke wipe page transitions"
```

---

## Task 13: Footer — Ink Seal Signature

**Files:**
- Create: `src/components/ui/Footer.tsx`
- Modify: `src/app/(public)/page.tsx`

**Step 1: Create the footer component**

Create `src/components/ui/Footer.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/macccoding" },
  { label: "X", href: "https://x.com/macccoding" },
  { label: "LinkedIn", href: "https://linkedin.com/in/mikechen" },
];

export function Footer() {
  return (
    <footer className="relative z-10 py-24 flex flex-col items-center gap-8">
      {/* Large hanko seal */}
      <motion.svg
        viewBox="0 0 80 80"
        className="w-20 h-20 text-vermillion"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect
          x="4"
          y="4"
          width="72"
          height="72"
          rx="6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <text
          x="40"
          y="52"
          textAnchor="middle"
          fill="currentColor"
          fontSize="32"
          fontFamily="serif"
        >
          陳
        </text>
      </motion.svg>

      {/* Email */}
      <a
        href="mailto:hello@mikechen.xyz"
        className="text-parchment-muted hover:text-parchment font-mono text-sm tracking-wider transition-colors duration-300"
      >
        hello@mikechen.xyz
      </a>

      {/* Social links */}
      <div className="flex gap-6">
        {SOCIALS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sumi-gray hover:text-parchment font-mono text-xs tracking-wider uppercase transition-colors duration-300"
          >
            {social.label}
          </a>
        ))}
      </div>

      {/* Copyright */}
      <p className="text-sumi-gray/50 font-mono text-xs mt-8">
        &copy; {new Date().getFullYear()} Mike Chen
      </p>
    </footer>
  );
}
```

**Step 2: Add footer to landing page**

Add `<Footer />` at the bottom of `src/app/(public)/page.tsx` after the scroll sections.

**Step 3: Verify footer**

Run dev server. Scroll to bottom — should see the vermillion hanko seal, email, social links, and copyright. Seal animates in on viewport entry.

**Step 4: Commit**

```bash
git add src/components/ui/Footer.tsx src/app/\(public\)/page.tsx
git commit -m "feat: footer with ink seal signature, email, and social links"
```

---

## Task 14: Supabase Setup & PIN Auth API

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/app/api/auth/pin/route.ts`
- Modify: `src/middleware.ts` (create)
- Modify: `.env.local`

**Step 1: Create Supabase project**

Go to https://supabase.com, create a new project called "mikechen-xyz". Copy the project URL and anon key.

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DASHBOARD_PIN_HASH=... # bcrypt hash of the 4-digit PIN
```

**Step 2: Create Supabase client utilities**

Create `src/lib/supabase/client.ts`:
```tsx
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/server.ts`:
```tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

**Step 3: Create PIN auth API route**

Install bcrypt:
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

Create `src/app/api/auth/pin/route.ts`:
```tsx
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerSupabase } from "@/lib/supabase/server";

// Rate limiting: simple in-memory (for production, use Upstash Redis)
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // Rate limit check
  const now = Date.now();
  const record = attempts.get(ip);
  if (record) {
    if (now < record.resetAt) {
      if (record.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many attempts" },
          { status: 429 }
        );
      }
    } else {
      attempts.delete(ip);
    }
  }

  const { pin } = await request.json();

  if (!pin || typeof pin !== "string" || pin.length !== 4) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
  }

  const pinHash = process.env.DASHBOARD_PIN_HASH;
  if (!pinHash) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const valid = await bcrypt.compare(pin, pinHash);

  if (!valid) {
    // Track failed attempt
    const existing = attempts.get(ip);
    if (existing && now < existing.resetAt) {
      existing.count++;
    } else {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
    return NextResponse.json({ error: "Incorrect" }, { status: 401 });
  }

  // PIN correct — sign in with Supabase
  // Use the service role to create a session for the single user
  const supabase = await createServerSupabase();

  // For single-user: sign in with a predefined email
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.MIKE_EMAIL || "mike@mikechen.xyz",
    password: process.env.MIKE_AUTH_PASSWORD || "",
  });

  if (error) {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 4: Create auth middleware**

Create `src/middleware.ts`:
```tsx
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Only protect dashboard routes
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to home (the seal is the only way in)
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

**Step 5: Generate PIN hash**

Run in Node:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PIN_HERE', 10).then(h => console.log(h))"
```

Add the output to `.env.local` as `DASHBOARD_PIN_HASH`.

**Step 6: Commit**

```bash
git add src/lib/supabase/ src/app/api/auth/ src/middleware.ts
git commit -m "feat: Supabase auth with hidden PIN gate and route protection middleware"
```

---

## Task 15: Dashboard Sidebar Layout

**Files:**
- Create: `src/components/dashboard/Sidebar.tsx`
- Create: `src/components/dashboard/DashboardShell.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: Create the sidebar component**

Create `src/components/dashboard/Sidebar.tsx`:
```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const MODULES = [
  { label: "Home", href: "/dashboard", icon: "家" },
  { label: "Finances", href: "/dashboard/finances", icon: "金" },
  { label: "Email", href: "/dashboard/email", icon: "信" },
  { label: "Goals", href: "/dashboard/goals", icon: "的" },
  { label: "Health", href: "/dashboard/health", icon: "体" },
  { label: "Learning", href: "/dashboard/learning", icon: "学" },
  { label: "Journal", href: "/dashboard/journal", icon: "記" },
  { label: "Investments", href: "/dashboard/investments", icon: "株" },
  { label: "Travel", href: "/dashboard/travel", icon: "旅" },
  { label: "Creative", href: "/dashboard/creative", icon: "芸" },
  { label: "Reading", href: "/dashboard/reading", icon: "読" },
  { label: "People", href: "/dashboard/people", icon: "人" },
  { label: "Blueprint", href: "/dashboard/blueprint", icon: "図" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 lg:w-56 bg-ink-dark/50 border-r border-sumi-gray/10 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-4 border-b border-sumi-gray/10">
        <span className="text-vermillion font-serif text-lg font-bold">
          <span className="lg:hidden">MC</span>
          <span className="hidden lg:inline">MikeOS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        <ul className="flex flex-col gap-1 px-2">
          {MODULES.map((mod) => {
            const isActive = pathname === mod.href ||
              (mod.href !== "/dashboard" && pathname.startsWith(mod.href));
            return (
              <li key={mod.href}>
                <Link
                  href={mod.href}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors duration-200 group ${
                    isActive
                      ? "bg-vermillion/10 text-vermillion"
                      : "text-parchment-muted hover:text-parchment hover:bg-ink-mid/30"
                  }`}
                >
                  <span className="w-8 h-8 flex items-center justify-center text-base font-serif shrink-0">
                    {mod.icon}
                  </span>
                  <span className="hidden lg:block text-sm truncate">
                    {mod.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute left-0 w-0.5 h-6 bg-vermillion rounded-r"
                      layoutId="sidebar-indicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Kemi character placeholder */}
      <div className="h-20 border-t border-sumi-gray/10 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-ink-mid/50 border border-sumi-gray/20 flex items-center justify-center text-parchment-muted text-xs font-mono">
          K
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Create the dashboard shell**

Create `src/components/dashboard/DashboardShell.tsx`:
```tsx
import { Sidebar } from "./Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-black">
      <Sidebar />
      <main className="ml-16 lg:ml-56 min-h-screen">
        <div className="p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
```

**Step 3: Update dashboard layout**

Update `src/app/(dashboard)/layout.tsx`:
```tsx
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
```

**Step 4: Update dashboard home page**

Update `src/app/(dashboard)/dashboard/page.tsx`:
```tsx
export default function DashboardHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-vermillion font-serif" style={{ fontSize: "var(--text-heading)" }}>
          Good morning, Mike
        </h1>
        <p className="text-parchment-muted mt-2">
          Here's your day at a glance.
        </p>
      </div>

      {/* Placeholder cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Calendar", "Finances", "Email", "Health", "Streaks", "Kemi"].map(
          (title) => (
            <div
              key={title}
              className="bg-ink-dark/50 border border-sumi-gray/10 rounded-xl p-5 min-h-[120px]"
            >
              <h3 className="text-parchment-muted font-mono text-xs tracking-wider uppercase mb-3">
                {title}
              </h3>
              <p className="text-sumi-gray text-sm">Coming soon</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
```

**Step 5: Verify dashboard layout**

Navigate to /dashboard (temporarily remove auth middleware or set up the Supabase user). Should see sidebar with kanji icons, MikeOS branding, and the dashboard home with placeholder cards.

**Step 6: Commit**

```bash
git add src/components/dashboard/ src/app/\(dashboard\)/
git commit -m "feat: dashboard sidebar layout with kanji icons and shell structure"
```

---

## Task 16: Quick Capture Bar

**Files:**
- Create: `src/components/dashboard/QuickCapture.tsx`
- Modify: `src/components/dashboard/DashboardShell.tsx`

**Step 1: Create the Quick Capture component**

Create `src/components/dashboard/QuickCapture.tsx`:
```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!value.trim()) return;

      // TODO: POST to /api/captures
      console.log("Captured:", value);
      setValue("");
      setOpen(false);
    },
    [value]
  );

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-dark/50 border border-sumi-gray/10 text-sumi-gray text-sm hover:border-sumi-gray/30 transition-colors"
      >
        <span className="font-mono text-xs">Capture</span>
        <kbd className="text-[10px] font-mono bg-ink-mid/30 px-1 py-0.5 rounded text-sumi-gray-light">
          ⌘K
        </kbd>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-start justify-center pt-[20vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-ink-black/60 backdrop-blur-sm" />

            <motion.form
              onSubmit={handleSubmit}
              className="relative z-10 w-full max-w-xl mx-4"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Capture a thought, link, idea..."
                className="w-full px-5 py-4 bg-ink-dark border border-sumi-gray/20 rounded-xl text-parchment placeholder:text-sumi-gray text-lg font-serif outline-none focus:border-vermillion/40 transition-colors"
              />
              <p className="text-center mt-3 text-sumi-gray text-xs font-mono">
                Press Enter to capture · Esc to close
              </p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

**Step 2: Add QuickCapture to DashboardShell**

Update `src/components/dashboard/DashboardShell.tsx` to include the capture bar in the top area:
```tsx
import { Sidebar } from "./Sidebar";
import { QuickCapture } from "./QuickCapture";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-black">
      <Sidebar />
      <main className="ml-16 lg:ml-56 min-h-screen">
        {/* Top bar */}
        <div className="h-16 flex items-center justify-end px-6 lg:px-8 border-b border-sumi-gray/5">
          <QuickCapture />
        </div>
        <div className="p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
```

**Step 3: Verify Quick Capture**

Run dev server, navigate to dashboard. Press Cmd+K — should see capture overlay with input field. Type text, press Enter — logs to console. Esc closes overlay.

**Step 4: Commit**

```bash
git add src/components/dashboard/QuickCapture.tsx src/components/dashboard/DashboardShell.tsx
git commit -m "feat: quick capture bar with Cmd+K shortcut"
```

---

## Task 17: Kemi Chat Interface (UI Only)

**Files:**
- Create: `src/components/kemi/ChatPanel.tsx`
- Create: `src/components/kemi/ChatMessage.tsx`
- Create: `src/components/kemi/ChatInput.tsx`
- Modify: `src/components/dashboard/DashboardShell.tsx`

**Step 1: Create ChatMessage component**

Create `src/components/kemi/ChatMessage.tsx`:
```tsx
interface ChatMessageProps {
  role: "user" | "kemi";
  content: string;
  timestamp?: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isKemi = role === "kemi";

  return (
    <div className={`flex gap-3 ${isKemi ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      {isKemi && (
        <div className="w-7 h-7 rounded-full bg-vermillion/20 border border-vermillion/30 flex items-center justify-center shrink-0 mt-1">
          <span className="text-vermillion text-xs font-serif">K</span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isKemi
            ? "bg-ink-dark/80 text-parchment rounded-tl-sm"
            : "bg-vermillion/10 text-parchment rounded-tr-sm"
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {timestamp && (
          <span className="block mt-1 text-[10px] text-sumi-gray font-mono">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create ChatInput component**

Create `src/components/kemi/ChatInput.tsx`:
```tsx
"use client";

import { useState, useRef, useCallback } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex gap-2 items-end p-3 border-t border-sumi-gray/10">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          // Auto-resize
          e.target.style.height = "auto";
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
        }}
        onKeyDown={handleKeyDown}
        placeholder="Talk to Kemi..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent text-parchment placeholder:text-sumi-gray text-sm outline-none py-2 px-1"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="shrink-0 w-8 h-8 rounded-full bg-vermillion/80 hover:bg-vermillion text-parchment flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
          <path d="M1 8.5L1 1.5L15 8L1 14.5L1 8.5ZM2.5 3.5L2.5 7.5L8 8L2.5 8.5L2.5 12.5L12 8L2.5 3.5Z" />
        </svg>
      </button>
    </div>
  );
}
```

**Step 3: Create ChatPanel component**

Create `src/components/kemi/ChatPanel.tsx`:
```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface Message {
  id: string;
  role: "user" | "kemi";
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "kemi",
      content: "Hey Mike. What's on your mind?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // TODO: Call /api/kemi
    // For now, echo back
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "kemi",
          content: `I heard you say "${content}". Kemi agent coming soon.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed top-0 right-0 bottom-0 w-full sm:w-96 z-[100] bg-ink-dark border-l border-sumi-gray/10 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-sumi-gray/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-vermillion/20 border border-vermillion/30 flex items-center justify-center">
                <span className="text-vermillion text-[10px] font-serif">K</span>
              </div>
              <span className="text-parchment text-sm font-serif">Kemi</span>
            </div>
            <button
              onClick={onClose}
              className="text-sumi-gray hover:text-parchment transition-colors text-lg"
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-vermillion/20 border border-vermillion/30 flex items-center justify-center shrink-0">
                  <span className="text-vermillion text-xs font-serif">K</span>
                </div>
                <div className="bg-ink-dark/80 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-sumi-gray"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <ChatInput onSend={handleSend} disabled={loading} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 4: Add chat toggle to DashboardShell**

Update `src/components/dashboard/DashboardShell.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { QuickCapture } from "./QuickCapture";
import { ChatPanel } from "@/components/kemi/ChatPanel";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-black">
      <Sidebar onKemiClick={() => setChatOpen(true)} />
      <main className="ml-16 lg:ml-56 min-h-screen">
        <div className="h-16 flex items-center justify-end px-6 lg:px-8 border-b border-sumi-gray/5">
          <QuickCapture />
        </div>
        <div className="p-6 lg:p-8 max-w-6xl">
          {children}
        </div>
      </main>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
```

Update `Sidebar` to accept `onKemiClick` prop and wire the Kemi avatar button.

**Step 5: Verify chat panel**

Click Kemi avatar in sidebar → chat panel slides in from right. Type a message → see echo response. Close with × button.

**Step 6: Commit**

```bash
git add src/components/kemi/ src/components/dashboard/
git commit -m "feat: Kemi chat panel UI with message bubbles and sliding panel"
```

---

## Task 18: Prisma Schema — Core Models

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Write the Prisma schema**

Update `prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [vector]
}

// ========== Kioku (Knowledge Graph) ==========

model Node {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  tags      String[]
  status    String   @default("active")
  fields    Json     @default("{}")
  notes     String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sourceLinks Link[]      @relation("SourceNode")
  targetLinks Link[]      @relation("TargetNode")
  recall      NodeRecall?

  @@map("nodes")
}

model Link {
  id           String   @id @default(cuid())
  sourceNodeId String
  targetNodeId String
  relation     String
  createdAt    DateTime @default(now())

  sourceNode Node @relation("SourceNode", fields: [sourceNodeId], references: [id], onDelete: Cascade)
  targetNode Node @relation("TargetNode", fields: [targetNodeId], references: [id], onDelete: Cascade)

  @@unique([sourceNodeId, targetNodeId, relation])
  @@map("links")
}

model NodeRecall {
  id           String    @id @default(cuid())
  nodeId       String    @unique
  lastSurfaced DateTime?
  surfaceCount Int       @default(0)

  node Node @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@map("node_recalls")
}

model KiokuMessage {
  id           String   @id @default(cuid())
  role         String
  content      String
  followUp     String?
  createdNodes String[]
  updatedNodes String[]
  createdAt    DateTime @default(now())

  @@map("kioku_messages")
}

model Journal {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  content   String   @default("")
  createdAt DateTime @default(now())

  @@unique([date])
  @@map("journals")
}

// ========== Dashboard Modules ==========

model Goal {
  id          String    @id @default(cuid())
  title       String
  description String?
  deadline    DateTime?
  status      String    @default("active")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("goals")
}

model Habit {
  id              String     @id @default(cuid())
  title           String
  frequency       String     @default("daily")
  streakProtection Boolean   @default(false)
  active          Boolean    @default(true)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  logs HabitLog[]

  @@map("habits")
}

model HabitLog {
  id        String   @id @default(cuid())
  habitId   String
  date      DateTime @db.Date
  completed Boolean  @default(true)
  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])
  @@map("habit_logs")
}

model Capture {
  id        String   @id @default(cuid())
  content   String
  category  String?
  processed Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("captures")
}

model KemiConversation {
  id        String   @id @default(cuid())
  messages  Json     @default("[]")
  context   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("kemi_conversations")
}

// Additional module tables (investments, travel, creative, reading,
// contacts, learning, email_cache, health_snapshots, financial_snapshots)
// will be added in Phase 2-4 as each module is built.
```

**Step 2: Push schema to Supabase**

```bash
npx prisma db push
```

Expected: Schema pushed to Supabase PostgreSQL. Tables created.

**Step 3: Generate Prisma client**

```bash
npx prisma generate
```

**Step 4: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```tsx
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts
git commit -m "schema: add core Prisma models (Kioku, habits, goals, captures, conversations)"
```

---

## Summary — Phase 1 Deliverables

After completing all 18 tasks, you'll have:

1. **Scaffolded Next.js 16 project** with Tailwind v4
2. **Sumi-e design system** — warm ink tones, vermillion accent, fluid typography, washi grain texture
3. **Custom ink brush cursor** with dripping ink trail
4. **Animated ink wash background** — drifting particles like ink in water
5. **Loading screen** — brush stroke name draw animation
6. **Route groups** — `(public)` and `(dashboard)` separated
7. **Hidden ink seal** — secret dashboard entrance with PIN overlay
8. **Menu button** — minimal burger, full-screen ink wash navigation overlay
9. **Scroll text reveal** — word-by-word opacity on scroll (Directionless-style)
10. **Brush stroke page transitions** — vermillion wipe between routes
11. **Footer** — hanko seal signature, email, social links
12. **Supabase Auth** — PIN-based with middleware route protection
13. **Dashboard sidebar** — kanji icons, active indicator, Kemi placeholder
14. **Quick Capture** — Cmd+K overlay for frictionless input
15. **Kemi chat panel** — sliding chat UI with message bubbles (UI only, no AI yet)
16. **Prisma schema** — core models for Kioku, habits, goals, captures, conversations

---

**Next:** Phase 2 plan will cover Kemi agent integration (Claude API + personality + tools), Financial Pulse module, Email Triage (Gmail OAuth), and Goals & Habits with streak tracking.
