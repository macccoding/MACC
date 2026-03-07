"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface BrushDividerProps {
  /** Which brush stroke variation to use */
  variant?: 1 | 2 | 3;
  /** Color of the stroke */
  color?: "vermillion" | "parchment" | "sumi";
  /** Width of the container */
  className?: string;
}

// Hand-drawn brush stroke SVG paths — each feels organic, not geometric
const STROKES: Record<number, { path: string; viewBox: string }> = {
  1: {
    // Long horizontal sweep with natural taper — like a single fude brush pull
    path: "M0,20 C30,18 60,22 100,16 C160,8 240,24 320,18 C380,12 440,22 500,20 C540,18 580,16 600,18",
    viewBox: "0 0 600 40",
  },
  2: {
    // Shorter, thicker, with a slight arc — confident downward stroke
    path: "M0,24 C40,20 80,12 140,10 C200,8 280,16 360,12 C420,8 480,14 520,16 C560,18 590,14 600,16",
    viewBox: "0 0 600 36",
  },
  3: {
    // Wispy, thin — like the trailing end of a brush lifting off paper
    path: "M0,16 C60,14 100,20 180,18 C240,16 300,12 380,14 C440,16 500,20 560,16 C580,14 595,18 600,18",
    viewBox: "0 0 600 32",
  },
};

const COLORS = {
  vermillion: "#D03A2C",
  parchment: "rgba(245, 237, 224, 0.15)",
  sumi: "rgba(107, 99, 90, 0.25)",
};

export function BrushDivider({
  variant = 1,
  color = "sumi",
  className = "",
}: BrushDividerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.5"],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.8, 1], [0, 1, 1, 0.7]);

  const stroke = STROKES[variant];
  const strokeColor = COLORS[color];

  return (
    <div
      ref={ref}
      className={`relative py-8 md:py-12 flex items-center justify-center ${className}`}
    >
      <svg
        viewBox={stroke.viewBox}
        className="w-full max-w-2xl h-auto"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <motion.path
          d={stroke.path}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{ pathLength, opacity }}
        />
      </svg>
    </div>
  );
}
