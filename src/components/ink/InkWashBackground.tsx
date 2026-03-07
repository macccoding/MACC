"use client";

import { useEffect, useRef } from "react";

interface InkBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  phase: number;
  speed: number;
  hue: number; // slight warm/cool variation
}

export function InkWashBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const blobsRef = useRef<InkBlob[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    // Limit DPR for perf on retina
    dpr = Math.min(dpr, 1.5);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Fewer, larger blobs for elegance
    const count = Math.min(Math.floor(window.innerWidth / 50), 25);
    blobsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      radius: Math.random() * 180 + 80,
      opacity: Math.random() * 0.012 + 0.006,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.0015 + 0.0005,
      hue: Math.random() * 6 - 3, // slight warm/cool shift
    }));

    let time = 0;

    const animate = () => {
      time += 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const b of blobsRef.current) {
        // Organic drifting with sinusoidal variation
        b.x += b.vx + Math.sin(time * b.speed + b.phase) * 0.15;
        b.y += b.vy + Math.cos(time * b.speed * 0.7 + b.phase) * 0.1;

        // Wrap
        if (b.x < -b.radius) b.x = w + b.radius;
        if (b.x > w + b.radius) b.x = -b.radius;
        if (b.y < -b.radius) b.y = h + b.radius;
        if (b.y > h + b.radius) b.y = -b.radius;

        // Breathing opacity
        const breathe =
          b.opacity * (0.65 + 0.35 * Math.sin(time * b.speed * 1.3 + b.phase));

        // Sumi-ink tinted radial gradient (dark blobs on parchment)
        const r = 26 + b.hue;
        const g = 24 + b.hue * 0.5;
        const bl = 20;

        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${bl}, ${breathe})`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${bl}, ${breathe * 0.6})`);
        grad.addColorStop(0.7, `rgba(${r}, ${g}, ${bl}, ${breathe * 0.2})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${bl}, 0)`);

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
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
