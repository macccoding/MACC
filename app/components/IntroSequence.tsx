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
    const baseDelay = isMobile ? 300 : 500;

    // Phase progression
    const t1 = setTimeout(() => setPhase(1), baseDelay);          // Logo appears
    const t2 = setTimeout(() => setPhase(2), baseDelay * 2);       // Gold line sweep
    const t3 = setTimeout(() => setPhase(3), baseDelay * 3);       // Name reveal
    const t4 = setTimeout(() => {
      setPhase(4);                                                   // Wipe up
      sessionStorage.setItem("macc-intro-seen", "1");
    }, baseDelay * 4);
    const t5 = setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
    }, baseDelay * 5);

    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0A0A0A]"
        animate={phase >= 4 ? { y: "-100%" } : {}}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
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

        {/* Gold Line */}
        <motion.div
          className="mt-6 h-[1px] bg-[#E5B820]"
          initial={{ width: 0 }}
          animate={phase >= 2 ? { width: 120 } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* Name */}
        <motion.div
          className="mt-4 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="block font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.4em] text-[#888]"
            initial={{ y: 20 }}
            animate={phase >= 3 ? { y: 0 } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            MIKE CHEN
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
