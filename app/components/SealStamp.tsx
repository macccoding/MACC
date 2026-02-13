"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

interface SealStampProps {
  character: string;
  className?: string;
  size?: number;
}

export default function SealStamp({
  character,
  className = "",
  size = 32,
}: SealStampProps) {
  const prefersReducedMotion = useReducedMotion();

  // Slight random rotation per stamp — feels hand-pressed
  const rotation = useMemo(() => Math.random() * 4 - 2, []);

  const mobileSize = Math.round(size * 0.75);

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0, rotate: rotation - 3 }}
      whileInView={prefersReducedMotion ? {} : { scale: 1, opacity: 1, rotate: rotation }}
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      viewport={{ once: true }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`md:w-[${size}px] md:h-[${size}px]`}
        style={{
          width: mobileSize,
          height: mobileSize,
        }}
      >
        {/* Seal border — slightly rough for authenticity */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="2"
          fill="none"
          stroke="#C41E3A"
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
          stroke="#C41E3A"
          strokeWidth="0.5"
          opacity="0.4"
        />
        {/* Character */}
        <text
          x="16"
          y="17"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#C41E3A"
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
