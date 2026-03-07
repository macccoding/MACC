"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollTextRevealProps {
  text: string;
  className?: string;
  /** How tall the scroll region is (in vh units / 50) */
  scrollSpan?: number;
  /** Font size CSS variable */
  fontSize?: string;
  /** Text alignment */
  align?: "left" | "center";
}

export function ScrollTextReveal({
  text,
  className = "",
  scrollSpan = 2,
  fontSize = "var(--text-subheading)",
  align = "left",
}: ScrollTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(" ");

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.35"],
  });

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ minHeight: `${scrollSpan * 50}vh` }}
    >
      <div
        className={`sticky top-[35vh] px-6 md:px-12 lg:px-20 xl:px-28 max-w-4xl ${
          align === "center" ? "mx-auto text-center" : ""
        }`}
      >
        <p
          className="leading-[1.6] font-light"
          style={{ fontSize }}
        >
          {words.map((word, i) => (
            <Word
              key={`${i}-${word}`}
              word={word}
              index={i}
              total={words.length}
              scrollProgress={scrollYProgress}
            />
          ))}
        </p>
      </div>
    </div>
  );
}

function Word({
  word,
  index,
  total,
  scrollProgress,
}: {
  word: string;
  index: number;
  total: number;
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  // Each word has a reveal window within the scroll progress
  const start = index / total;
  const end = Math.min(start + 1.5 / total, 1);
  const opacity = useTransform(scrollProgress, [start, end], [0.15, 1]);
  const y = useTransform(scrollProgress, [start, end], [4, 0]);

  return (
    <motion.span
      className="inline-block mr-[0.3em]"
      style={{ opacity, y }}
    >
      {word}
    </motion.span>
  );
}
