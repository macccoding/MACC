"use client";

import { useEffect, useRef, useCallback } from "react";

interface InkTransitionProps {
  active: boolean;
  direction: "in" | "out";
  onComplete: () => void;
}

const FILL_COLOR = "#1A1A1E";
const TOTAL_DURATION = 800;
const REDUCED_MOTION_DURATION = 200;
const TENDRIL_COUNT = 10;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Attempt a perlin-like noise offset using layered sin/cos.
 * Each tendril gets a unique seed so they spread organically.
 */
function noisyOffset(seed: number, t: number, scale: number): { x: number; y: number } {
  const f1 = seed * 1.7 + 0.3;
  const f2 = seed * 2.3 + 1.1;
  const x =
    Math.sin(t * f1 * 4 + seed) * scale * 0.6 +
    Math.cos(t * f2 * 3 + seed * 2.5) * scale * 0.4;
  const y =
    Math.cos(t * f1 * 3.5 + seed * 1.3) * scale * 0.5 +
    Math.sin(t * f2 * 4.5 + seed * 0.7) * scale * 0.5;
  return { x, y };
}

export default function InkTransition({ active, direction, onComplete }: InkTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref current without re-triggering effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const animate = useCallback(
    (canvas: HTMLCanvasElement, reducedMotion: boolean) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      startTimeRef.current = performance.now();

      const draw = (now: number) => {
        const elapsed = now - (startTimeRef.current ?? now);
        const w = canvas.width;
        const h = canvas.height;
        const diagonal = Math.sqrt(w * w + h * h);
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // --- Reduced motion path ---
        if (reducedMotion) {
          const t = Math.min(elapsed / REDUCED_MOTION_DURATION, 1);
          ctx.fillStyle = FILL_COLOR;
          ctx.globalAlpha = direction === "in" ? (t < 0.5 ? t * 2 : 2 - t * 2) : (t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2);
          // For "in": fade up then down. For "out": reverse.
          if (direction === "in") {
            ctx.globalAlpha = t < 0.5 ? t * 2 : 2 - t * 2;
          } else {
            ctx.globalAlpha = t < 0.5 ? 1 - t * 2 : 0;
          }
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = 1;

          if (t >= 1) {
            onCompleteRef.current();
            return;
          }
          rafRef.current = requestAnimationFrame(draw);
          return;
        }

        // --- Full animation path ---
        // Normalize time based on direction
        const rawT = Math.min(elapsed / TOTAL_DURATION, 1);
        const t = direction === "out" ? 1 - rawT : rawT;

        // Phase boundaries (using the directional t)
        const phase1End = 200 / TOTAL_DURATION; // 0.25
        const phase2End = 500 / TOTAL_DURATION; // 0.625
        const phase3End = 650 / TOTAL_DURATION; // 0.8125

        // Compute canvas opacity (Phase 4 / reveal)
        let canvasOpacity = 1;
        if (t > phase3End) {
          const revealT = (t - phase3End) / (1 - phase3End);
          canvasOpacity = 1 - easeOutQuad(revealT);
        }

        canvas.style.opacity = String(canvasOpacity);

        // Drawing ink
        ctx.fillStyle = FILL_COLOR;
        ctx.globalCompositeOperation = "source-over";

        if (t <= phase1End) {
          // Phase 1: Ink drop — circle from center
          const phase1T = t / phase1End;
          const radius = easeInOutCubic(phase1T) * diagonal * 0.15;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(radius, 0), 0, Math.PI * 2);
          ctx.fill();
        } else if (t <= phase2End) {
          // Phase 2: Bloom — organic tendrils
          const phase2T = (t - phase1End) / (phase2End - phase1End);
          const easedT = easeInOutCubic(phase2T);
          const baseRadius = diagonal * (0.15 + easedT * 0.7);

          // Draw base circle first
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius * 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Draw tendril circles
          for (let i = 0; i < TENDRIL_COUNT; i++) {
            const seed = (i / TENDRIL_COUNT) * Math.PI * 2;
            const spreadScale = baseRadius * 0.35;
            const offset = noisyOffset(seed, easedT, spreadScale);
            const tendrilRadius = baseRadius * (0.35 + Math.sin(seed * 3 + easedT * 5) * 0.15);

            ctx.beginPath();
            ctx.arc(cx + offset.x, cy + offset.y, Math.max(tendrilRadius, 0), 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Phase 3 & 4: Full coverage
          ctx.fillRect(0, 0, w, h);
        }

        if (rawT >= 1) {
          canvas.style.opacity = "1";
          onCompleteRef.current();
          return;
        }

        rafRef.current = requestAnimationFrame(draw);
      };

      rafRef.current = requestAnimationFrame(draw);
    },
    [direction]
  );

  useEffect(() => {
    if (!active) {
      // Clean up any running animation
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      startTimeRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size canvas to viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    animate(canvas, prefersReducedMotion);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      startTimeRef.current = null;
    };
  }, [active, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}
