"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";

interface SealStampProps {
  character: string;
  className?: string;
}

export default function SealStamp({
  character,
  className = "",
}: SealStampProps) {
  const prefersReducedMotion = useReducedMotion();

  // Slight random rotation per stamp — feels hand-pressed
  // Use useEffect to avoid hydration mismatch from Math.random()
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    setRotation(Math.random() * 4 - 2);
  }, []);

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0, rotate: rotation - 3 }}
      whileInView={prefersReducedMotion ? {} : { scale: 1, opacity: 1, rotate: rotation }}
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      viewport={{ once: true }}
      aria-hidden="true"
    >
      {/* 24px mobile, 32px desktop */}
      <svg
        viewBox="0 0 32 32"
        className="h-6 w-6 shrink-0 md:h-8 md:w-8"
      >
        {/* Seal border — slightly rough for authenticity */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="2"
          fill="none"
          stroke="var(--accent-secondary)"
          strokeWidth="2"
          opacity="0.85"
        />
        {/* Inner border */}
        <rect
          x="3"
          y="3"
          width="26"
          height="26"
          rx="1"
          fill="none"
          stroke="var(--accent-secondary)"
          strokeWidth="0.5"
          opacity="0.4"
        />
        {/* Character */}
        <text
          x="16"
          y="17"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--accent-secondary)"
          fontSize="16"
          fontFamily="'Noto Serif SC', 'Songti SC', 'STSong', serif"
          fontWeight="700"
        >
          {character}
        </text>
      </svg>
    </motion.div>
  );
}
