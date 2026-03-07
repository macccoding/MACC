"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

interface AtmosphericParticlesProps {
  mode: "parchment" | "dark";
  count?: number;
  className?: string;
}

export function AtmosphericParticles({
  mode,
  count = 50,
  className = "",
}: AtmosphericParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let animId: number;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    /* --- Resize handler --- */
    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    /* --- Color config --- */
    const color =
      mode === "parchment"
        ? { r: 26, g: 24, b: 20, minA: 0.03, maxA: 0.08 }
        : { r: 201, g: 168, b: 76, minA: 0.05, maxA: 0.12 };

    /* --- Spawn a particle --- */
    function spawnParticle(randomizeLife: boolean): Particle {
      const w = canvas!.width / dpr;
      const h = canvas!.height / dpr;
      const baseAlpha =
        color.minA + Math.random() * (color.maxA - color.minA);
      const maxLife = 400 + Math.random() * 600; // frames
      return {
        x: Math.random() * w,
        y: randomizeLife ? Math.random() * h : h + Math.random() * 20,
        radius: 1 + Math.random() * 2,
        alpha: 0,
        baseAlpha,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(0.15 + Math.random() * 0.35), // upward drift
        life: randomizeLife ? Math.random() * maxLife : 0,
        maxLife,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
      };
    }

    /* --- Init particles --- */
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push(spawnParticle(true));
    }

    /* --- Scroll listener --- */
    function onScroll() {
      const newScrollY = window.scrollY;
      scrollVelocity = newScrollY - lastScrollY;
      lastScrollY = newScrollY;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    /* --- Animation loop --- */
    function frame() {
      const w = canvas!.width / dpr;
      const h = canvas!.height / dpr;

      ctx!.clearRect(0, 0, w, h);

      // Decay scroll velocity
      scrollVelocity *= 0.92;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update life
        p.life++;

        // Fade envelope: fade in first 15%, fade out last 15%
        const lifeRatio = p.life / p.maxLife;
        let fadeFactor: number;
        if (lifeRatio < 0.15) {
          fadeFactor = lifeRatio / 0.15;
        } else if (lifeRatio > 0.85) {
          fadeFactor = (1 - lifeRatio) / 0.15;
        } else {
          fadeFactor = 1;
        }
        p.alpha = p.baseAlpha * Math.max(0, fadeFactor);

        // Wobble
        p.wobblePhase += p.wobbleSpeed;
        const wobble = Math.sin(p.wobblePhase) * 0.3;

        // Move
        p.x += p.vx + wobble + scrollVelocity * 0.04;
        p.y += p.vy;

        // Wrap horizontal edges
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;

        // Respawn if exited top or life exceeded
        if (p.y < -10 || p.life >= p.maxLife) {
          particles[i] = spawnParticle(false);
          continue;
        }

        // Draw
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.alpha})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    /* --- Cleanup --- */
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [mode, count]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
}
