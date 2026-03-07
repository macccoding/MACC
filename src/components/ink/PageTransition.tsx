"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname}>
        {/* Vermillion brush stroke wipe */}
        <motion.div
          className="fixed inset-0 z-[500] bg-vermillion origin-left pointer-events-none"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0 }}
          exit={{
            scaleX: [0, 1, 1, 0],
            originX: [0, 0, 1, 1],
          }}
          transition={{
            duration: 0.8,
            times: [0, 0.35, 0.55, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
