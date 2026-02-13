"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

export default function AnimatedCounter({ value, className = "" }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(value);

  // Check if value is a pure number (e.g. "3", "4+")
  const numericMatch = value.match(/^(\d+)(.*)$/);
  const isNumeric = !!numericMatch;

  useEffect(() => {
    if (!isInView || !isNumeric || !numericMatch) return;

    const target = parseInt(numericMatch[1]);
    const suffix = numericMatch[2] || "";
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplayValue(`${current}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    setDisplayValue(`0${numericMatch[2] || ""}`);
    requestAnimationFrame(animate);
  }, [isInView, isNumeric, numericMatch]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {isInView ? displayValue : value}
    </motion.span>
  );
}
