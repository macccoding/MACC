"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface NavigationOverlayProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: "Home", href: "/", number: "01" },
  { label: "Things I've Built", href: "/projects", number: "02" },
];

export function NavigationOverlay({ open, onClose }: NavigationOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Ink backdrop */}
          <motion.div
            className="absolute inset-0 bg-ink-deep/97"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <nav className="relative z-10 flex flex-col items-start gap-6 px-8 md:px-0">
            {NAV_ITEMS.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{
                  delay: i * 0.08 + 0.12,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-baseline gap-4 group"
              >
                <span className="font-mono text-vermillion/40 tracking-wider" style={{ fontSize: "var(--text-micro)" }}>
                  {item.number}
                </span>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="text-parchment hover:text-vermillion transition-colors duration-500 font-light"
                  style={{ fontSize: "var(--text-heading)" }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}

            {/* Divider */}
            <motion.div
              className="w-12 h-[1px] bg-sumi-gray-dark mt-4 mb-2"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{ transformOrigin: "left" }}
            />

            {/* Email */}
            <motion.a
              href="mailto:hello@mikechen.xyz"
              className="text-parchment-muted hover:text-parchment font-mono tracking-[0.15em] transition-colors duration-300"
              style={{ fontSize: "var(--text-small)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              hello@mikechen.xyz
            </motion.a>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
