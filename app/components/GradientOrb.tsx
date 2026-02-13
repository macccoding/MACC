"use client";

import { motion, useReducedMotion } from "framer-motion";

interface GradientOrbProps {
  color?: string;
  size?: number;
  blur?: number;
  opacity?: number;
  position?: { top?: string; bottom?: string; left?: string; right?: string };
  duration?: number;
  mobileHidden?: boolean;
}

export default function GradientOrb({
  color = "229,184,32",
  size = 400,
  blur = 120,
  opacity = 0.15,
  position = {},
  duration = 20,
  mobileHidden = true,
}: GradientOrbProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`pointer-events-none absolute ${mobileHidden ? "hidden md:block" : ""}`}
      style={{
        width: size,
        height: size,
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        filter: `blur(${blur}px)`,
        background: `radial-gradient(circle, rgba(${color},${opacity}) 0%, transparent 70%)`,
        willChange: prefersReducedMotion ? "auto" : "transform",
      }}
      animate={
        prefersReducedMotion
          ? {}
          : {
              x: [0, 30, -20, 0],
              y: [0, -25, 15, 0],
            }
      }
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
      aria-hidden="true"
    />
  );
}
