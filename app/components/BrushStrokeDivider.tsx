"use client";

import { motion, useReducedMotion } from "framer-motion";

interface BrushStrokeDividerProps {
  color?: string;
  className?: string;
  index?: number;
  flip?: boolean;
}

/* 4 bold calligraphy-inspired brush stroke path variants */
const strokeVariants = [
  // Variant 0: Bold horizontal sweep with expressive taper
  "M0,40 C30,38 60,20 120,22 C180,24 240,42 300,40 C360,38 420,18 480,20 C540,22 600,40 660,38 C720,36 780,22 800,24",
  // Variant 1: Confident arc with lift
  "M0,45 C60,42 100,15 200,18 C300,21 350,48 450,45 C550,42 650,12 720,15 C760,17 790,38 800,35",
  // Variant 2: Dynamic press-and-release rhythm
  "M0,35 C40,32 80,48 160,45 C240,42 280,18 400,20 C520,22 560,46 640,44 C720,42 760,28 800,30",
  // Variant 3: Single decisive downstroke feel
  "M0,25 C80,22 160,42 280,40 C400,38 480,15 560,18 C640,21 720,45 800,42",
];

export default function BrushStrokeDivider({
  color = "#E5B820",
  className = "",
  index = 0,
  flip = false,
}: BrushStrokeDividerProps) {
  const prefersReducedMotion = useReducedMotion();
  const strokePath = strokeVariants[index % strokeVariants.length];

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        height: "80px",
        transform: flip ? "scaleY(-1)" : undefined,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 80"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* Primary thick stroke */}
        <motion.path
          d={strokePath}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.15}
          initial={prefersReducedMotion ? {} : { pathLength: 0 }}
          whileInView={prefersReducedMotion ? { opacity: 0.15 } : { pathLength: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.5 }
              : { duration: 1.2, ease: [0.33, 1, 0.68, 1] }
          }
          viewport={{ once: true, margin: "-20px" }}
        />

        {/* Trailing thin stroke (delayed) */}
        <motion.path
          d={strokePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.08}
          initial={prefersReducedMotion ? {} : { pathLength: 0 }}
          whileInView={prefersReducedMotion ? { opacity: 0.08 } : { pathLength: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.5 }
              : { duration: 1.2, delay: 0.3, ease: [0.33, 1, 0.68, 1] }
          }
          viewport={{ once: true, margin: "-20px" }}
        />
      </svg>
    </div>
  );
}
