"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PinOverlay } from "./PinOverlay";

export function InkSeal() {
  const [showPin, setShowPin] = useState(false);
  const [ripple, setRipple] = useState(false);

  const handleClick = useCallback(() => {
    if (ripple) return;
    setRipple(true);
    setTimeout(() => {
      setRipple(false);
      setShowPin(true);
    }, 600);
  }, [ripple]);

  return (
    <>
      {/* The seal — looks purely decorative */}
      <button
        onClick={handleClick}
        className="fixed bottom-5 right-5 z-50 w-10 h-10 flex items-center justify-center group"
        aria-label="seal"
        tabIndex={-1}
      >
        {/* Ripple effect */}
        {ripple && (
          <motion.div
            className="absolute inset-0 rounded-full border border-vermillion/20"
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Seal mark */}
        <svg
          viewBox="0 0 32 32"
          className="w-8 h-8 opacity-[0.12] group-hover:opacity-[0.18] transition-opacity duration-700"
        >
          <rect
            x="3"
            y="3"
            width="26"
            height="26"
            rx="3"
            stroke="#D03A2C"
            strokeWidth="1"
            fill="none"
          />
          <text
            x="16"
            y="22"
            textAnchor="middle"
            fill="#D03A2C"
            fontSize="13"
            fontFamily="serif"
          >
            陳
          </text>
        </svg>
      </button>

      {/* PIN overlay */}
      {showPin && <PinOverlay onClose={() => setShowPin(false)} />}
    </>
  );
}
