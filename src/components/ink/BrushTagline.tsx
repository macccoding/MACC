"use client";

import { motion } from "framer-motion";

interface BrushTaglineProps {
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const WORD_PATHS = {
  experience: [
    // E
    "M 12,16 C 12,16 38,14 40,16 M 12,16 L 12,56 M 12,36 L 34,35 M 12,56 C 12,56 38,57 40,55",
    // x
    "M 50,28 C 56,36 62,44 68,56 M 68,28 C 62,36 56,44 50,56",
    // p
    "M 76,28 L 76,70 M 76,28 C 76,26 98,24 98,38 C 98,50 78,50 76,46",
    // e
    "M 118,38 C 112,30 104,30 104,40 C 104,52 116,54 120,48 M 104,40 L 118,40",
    // r
    "M 126,30 L 126,56 M 126,36 C 126,30 138,28 140,32",
    // i
    "M 148,30 L 148,56 M 148,22 L 149,23",
    // e
    "M 170,38 C 164,30 156,30 156,40 C 156,52 168,54 172,48 M 156,40 L 170,40",
    // n
    "M 180,30 L 180,56 M 180,32 C 180,28 196,26 196,34 L 196,56",
    // c
    "M 220,32 C 214,28 206,30 206,42 C 206,54 214,56 220,52",
    // e
    "M 242,38 C 236,30 228,30 228,40 C 228,52 240,54 244,48 M 228,40 L 242,40",
  ],
  build: [
    // B
    "M 290,16 L 290,56 M 290,16 C 290,16 310,14 310,26 C 310,34 292,36 290,36 C 290,36 314,34 314,46 C 314,58 290,58 290,56",
    // u
    "M 322,30 L 322,48 C 322,56 336,56 336,48 L 336,30",
    // i
    "M 344,30 L 344,56 M 344,22 L 345,23",
    // l
    "M 354,14 L 354,56",
    // d
    "M 378,40 C 372,30 362,32 362,42 C 362,54 372,56 378,50 M 378,14 L 378,56",
  ],
  move: [
    // M
    "M 426,56 L 426,16 L 440,40 L 454,16 L 454,56",
    // o
    "M 476,42 C 476,30 464,30 464,42 C 464,54 476,54 476,42",
    // v
    "M 482,28 L 492,56 L 502,28",
    // e
    "M 524,38 C 518,30 510,30 510,40 C 510,52 522,54 526,48 M 510,40 L 524,40",
  ],
};

const DOT_POSITIONS = [260, 406];

function WordGroup({
  paths,
  delay,
}: {
  paths: string[];
  delay: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, delay }}
    >
      {paths.map((d, i) =>
        d.split(" M ").map((segment, j) => {
          const path = j === 0 ? segment : `M ${segment}`;
          return (
            <motion.path
              key={`${i}-${j}`}
              d={path}
              stroke="#1A1814"
              strokeWidth={i === 0 && j === 0 ? 5 : 4.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.6,
                delay: delay + i * 0.04 + j * 0.02,
                ease: EASE,
              }}
            />
          );
        })
      )}
    </motion.g>
  );
}

export function BrushTagline({ className = "" }: BrushTaglineProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 540 80"
        className="w-full max-w-2xl h-auto"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <WordGroup paths={WORD_PATHS.experience} delay={0.2} />

        <motion.circle
          cx={DOT_POSITIONS[0]}
          cy={40}
          r={3}
          fill="#1A1814"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          transition={{ duration: 0.3, delay: 0.8, ease: EASE }}
        />

        <WordGroup paths={WORD_PATHS.build} delay={0.5} />

        <motion.circle
          cx={DOT_POSITIONS[1]}
          cy={40}
          r={3}
          fill="#1A1814"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          transition={{ duration: 0.3, delay: 1.1, ease: EASE }}
        />

        <WordGroup paths={WORD_PATHS.move} delay={0.8} />
      </svg>
    </div>
  );
}
