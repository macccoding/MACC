"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/macccoding" },
  { label: "X", href: "https://x.com/macccoding" },
  { label: "LinkedIn", href: "https://linkedin.com/in/mikechen" },
];

export function Footer() {
  const sealRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sealRef,
    offset: ["start 0.95", "end 0.6"],
  });

  // Seal stamps in with a satisfying reveal
  const sealScale = useTransform(scrollYProgress, [0, 0.5], [0.7, 1]);
  const sealOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const sealRotation = useTransform(scrollYProgress, [0, 0.5], [-8, 0]);

  return (
    <footer className="relative z-10 py-28 md:py-40 flex flex-col items-center gap-10">
      {/* Hanko seal stamp — larger, more dramatic */}
      <motion.div ref={sealRef} style={{ scale: sealScale, opacity: sealOpacity, rotate: sealRotation }}>
        <svg
          viewBox="0 0 96 96"
          className="w-20 h-20 md:w-28 md:h-28"
        >
          {/* Outer border */}
          <rect
            x="4"
            y="4"
            width="88"
            height="88"
            rx="4"
            stroke="#D03A2C"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
          {/* Inner border */}
          <rect
            x="10"
            y="10"
            width="76"
            height="76"
            rx="2"
            stroke="#D03A2C"
            strokeWidth="0.75"
            fill="none"
            opacity="0.25"
          />
          {/* Kanji */}
          <text
            x="48"
            y="62"
            textAnchor="middle"
            fill="#D03A2C"
            fontSize="38"
            fontFamily="serif"
            opacity="0.8"
          >
            陳
          </text>
          {/* Subtle stamp texture — tiny dots to simulate ink texture */}
          <circle cx="20" cy="20" r="0.5" fill="#D03A2C" opacity="0.15" />
          <circle cx="76" cy="24" r="0.7" fill="#D03A2C" opacity="0.1" />
          <circle cx="24" cy="76" r="0.6" fill="#D03A2C" opacity="0.12" />
          <circle cx="72" cy="72" r="0.5" fill="#D03A2C" opacity="0.08" />
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
            className="text-sumi-gray hover:text-vermillion font-mono tracking-[0.1em] uppercase transition-colors duration-500"
            style={{ fontSize: "var(--text-micro)" }}
          >
            {s.label}
          </a>
        ))}
      </motion.div>

      {/* Copyright */}
      <p
        className="text-sumi-gray-dark font-mono mt-8"
        style={{ fontSize: "var(--text-micro)" }}
      >
        &copy; {new Date().getFullYear()} Mike Chen
      </p>
    </footer>
  );
}
