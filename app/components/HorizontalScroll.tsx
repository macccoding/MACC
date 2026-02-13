"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.666%"]);

  return (
    <>
      {/* Mobile: stack vertically */}
      <div className="md:hidden">
        <div className={`flex flex-col gap-6 ${className}`}>
          {children}
        </div>
      </div>

      {/* Desktop: horizontal scroll */}
      <div ref={containerRef} className="relative hidden md:block" style={{ height: "300vh" }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <motion.div style={{ x }} className={`flex gap-8 px-12 ${className}`}>
            {children}
          </motion.div>
        </div>
      </div>
    </>
  );
}
