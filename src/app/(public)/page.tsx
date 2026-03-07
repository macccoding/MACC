"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrollTextReveal } from "@/components/ink/ScrollTextReveal";
import { Footer } from "@/components/ui/Footer";

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
          {/* Name — large brush style */}
          <motion.h1
            className="text-parchment font-light tracking-[-0.03em] leading-[0.9]"
            style={{ fontSize: "var(--text-hero)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-vermillion">M</span>IKE{" "}
            <span className="text-vermillion">C</span>HEN
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="font-mono text-parchment-dim tracking-[0.2em] uppercase mt-2"
            style={{ fontSize: "var(--text-micro)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            Build things &middot; Taste everything &middot; Design the rest
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="mt-16 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <motion.div
              className="w-[1px] h-8 bg-parchment/30"
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{
                duration: 2,
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
        {/* Opening quote */}
        <div className="py-8" />
        <ScrollTextReveal
          text="Abundance favors the persistent, not the deserving."
          scrollSpan={1.8}
          fontSize="var(--text-heading)"
          align="center"
        />

        {/* Philosophy paragraphs */}
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

      {/* ===== INTERESTS SECTION ===== */}
      <section className="relative z-10 py-20 md:py-32">
        <div className="px-6 md:px-12 lg:px-20 xl:px-28">
          <motion.p
            className="font-mono text-vermillion/50 tracking-[0.25em] uppercase mb-12"
            style={{ fontSize: "var(--text-micro)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            What moves me
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 md:gap-y-8 max-w-3xl">
            {[
              { label: "Food & Heritage", detail: "Chinese-Jamaican kitchen" },
              { label: "Photography", detail: "Sony A7IV" },
              { label: "Fitness", detail: "Physical discipline" },
              { label: "Table Tennis", detail: "The game within the game" },
              { label: "Porsche 911 RWB", detail: "The dream" },
              { label: "3D Printing", detail: "BambuLab maker" },
              { label: "Travel", detail: "37+ countries" },
              { label: "Code", detail: "Building digital things" },
              { label: "Coffee", detail: "4+ cups, daily ritual" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="group"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <p className="text-parchment font-light text-sm md:text-base group-hover:text-vermillion transition-colors duration-500">
                  {item.label}
                </p>
                <p
                  className="text-parchment-dim font-mono mt-0.5"
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  {item.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
