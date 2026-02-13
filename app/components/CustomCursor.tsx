"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const [onLight, setOnLight] = useState(false);
  const rafRef = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });

  const cursorX = useSpring(0, { damping: 25, stiffness: 300 });
  const cursorY = useSpring(0, { damping: 25, stiffness: 300 });
  const trailX = useSpring(0, { damping: 20, stiffness: 150 });
  const trailY = useSpring(0, { damping: 20, stiffness: 150 });

  // Detect if cursor is over a light/gold background
  const checkBackground = useCallback(() => {
    const { x, y } = mousePos.current;
    const el = document.elementFromPoint(x, y);
    if (!el) return;

    // Walk up to find if we're over an accent/gold surface
    let node: Element | null = el;
    let isLight = false;
    while (node && node !== document.documentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        // Parse rgb values
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          // Relative luminance check — gold (#E5B820) has high luminance
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (luminance > 0.45) {
            isLight = true;
          }
        }
        break;
      }
      node = node.parentElement;
    }
    setOnLight(isLight);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      trailX.set(e.clientX);
      trailY.set(e.clientY);
      mousePos.current = { x: e.clientX, y: e.clientY };
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

    // Throttled background check via rAF
    let lastCheck = 0;
    const tick = () => {
      const now = performance.now();
      if (now - lastCheck > 100) {
        checkBackground();
        lastCheck = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

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
      cancelAnimationFrame(rafRef.current);
      document.documentElement.style.cursor = "";
      const el = document.getElementById("custom-cursor-hide");
      if (el) el.remove();
    };
  }, [handleMouseMove, checkBackground]);

  if (isTouchDevice || !visible) return null;

  const dotColor = onLight ? "bg-bg-primary" : "bg-accent";
  const ringColor = onLight ? "border-bg-primary" : "border-accent";

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
          className={`rounded-full transition-colors duration-200 ${dotColor}`}
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
          className={`rounded-full border transition-colors duration-200 ${ringColor}`}
          style={{ mixBlendMode: "difference" }}
        />
      </motion.div>
    </>
  );
}
