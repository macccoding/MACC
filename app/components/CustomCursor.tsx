"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  const cursorX = useSpring(0, { damping: 25, stiffness: 300 });
  const cursorY = useSpring(0, { damping: 25, stiffness: 300 });
  const trailX = useSpring(0, { damping: 20, stiffness: 150 });
  const trailY = useSpring(0, { damping: 20, stiffness: 150 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      trailX.set(e.clientX);
      trailY.set(e.clientY);
      if (!visible) setVisible(true);
    },
    [cursorX, cursorY, trailX, trailY, visible]
  );

  useEffect(() => {
    // Detect touch device
    const isTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    if (isTouch) return;

    // Hide default cursor site-wide
    document.documentElement.style.cursor = "none";
    const style = document.createElement("style");
    style.id = "custom-cursor-hide";
    style.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(style);

    window.addEventListener("mousemove", handleMouseMove);

    // Event delegation for interactive hover detection
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, textarea, select, label[for]")) {
        setIsHovering(true);
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.relatedTarget as HTMLElement | null;
      if (!target || !target.closest("a, button, [role='button'], input, textarea, select, label[for]")) {
        setIsHovering(false);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.documentElement.style.cursor = "";
      const el = document.getElementById("custom-cursor-hide");
      if (el) el.remove();
    };
  }, [handleMouseMove]);

  if (isTouchDevice || !visible) return null;

  return (
    <>
      {/* Main dot */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10001] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{
            width: isHovering ? 16 : 8,
            height: isHovering ? 16 : 8,
          }}
          transition={{ duration: 0.2 }}
          className="rounded-full bg-accent"
        />
      </motion.div>

      {/* Trail ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10001] hidden md:block"
        style={{
          x: trailX,
          y: trailY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{
            width: isHovering ? 48 : 24,
            height: isHovering ? 48 : 24,
            opacity: isHovering ? 0.15 : 0.1,
          }}
          transition={{ duration: 0.3 }}
          className="rounded-full border border-accent"
        />
      </motion.div>
    </>
  );
}
