"use client";

import { motion } from "framer-motion";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/macccoding" },
  { label: "X", href: "https://x.com/macccoding" },
  { label: "LinkedIn", href: "https://linkedin.com/in/mikechen" },
];

export function Footer() {
  return (
    <footer className="relative z-10 py-20 md:py-28 flex flex-col items-center gap-8">
      {/* Hanko seal stamp */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg viewBox="0 0 72 72" className="w-16 h-16 md:w-20 md:h-20">
          <rect
            x="4"
            y="4"
            width="64"
            height="64"
            rx="5"
            stroke="#D03A2C"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />
          {/* Subtle inner border */}
          <rect
            x="8"
            y="8"
            width="56"
            height="56"
            rx="3"
            stroke="#D03A2C"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
          <text
            x="36"
            y="48"
            textAnchor="middle"
            fill="#D03A2C"
            fontSize="28"
            fontFamily="serif"
            opacity="0.7"
          >
            陳
          </text>
        </svg>
      </motion.div>

      {/* Email */}
      <motion.a
        href="mailto:hello@mikechen.xyz"
        className="text-parchment-muted hover:text-parchment font-mono tracking-[0.15em] transition-colors duration-500"
        style={{ fontSize: "var(--text-small)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        hello@mikechen.xyz
      </motion.a>

      {/* Social links */}
      <motion.div
        className="flex gap-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sumi-gray hover:text-parchment-muted font-mono tracking-[0.1em] uppercase transition-colors duration-500"
            style={{ fontSize: "var(--text-micro)" }}
          >
            {s.label}
          </a>
        ))}
      </motion.div>

      {/* Copyright */}
      <p
        className="text-sumi-gray-dark font-mono mt-6"
        style={{ fontSize: "var(--text-micro)" }}
      >
        &copy; {new Date().getFullYear()} Mike Chen
      </p>
    </footer>
  );
}
