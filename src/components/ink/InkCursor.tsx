"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface InkDrop {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vy: number;
  vx: number;
  life: number;
  wobble: number;
}

export function InkCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const prevMouseRef = useRef({ x: -100, y: -100 });
  const dropsRef = useRef<InkDrop[]>([]);
  const frameRef = useRef<number>(0);
  const lastDropRef = useRef(0);
  const velocityRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track hover on interactive elements
  useEffect(() => {
    if (isMobile) return;

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a, button, [role='button'], input, textarea, select")
      ) {
        setIsHovering(true);
      }
    };
    const handleOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a, button, [role='button'], input, textarea, select")
      ) {
        setIsHovering(false);
      }
    };
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);
    return () => {
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
    };
  }, [isMobile]);

  const spawnDrop = useCallback(
    (x: number, y: number, vel: number) => {
      const spread = Math.min(vel * 0.3, 6);
      dropsRef.current.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y + 6 + Math.random() * 4,
        size: Math.random() * 2 + 0.8 + vel * 0.02,
        opacity: Math.random() * 0.35 + 0.15,
        vy: Math.random() * 0.6 + 0.2 + vel * 0.01,
        vx: (Math.random() - 0.5) * 0.3,
        life: 1,
        wobble: Math.random() * Math.PI * 2,
      });
    },
    []
  );

  useEffect(() => {
    if (isMobile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      prevMouseRef.current = { ...mouseRef.current };
      mouseRef.current = { x: e.clientX, y: e.clientY };

      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      velocityRef.current = Math.sqrt(dx * dx + dy * dy);

      const now = Date.now();
      const interval = Math.max(40, 100 - velocityRef.current * 2);
      if (now - lastDropRef.current > interval) {
        lastDropRef.current = now;
        spawnDrop(e.clientX, e.clientY, velocityRef.current);
        // Extra drops when moving fast
        if (velocityRef.current > 8) {
          spawnDrop(e.clientX, e.clientY, velocityRef.current);
        }
      }
    };

    let time = 0;

    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const { x, y } = mouseRef.current;

      // Draw cursor dot
      const cursorSize = isHovering ? 16 : 5;
      const cursorOpacity = isHovering ? 0.15 : 0.75;

      if (isHovering) {
        // Vermillion ring on hover
        ctx.beginPath();
        ctx.arc(x, y, cursorSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(208, 58, 44, ${cursorOpacity + 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Inner dot
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(208, 58, 44, 0.9)`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, cursorSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26, 24, 20, ${cursorOpacity})`;
        ctx.fill();
      }

      // Update and draw ink drops
      const drops = dropsRef.current;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += d.vy;
        d.x += d.vx + Math.sin(time * 0.03 + d.wobble) * 0.1;
        d.life -= 0.006;
        d.vy += 0.008; // gravity
        d.size *= 0.999;

        if (d.life <= 0) {
          drops.splice(i, 1);
          continue;
        }

        // Draw drop with slight blur effect
        const alpha = d.opacity * d.life * d.life; // ease out
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26, 24, 20, ${alpha})`;
        ctx.fill();

        // Tiny highlight on top of drop
        if (d.size > 1.2) {
          ctx.beginPath();
          ctx.arc(d.x - d.size * 0.2, d.y - d.size * 0.2, d.size * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 237, 224, ${alpha * 0.15})`;
          ctx.fill();
        }
      }

      // Cap drops
      if (drops.length > 60) {
        drops.splice(0, drops.length - 60);
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
  }, [isMobile, isHovering, spawnDrop]);

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9998] pointer-events-none"
      aria-hidden="true"
    />
  );
}
