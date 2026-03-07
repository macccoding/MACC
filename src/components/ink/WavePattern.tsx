"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface WavePatternProps {
  className?: string;
  rows?: number;
  opacity?: number;
}

export function WavePattern({
  className = "",
  rows = 3,
  opacity = 0.05,
}: WavePatternProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], [-10, 10]);

  const arcs: { cx: number; cy: number }[] = [];
  const cols = 12;
  const spacing = 32;
  const rowHeight = spacing * 0.866;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = row % 2 === 0 ? 0 : spacing / 2;
      arcs.push({
        cx: col * spacing + offsetX + 16,
        cy: row * rowHeight + 20,
      });
    }
  }

  const width = cols * spacing + 48;
  const height = rows * rowHeight + 40;

  return (
    <motion.div
      ref={ref}
      className={`pointer-events-none ${className}`}
      style={{ x, opacity }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        className="w-full h-auto"
      >
        {arcs.map((arc, i) => (
          <g key={i}>
            {/* Seigaiha — concentric quarter-circle arcs */}
            <path
              d={`M${arc.cx - 14},${arc.cy + 14} A14,14 0 0,1 ${arc.cx + 14},${arc.cy + 14}`}
              stroke="currentColor"
              strokeWidth="1"
              className="text-ink-black"
            />
            <path
              d={`M${arc.cx - 10},${arc.cy + 14} A10,10 0 0,1 ${arc.cx + 10},${arc.cy + 14}`}
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-ink-black"
              opacity="0.6"
            />
            <path
              d={`M${arc.cx - 6},${arc.cy + 14} A6,6 0 0,1 ${arc.cx + 6},${arc.cy + 14}`}
              stroke="currentColor"
              strokeWidth="0.6"
              className="text-ink-black"
              opacity="0.3"
            />
          </g>
        ))}
      </svg>
    </motion.div>
  );
}
