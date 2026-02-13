"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface GlowBorderProps {
  children: React.ReactNode;
  borderRadius?: number;
  borderWidth?: number;
  glowColor?: string;
  hoverOnly?: boolean;
  className?: string;
}

export default function GlowBorder({
  children,
  borderRadius = 16,
  borderWidth = 1,
  glowColor = "rgba(229,184,32,0.4)",
  hoverOnly = true,
  className = "",
}: GlowBorderProps) {
  const [hovered, setHovered] = useState(false);
  const isActive = hoverOnly ? hovered : true;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius }}
    >
      {/* Rotating conic gradient border */}
      <motion.div
        className="pointer-events-none absolute -inset-px"
        style={{
          borderRadius,
          padding: borderWidth,
          background: `conic-gradient(from var(--glow-angle, 0deg), transparent 40%, ${glowColor} 50%, transparent 60%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
        animate={{
          opacity: isActive ? 1 : 0,
          "--glow-angle": isActive ? "360deg" : "0deg",
        }}
        transition={{
          opacity: { duration: 0.3 },
          "--glow-angle": {
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          },
        }}
        aria-hidden="true"
      />

      {/* Outer glow */}
      <motion.div
        className="pointer-events-none absolute -inset-1"
        style={{
          borderRadius: borderRadius + 2,
          boxShadow: `0 0 30px 5px ${glowColor}`,
        }}
        animate={{ opacity: isActive ? 0.3 : 0 }}
        transition={{ duration: 0.4 }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative" style={{ borderRadius }}>
        {children}
      </div>
    </div>
  );
}
