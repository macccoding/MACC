"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const STROKE_DURATION = 0.5;
const STAGGER = 0.12;
const HOLD = 600;

// SVG brush-style paths for "MIKE CHEN"
// Each letter defined as brush strokes with natural endpoints
const LETTERS: { char: string; paths: string[]; width: number }[] = [
  {
    char: "M",
    paths: [
      "M4,72 C4,72 4,8 6,6",
      "M6,6 C12,28 22,52 28,36",
      "M28,36 C34,20 38,8 44,6",
      "M44,6 C44,20 44,58 44,72",
    ],
    width: 52,
  },
  {
    char: "I",
    paths: ["M14,6 C14,24 14,54 14,72"],
    width: 28,
  },
  {
    char: "K",
    paths: [
      "M6,6 C6,24 6,54 6,72",
      "M42,6 C30,22 18,38 6,40",
      "M14,36 C22,48 32,60 44,72",
    ],
    width: 50,
  },
  {
    char: "E",
    paths: [
      "M6,6 C20,6 34,6 42,8",
      "M6,6 C6,24 6,54 6,72",
      "M6,38 C16,38 28,38 36,40",
      "M6,72 C20,72 34,70 44,72",
    ],
    width: 50,
  },
  { char: " ", paths: [], width: 24 },
  {
    char: "C",
    paths: [
      "M42,10 C28,4 10,8 6,24 C2,42 4,58 8,66 C12,74 28,76 42,68",
    ],
    width: 50,
  },
  {
    char: "H",
    paths: [
      "M6,6 C6,24 6,54 6,72",
      "M6,38 C16,38 28,38 42,40",
      "M42,6 C42,24 42,54 42,72",
    ],
    width: 50,
  },
  {
    char: "E",
    paths: [
      "M6,6 C20,6 34,6 42,8",
      "M6,6 C6,24 6,54 6,72",
      "M6,38 C16,38 28,38 36,40",
      "M6,72 C20,72 34,70 44,72",
    ],
    width: 50,
  },
  {
    char: "N",
    paths: [
      "M6,72 C6,54 6,24 6,6",
      "M6,6 C16,24 28,48 42,72",
      "M42,72 C42,54 42,24 42,6",
    ],
    width: 50,
  },
];

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Only show on first visit per session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const played = sessionStorage.getItem("loading-played");
      if (played) {
        setVisible(false);
        setHasPlayed(true);
        return;
      }
    }

    const totalStrokes = LETTERS.reduce((acc, l) => acc + l.paths.length, 0);
    const animDuration = (totalStrokes * STAGGER + STROKE_DURATION) * 1000;

    const timer = setTimeout(() => {
      setVisible(false);
      setHasPlayed(true);
      sessionStorage.setItem("loading-played", "1");
    }, animDuration + HOLD);

    return () => clearTimeout(timer);
  }, []);

  if (hasPlayed && !visible) return null;

  let strokeIndex = 0;
  let xOffset = 0;

  // Calculate total width for centering
  const totalWidth = LETTERS.reduce((acc, l) => acc + l.width, 0);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10000] bg-ink-deep flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg
            viewBox={`0 0 ${totalWidth} 80`}
            className="w-[85vw] max-w-[600px] h-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {LETTERS.map((letter, li) => {
              const currentX = xOffset;
              xOffset += letter.width;
              if (letter.char === " ") return null;

              return letter.paths.map((path, pi) => {
                const idx = strokeIndex++;
                return (
                  <motion.path
                    key={`${li}-${pi}`}
                    d={path}
                    transform={`translate(${currentX}, 0)`}
                    stroke="#D03A2C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: 1,
                      stroke: ["#D03A2C", "#D03A2C", "#F5EDE0"],
                    }}
                    transition={{
                      pathLength: {
                        duration: STROKE_DURATION,
                        delay: idx * STAGGER,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      opacity: {
                        duration: 0.05,
                        delay: idx * STAGGER,
                      },
                      stroke: {
                        duration: 0.6,
                        delay: idx * STAGGER + STROKE_DURATION * 0.7,
                        times: [0, 0.5, 1],
                      },
                    }}
                  />
                );
              });
            })}
          </svg>

          {/* Subtle tagline */}
          <motion.p
            className="absolute bottom-12 text-parchment-dim font-mono tracking-[0.3em] uppercase"
            style={{ fontSize: "var(--text-micro)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{
              delay: strokeIndex * STAGGER + STROKE_DURATION + 0.2,
              duration: 0.8,
            }}
          >
            mikechen.xyz
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
