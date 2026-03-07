"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrollTextReveal } from "@/components/ink/ScrollTextReveal";
import { BrushDivider } from "@/components/ink/BrushDivider";
import { Footer } from "@/components/ui/Footer";

// Sumi-e brush stroke SVG icons for each interest
// Minimal, evocative, drawn with organic brush paths
const INTERESTS = [
  {
    label: "Food & Heritage",
    detail: "Chinese-Jamaican kitchen",
    // Wok with steam rising
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <path d="M12,38 C14,46 22,52 32,52 C42,52 50,46 52,38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8,38 L56,38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M24,32 C24,28 22,22 24,18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M32,30 C32,24 30,18 33,12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        <path d="M40,32 C40,28 42,24 40,18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
  {
    label: "Photography",
    detail: "Sony A7IV",
    // Camera body with lens circle
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <rect x="10" y="22" width="44" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="32" cy="36" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="32" cy="36" r="4" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <rect x="22" y="18" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
  {
    label: "Fitness",
    detail: "Physical discipline",
    // Figure in motion — running silhouette as brush strokes
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <circle cx="36" cy="14" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M32,20 C30,28 28,34 24,42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M34,20 C36,28 38,34 42,40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24,42 C20,48 18,52 14,56" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M26,40 C30,46 34,50 38,56" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M28,28 C22,26 18,28 14,30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M34,26 C40,22 46,24 50,28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Table Tennis",
    detail: "The game within the game",
    // Paddle and ball
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <ellipse cx="28" cy="28" rx="14" ry="16" transform="rotate(-15 28 28)" stroke="currentColor" strokeWidth="1.5" />
        <path d="M38,40 C42,46 44,52 46,56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="16" r="4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    label: "Porsche 911 RWB",
    detail: "The dream",
    // Car profile — low slung silhouette
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <path d="M6,40 C8,40 12,40 16,40 C18,34 22,28 28,26 C34,24 42,24 48,26 C52,28 56,34 58,40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6,40 L58,40" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="18" cy="42" r="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="48" cy="42" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M24,30 L28,26 L40,26 L44,30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    label: "3D Printing",
    detail: "BambuLab maker",
    // Cube being built layer by layer
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <path d="M32,12 L52,24 L52,44 L32,56 L12,44 L12,24 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M32,12 L32,56" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path d="M12,24 L52,24" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M12,32 L52,32" stroke="currentColor" strokeWidth="0.8" opacity="0.2" strokeDasharray="3 2" />
        <path d="M12,40 L52,40" stroke="currentColor" strokeWidth="0.8" opacity="0.15" strokeDasharray="3 2" />
      </svg>
    ),
  },
  {
    label: "Travel",
    detail: "37+ countries",
    // Compass rose
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.2" />
        <path d="M32,14 L35,28 L32,32 L29,28 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3" />
        <path d="M32,50 L35,36 L32,32 L29,36 Z" stroke="currentColor" strokeWidth="1" />
        <path d="M14,32 L28,29 L32,32 L28,35 Z" stroke="currentColor" strokeWidth="1" />
        <path d="M50,32 L36,29 L32,32 L36,35 Z" stroke="currentColor" strokeWidth="1" />
        <circle cx="32" cy="32" r="2" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
  {
    label: "Code",
    detail: "Building digital things",
    // Angle brackets with brush stroke quality
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <path d="M24,20 L10,32 L24,44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40,20 L54,32 L40,44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36,16 L28,48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    label: "Coffee",
    detail: "4+ cups, daily ritual",
    // Cup with steam curls
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        <path d="M14,28 L14,48 C14,52 20,56 32,56 C44,56 50,52 50,48 L50,28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14,28 L50,28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M50,32 C54,32 58,34 58,38 C58,42 54,44 50,44" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M26,22 C26,18 24,14 26,10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        <path d="M32,20 C32,16 34,12 32,8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        <path d="M38,22 C38,18 36,14 38,10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const heroY = useTransform(heroScroll, [0, 0.8], [0, -60]);

  return (
    <main className="relative">
      {/* ===== HERO ===== */}
      <section
        ref={heroRef}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center"
      >
        <motion.div
          className="flex flex-col items-center gap-3"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          {/* Name — Shippori Mincho display font */}
          <motion.h1
            className="text-parchment tracking-[-0.04em] leading-[0.85]"
            style={{
              fontSize: "var(--text-hero)",
              fontFamily: "var(--font-display), serif",
              fontWeight: 500,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-vermillion">M</span>ike{" "}
            <span className="text-vermillion">C</span>hen
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="font-mono text-parchment-dim tracking-[0.2em] uppercase mt-3"
            style={{ fontSize: "var(--text-micro)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            Build things &middot; Taste everything &middot; Design the rest
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="mt-20 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <motion.div
              className="w-[1px] h-10 bg-parchment/20"
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "top" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== PHILOSOPHY SCROLL ===== */}
      <section className="relative z-10">
        <div className="py-8" />
        <ScrollTextReveal
          text="Abundance favors the persistent, not the deserving."
          scrollSpan={1.8}
          fontSize="var(--text-heading)"
          align="center"
        />

        <ScrollTextReveal
          text="I believe in building things with your hands. In tasting everything life puts in front of you. In showing up when it's hard and staying long after it stops being exciting."
          scrollSpan={2.2}
        />

        <ScrollTextReveal
          text="Stay humble. Care for the people around you. The grind isn't glamorous but the compound effect of showing up every day is the closest thing to magic I've found."
          scrollSpan={2}
        />

        <ScrollTextReveal
          text="From Mandeville to wherever this takes me — I build, I make, I learn, I taste, I move."
          scrollSpan={1.5}
          fontSize="var(--text-heading)"
          align="center"
        />
      </section>

      {/* ===== BRUSH DIVIDER ===== */}
      <BrushDivider variant={1} color="vermillion" className="px-6 md:px-12 lg:px-20 xl:px-28" />

      {/* ===== INTERESTS SECTION — Sumi-e Illustrated ===== */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="px-6 md:px-12 lg:px-20 xl:px-28">
          <motion.p
            className="font-mono text-vermillion/50 tracking-[0.25em] uppercase mb-16 md:mb-20"
            style={{ fontSize: "var(--text-micro)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            What moves me
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-4xl">
            {INTERESTS.map((item, i) => (
              <motion.div
                key={item.label}
                className="group relative"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  delay: i * 0.07,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Card with atmospheric depth */}
                <div className="relative rounded-2xl border border-sumi-gray-dark/10 bg-ink-dark/20 p-5 md:p-6 transition-all duration-700 group-hover:border-vermillion/20 group-hover:bg-ink-dark/40">
                  {/* Sumi-e icon */}
                  <div className="w-10 h-10 md:w-12 md:h-12 text-parchment-dim/40 group-hover:text-vermillion/60 transition-colors duration-700 mb-4">
                    {item.icon}
                  </div>

                  {/* Text */}
                  <p
                    className="text-parchment font-light group-hover:text-vermillion transition-colors duration-500"
                    style={{
                      fontSize: "var(--text-body)",
                      fontFamily: "var(--font-display), serif",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-parchment-dim/60 font-mono mt-1"
                    style={{ fontSize: "var(--text-micro)" }}
                  >
                    {item.detail}
                  </p>

                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-vermillion/[0.03] to-transparent" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BRUSH DIVIDER ===== */}
      <BrushDivider variant={2} color="sumi" className="px-6 md:px-12 lg:px-20 xl:px-28" />

      {/* ===== CLOSING QUOTE ===== */}
      <section className="relative z-10">
        <ScrollTextReveal
          text="The path isn't straight. It was never supposed to be."
          scrollSpan={1.5}
          fontSize="var(--text-heading)"
          align="center"
        />
      </section>

      {/* ===== FOOTER ===== */}
      <Footer />
    </main>
  );
}
