"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface Splash {
  id: number;
  x: number;
  y: number;
}

let nextId = 0;

export default function InkSplash({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const prefersReducedMotion = useReducedMotion();
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId++;

    setSplashes((prev) => [...prev, { id, x, y }]);

    // Clean up after animation
    const timer = setTimeout(() => {
      setSplashes((prev) => prev.filter((s) => s.id !== id));
      timersRef.current.delete(timer);
    }, 600);
    timersRef.current.add(timer);
  }, [prefersReducedMotion]);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      {children}

      {/* Desktop only ink splashes */}
      <AnimatePresence>
        {splashes.map((splash) => (
          <div
            key={splash.id}
            className="pointer-events-none absolute hidden md:block"
            style={{
              left: splash.x,
              top: splash.y,
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden="true"
          >
            {/* 3 offset circles with varying opacity */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-accent"
                style={{
                  left: (i - 1) * 4,
                  top: (i - 1) * 3,
                }}
                initial={{
                  width: 4 + i * 2,
                  height: 4 + i * 2,
                  opacity: 0.3 - i * 0.08,
                  scale: 0.5,
                }}
                animate={{
                  scale: 2 + i * 0.5,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
