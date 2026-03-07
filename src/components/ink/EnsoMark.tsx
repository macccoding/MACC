"use client";

import { motion } from "framer-motion";

interface EnsoMarkProps {
  className?: string;
  animate?: boolean;
}

// Filled ensō path: outer edge clockwise from bottom-left, then inner edge counter-clockwise.
// Variable thickness simulates brush pressure — thick at origin (bottom-left), thinning toward gap (top-right).
const ENSO_PATH = [
  // Start bottom-left (thick brush start, ~18px width)
  "M 58,148",
  // Outer edge — clockwise sweep
  "C 32,132 16,108 14,82",
  "C 12,56 24,34 48,22",
  "C 68,12 92,8 116,10",
  "C 142,13 164,24 178,44",
  // Gap begins — brush lifts top-right (taper to ~4px)
  "C 186,54 190,66 188,78",
  // Crossover into inner edge (thin tip at gap)
  "C 186,72 182,62 174,50",
  // Inner edge — counter-clockwise sweep back to start
  "C 162,32 142,24 118,22",
  "C 96,20 72,24 54,32",
  "C 32,44 24,62 26,84",
  "C 28,104 40,126 62,140",
  "Z",
].join(" ");

export function EnsoMark({
  className = "w-32 h-32 md:w-48 md:h-48",
  animate = true,
}: EnsoMarkProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id="enso-reveal">
          {animate ? (
            <motion.rect
              x="0"
              y="0"
              width="200"
              height="200"
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              transition={{
                duration: 1.4,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2,
              }}
            />
          ) : (
            <rect x="0" y="0" width="200" height="200" />
          )}
        </clipPath>
      </defs>
      <g clipPath="url(#enso-reveal)">
        <motion.path
          d={ENSO_PATH}
          fill="#D03A2C"
          opacity={0.85}
          initial={animate ? { opacity: 0 } : undefined}
          animate={animate ? { opacity: 0.85 } : undefined}
          transition={
            animate
              ? { duration: 0.8, delay: 0.3, ease: "easeOut" }
              : undefined
          }
        />
      </g>
    </svg>
  );
}
