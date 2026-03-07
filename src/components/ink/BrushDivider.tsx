"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface BrushDividerProps {
  variant?: 1 | 2 | 3;
  color?: "vermillion" | "parchment" | "sumi";
  className?: string;
}

const STROKES: Record<
  number,
  { main: string; shadow: string; viewBox: string }
> = {
  1: {
    main: "M0,30 C30,26 60,34 100,24 C160,12 240,36 320,26 C380,16 440,34 500,30 C540,26 580,24 600,28",
    shadow:
      "M10,34 C40,30 70,37 110,28 C170,16 250,38 330,30 C390,20 450,36 510,34 C545,30 585,28 600,32",
    viewBox: "0 0 600 60",
  },
  2: {
    main: "M0,34 C40,28 80,16 140,14 C200,10 280,24 360,16 C420,10 480,20 520,22 C560,26 590,18 600,22",
    shadow:
      "M8,38 C48,32 88,20 148,18 C208,14 288,28 368,20 C428,14 488,24 528,26 C565,30 594,22 600,26",
    viewBox: "0 0 600 56",
  },
  3: {
    main: "M0,24 C60,20 100,32 180,28 C240,24 300,16 380,20 C440,24 500,32 560,24 C580,20 595,28 600,28",
    shadow:
      "M8,28 C68,24 108,35 188,32 C248,28 308,20 388,24 C448,28 508,35 568,28 C586,24 598,32 600,32",
    viewBox: "0 0 600 52",
  },
};

const COLORS = {
  vermillion: "#D03A2C",
  parchment: "rgba(26, 24, 20, 0.08)",
  sumi: "rgba(26, 24, 20, 0.2)",
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
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.8, 1],
    [0, 1, 1, 0.7]
  );

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
          d={stroke.shadow}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{ pathLength, opacity: 0.15 }}
        />
        <motion.path
          d={stroke.main}
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          style={{ pathLength, opacity }}
        />
      </svg>
    </div>
  );
}
