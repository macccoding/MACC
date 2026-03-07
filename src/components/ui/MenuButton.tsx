"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NavigationOverlay } from "./NavigationOverlay";

export function MenuButton() {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => {
      const darkSections = document.querySelectorAll("[data-theme='dark']");
      let inDark = false;
      darkSections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < 60 && rect.bottom > 0) inDark = true;
      });
      setIsDark(inDark);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const lineColor = open
    ? "bg-parchment/80"
    : isDark
      ? "bg-parchment/60 group-hover:bg-parchment/90"
      : "bg-ink-black/40 group-hover:bg-ink-black/70";

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-6 right-6 z-[200] w-10 h-10 flex flex-col items-center justify-center gap-[5px] group"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <motion.span
          className={`block h-[1.5px] transition-colors duration-300 ${lineColor}`}
          animate={open ? { rotate: 45, y: 3.5, width: 18 } : { rotate: 0, y: 0, width: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          className={`block h-[1.5px] transition-colors duration-300 ${lineColor}`}
          animate={open ? { opacity: 0, width: 0 } : { opacity: 1, width: 12 }}
          transition={{ duration: 0.2 }}
          style={{ alignSelf: "flex-end", marginRight: 5 }}
        />
        <motion.span
          className={`block h-[1.5px] transition-colors duration-300 ${lineColor}`}
          animate={open ? { rotate: -45, y: -3.5, width: 18 } : { rotate: 0, y: 0, width: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </button>
      <NavigationOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
