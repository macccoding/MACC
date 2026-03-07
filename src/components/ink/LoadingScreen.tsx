"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const GIF_DURATION = 2000;

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const played = sessionStorage.getItem("loading-played");
      if (played) {
        setVisible(false);
        setHasPlayed(true);
        return;
      }
    }

    const timer = setTimeout(() => {
      setVisible(false);
      setHasPlayed(true);
      sessionStorage.setItem("loading-played", "1");
    }, GIF_DURATION);

    return () => clearTimeout(timer);
  }, []);

  if (hasPlayed && !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10000] bg-white flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Cache-bust ensures GIF plays from frame 1 every time */}
          <img
            src={`/images/macc-loader.gif?v=${Date.now()}`}
            alt="MACC"
            className="w-72 md:w-96 h-auto"
          />

          {/* Subtle tagline */}
          <motion.p
            className="absolute bottom-12 text-sumi-gray font-mono tracking-[0.3em] uppercase"
            style={{ fontSize: "var(--text-micro)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            mikechen.xyz
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
