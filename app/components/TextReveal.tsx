"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface TextRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  splitBy?: "char" | "word";
  scrollOffset?: [string, string];
  className?: string;
  style?: React.CSSProperties;
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.25, 1]);
  const y = useTransform(progress, range, [8, 0]);

  return (
    <span className="inline-block overflow-hidden">
      <motion.span className="inline-block" style={{ opacity, y }}>
        {children}
      </motion.span>
      &nbsp;
    </span>
  );
}

function Char({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.25, 1]);
  const y = useTransform(progress, range, [6, 0]);

  return (
    <motion.span className="inline-block" style={{ opacity, y }}>
      {children}
    </motion.span>
  );
}

export default function TextReveal({
  text,
  as: Tag = "p",
  splitBy = "word",
  scrollOffset = ["start 0.9", "start 0.25"],
  className = "",
  style,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: scrollOffset as ["start end", "start start"],
  });

  if (splitBy === "word") {
    const words = text.split(" ");
    return (
      <Tag ref={ref as React.Ref<HTMLHeadingElement>} className={className} style={style}>
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          return (
            <Word key={i} progress={scrollYProgress} range={[start, end]}>
              {word}
            </Word>
          );
        })}
      </Tag>
    );
  }

  const chars = text.split("");
  return (
    <Tag ref={ref as React.Ref<HTMLHeadingElement>} className={className} style={style}>
      {chars.map((char, i) => {
        const start = i / chars.length;
        const end = start + 1 / chars.length;
        if (char === " ") return <span key={i}>&nbsp;</span>;
        return (
          <Char key={i} progress={scrollYProgress} range={[start, end]}>
            {char}
          </Char>
        );
      })}
    </Tag>
  );
}
