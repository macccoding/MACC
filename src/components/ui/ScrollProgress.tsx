"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed left-0 top-0 bottom-0 w-[2px] z-[100] origin-top"
      style={{ scaleY, background: "var(--vermillion)", opacity: 0.35 }}
    />
  );
}
