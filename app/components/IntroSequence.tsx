"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function IntroSequence() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("macc-intro-seen")) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("macc-intro-seen", "1");
      return;
    }

    setShow(true);
    document.body.style.overflow = "hidden";

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const baseDelay = isMobile ? 280 : 470;

    // 6-phase sequence
    const t1 = setTimeout(() => setPhase(1), baseDelay);              // Ink wash expands
    const t2 = setTimeout(() => setPhase(2), baseDelay * 2);          // Logo fades in
    const t3 = setTimeout(() => setPhase(3), baseDelay * 3);          // Gold line sweep
    const t4 = setTimeout(() => setPhase(4), baseDelay * 4);          // Name reveal
    const t5 = setTimeout(() => setPhase(5), baseDelay * 5);          // Philosophy flash
    const t6 = setTimeout(() => {
      setPhase(6);                                                      // Wipe up
      sessionStorage.setItem("macc-intro-seen", "1");
    }, baseDelay * 6);
    const t7 = setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
    }, baseDelay * 7);

    return () => {
      [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0B0A09]"
        animate={phase >= 6 ? { y: "-100%" } : {}}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Phase 1: Ink wash — radial gradient expanding from center */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, rgba(229,184,32,0.04) 0%, transparent 60%)",
            }}
          />
        </motion.div>

        {/* Phase 2: Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Image
            src="/images/macc-logo.png"
            alt="MACC"
            width={80}
            height={80}
            className="brightness-0 invert"
            priority
          />
        </motion.div>

        {/* Phase 3: Gold Line */}
        <motion.div
          className="mt-6 h-[1px] bg-[#E5B820]"
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: 120 } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* Phase 4: Name */}
        <motion.div
          className="mt-4 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="block font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.4em] text-[#8A8580]"
            initial={{ y: 20 }}
            animate={phase >= 4 ? { y: 0 } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            MIKE CHEN
          </motion.span>
        </motion.div>

        {/* Phase 5: Philosophy flash */}
        <motion.div
          className="mt-6 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={phase >= 5 ? { opacity: 1 } : { opacity: 0 }}
        >
          <motion.span
            className="block font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.25em] text-[#E5B820]/50 md:text-[10px]"
            initial={{ y: 12 }}
            animate={phase >= 5 ? { y: 0 } : {}}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            ABUNDANCE FAVORS THE PERSISTENT
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
