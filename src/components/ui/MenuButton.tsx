"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NavigationOverlay } from "./NavigationOverlay";

export function MenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-6 right-6 z-[200] w-10 h-10 flex flex-col items-center justify-center gap-[5px] group"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <motion.span
          className="block w-5 h-[1px] bg-parchment/50 group-hover:bg-parchment/80 transition-colors"
          animate={
            open
              ? { rotate: 45, y: 3, width: 18 }
              : { rotate: 0, y: 0, width: 20 }
          }
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          className="block h-[1px] bg-parchment/50 group-hover:bg-parchment/80 transition-colors"
          animate={
            open
              ? { opacity: 0, width: 0 }
              : { opacity: 1, width: 12 }
          }
          transition={{ duration: 0.2 }}
          style={{ alignSelf: "flex-end", marginRight: 5 }}
        />
        <motion.span
          className="block w-5 h-[1px] bg-parchment/50 group-hover:bg-parchment/80 transition-colors"
          animate={
            open
              ? { rotate: -45, y: -3, width: 18 }
              : { rotate: 0, y: 0, width: 20 }
          }
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </button>

      <NavigationOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
