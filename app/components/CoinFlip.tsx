"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useAnimation, useReducedMotion } from "framer-motion";

interface CoinFlipProps {
  className?: string;
}

export default function CoinFlip({ className = "" }: CoinFlipProps) {
  const [flipped, setFlipped] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();
  const flipCount = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const handleFlip = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (!hasFlipped) setHasFlipped(true);

    flipCount.current += 1;
    const nextFlipped = !flipped;

    if (prefersReducedMotion) {
      // Simple crossfade for reduced motion
      await controls.start({
        rotateY: flipCount.current * 180,
        transition: { duration: 0 },
      });
    } else {
      // 540° total = 1.5 full spins, landing on the opposite face
      const targetRotation = flipCount.current * 540;

      await controls.start({
        rotateY: targetRotation,
        scale: [1, 1.15, 1.1, 1],
        transition: {
          rotateY: {
            duration: 1.1,
            ease: [0.2, 0.9, 0.3, 1],
          },
          scale: {
            duration: 1.1,
            times: [0, 0.3, 0.6, 1],
            ease: "easeOut",
          },
        },
      });
    }

    setFlipped(nextFlipped);
    setIsAnimating(false);
  };

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      onClick={handleFlip}
      role="button"
      aria-label="Flip coin to reveal Chen character"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleFlip();
        }
      }}
    >
      {/* Tap hint on mobile — shown once */}
      {!hasFlipped && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted/40 md:hidden"
        >
          TAP TO FLIP
        </motion.span>
      )}

      <div
        style={{ perspective: "1200px" }}
        className="w-[160px] sm:w-[200px] md:w-[320px]"
      >
        <motion.div
          animate={controls}
          initial={{ rotateY: 0 }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative aspect-square w-full"
        >
          {/* Front — MACC logo (clean, no border) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="relative h-full w-full">
              <Image
                src="/images/macc-logo.png"
                alt="MACC Logo — Chinese Chop Stamp"
                fill
                priority
                className="object-contain drop-shadow-[0_0_80px_rgba(229,184,32,0.25)]"
              />
            </div>
          </div>

          {/* Back — 陳 Chen character */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-full border-2 border-[#E5B820]/50 bg-[#0B0A09]"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span
              className="text-[4rem] leading-none sm:text-[5rem] md:text-[8rem]"
              style={{
                fontFamily: "'Noto Serif SC', 'Songti SC', 'STSong', serif",
                color: "#E5B820",
              }}
            >
              陳
            </span>
            <span className="mt-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-[#E5B820]/60 md:text-xs">
              CHEN
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
