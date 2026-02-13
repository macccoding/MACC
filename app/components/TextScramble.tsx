"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useInView } from "framer-motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";

interface TextScrambleProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export default function TextScramble({ text, className = "", speed = 30, delay = 0 }: TextScrambleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(text);
  const hasAnimated = useRef(false);

  const scramble = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const chars = text.split("");
    const settled = new Array(chars.length).fill(false);
    let frame = 0;

    const interval = setInterval(() => {
      const output = chars.map((char, i) => {
        if (char === " ") return " ";
        if (settled[i]) return char;
        if (frame > (delay / speed) + i * 2) {
          settled[i] = true;
          return char;
        }
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      });

      setDisplay(output.join(""));
      frame++;

      if (settled.every(Boolean)) {
        clearInterval(interval);
        setDisplay(text);
      }
    }, speed);
  }, [text, speed, delay]);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      // Check reduced motion
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDisplay(text);
        return;
      }
      const timer = setTimeout(scramble, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, scramble, delay, text]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
