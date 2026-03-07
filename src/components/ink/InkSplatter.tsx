"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface InkSplatterProps {
  className?: string;
  count?: number;
  seed?: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function InkSplatter({
  className = "",
  count = 8,
  seed = 42,
}: InkSplatterProps) {
  const dots = useMemo(() => {
    const rng = seededRandom(seed);
    return Array.from({ length: count }, () => ({
      cx: rng() * 100,
      cy: rng() * 40,
      r: rng() * 2.5 + 0.5,
      opacity: rng() * 0.15 + 0.03,
      delay: rng() * 0.8,
    }));
  }, [count, seed]);

  return (
    <div className={`pointer-events-none ${className}`}>
      <svg viewBox="0 0 100 40" fill="none" className="w-full h-auto">
        {dots.map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill="#1A1814"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: dot.opacity, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: dot.delay,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </svg>
    </div>
  );
}
