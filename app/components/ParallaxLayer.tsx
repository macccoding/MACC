"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export default function ParallaxLayer({ children, speed = 0.5, className = "" }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Reduce speed on mobile, disable for reduced motion
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const isReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const effectiveSpeed = isReduced ? 0 : isMobile ? speed * 0.5 : speed;

  const y = useTransform(scrollYProgress, [0, 1], [-60 * effectiveSpeed, 60 * effectiveSpeed]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
