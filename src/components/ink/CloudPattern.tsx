"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface CloudPatternProps {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity?: number;
}

export function CloudPattern({
  className = "",
  position = "top-right",
  opacity = 0.06,
}: CloudPatternProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [20, -20]);

  const positionClass = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  }[position];

  return (
    <motion.div
      ref={ref}
      className={`absolute ${positionClass} pointer-events-none ${className}`}
      style={{ y, opacity }}
    >
      <svg
        viewBox="0 0 300 200"
        fill="none"
        className="w-48 md:w-72 lg:w-96 h-auto"
      >
        {/* Traditional Japanese cloud (kumo) — layered arcs */}
        <path
          d="M40,120 C40,90 60,70 90,70 C100,50 130,40 160,50 C180,30 220,30 240,50 C270,45 290,65 280,90 C300,100 300,130 280,140 L40,140 C20,140 20,130 40,120 Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-ink-black"
        />
        {/* Inner cloud detail lines */}
        <path
          d="M70,110 C80,95 100,85 120,90"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-ink-black"
          opacity="0.4"
        />
        <path
          d="M140,80 C160,65 190,65 210,75"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-ink-black"
          opacity="0.3"
        />
        <path
          d="M180,100 C200,90 230,90 250,100"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-ink-black"
          opacity="0.2"
        />
      </svg>
    </motion.div>
  );
}
