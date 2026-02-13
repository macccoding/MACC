"use client";

import { motion } from "framer-motion";

interface ImageRevealProps {
  children: React.ReactNode;
  direction?: "left" | "right" | "top" | "bottom";
  delay?: number;
  className?: string;
}

const clipPaths: Record<string, { hidden: string; visible: string }> = {
  left: {
    hidden: "inset(0 100% 0 0)",
    visible: "inset(0 0 0 0)",
  },
  right: {
    hidden: "inset(0 0 0 100%)",
    visible: "inset(0 0 0 0)",
  },
  top: {
    hidden: "inset(0 0 100% 0)",
    visible: "inset(0 0 0 0)",
  },
  bottom: {
    hidden: "inset(100% 0 0 0)",
    visible: "inset(0 0 0 0)",
  },
};

export default function ImageReveal({
  children,
  direction = "left",
  delay = 0,
  className = "",
}: ImageRevealProps) {
  const clip = clipPaths[direction];

  return (
    <motion.div
      className={className}
      initial={{ clipPath: clip.hidden }}
      whileInView={{ clipPath: clip.visible }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.33, 1, 0.68, 1],
      }}
      viewport={{ once: true, margin: "-50px" }}
    >
      {children}
    </motion.div>
  );
}
