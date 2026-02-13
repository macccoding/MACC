"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ScrollReveal from "@/app/components/ScrollReveal";
import ImageReveal from "@/app/components/ImageReveal";
import TextScramble from "@/app/components/TextScramble";
import TextReveal from "@/app/components/TextReveal";
import BlobDivider from "@/app/components/BlobDivider";
import AnimatedButton from "@/app/components/AnimatedButton";
import AnimatedCounter from "@/app/components/AnimatedCounter";
import GlowBorder from "@/app/components/GlowBorder";
import { ventures } from "@/lib/data/ventures";

/* ─── PAGE COMPONENT ─── */
export default function VenturesPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <>
      <Navbar />

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity }}
        className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-bg-primary px-6"
      >
        {/* Background ghost number */}
        <motion.span
          style={{ y: heroY }}
          className="pointer-events-none absolute select-none font-[family-name:var(--font-playfair)] text-[40vw] font-bold leading-none text-ghost"
        >
          V
        </motion.span>

        {/* Flanking labels */}
        <span className="absolute left-6 top-1/2 hidden -translate-y-1/2 -rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block">
          04 VENTURES
        </span>
        <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block">
          MANDEVILLE, JAMAICA 2026
        </span>

        {/* Mobile flanking text */}
        <div className="absolute top-28 flex gap-4 text-center md:hidden">
          <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/60">
            04 VENTURES
          </span>
          <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/60">
            MANDEVILLE 2026
          </span>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          <p className="mb-6 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-text-muted">
            THE PORTFOLIO
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] font-bold leading-[0.85] text-text-primary" style={{ fontSize: "var(--text-hero)" }}>
            <TextScramble text="Ventures" delay={300} />
          </h1>
          <p className="mx-auto mt-8 max-w-xl font-[family-name:var(--font-jetbrains)] text-[11px] uppercase leading-relaxed tracking-[0.15em] text-text-muted">
            Businesses, legacy, and things I&apos;m building.
            <br className="hidden md:block" />
            From family roots to new frontiers.
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 flex flex-col items-center gap-3"
        >
          <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
            SCROLL TO EXPLORE
          </span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="text-text-muted"
          >
            &darr;
          </motion.span>
        </motion.div>
      </motion.section>

      {/* ════════════════════════════════════════════
          VENTURE SECTIONS
      ════════════════════════════════════════════ */}
      {ventures.map((venture, ventureIndex) => (
        <section
          key={venture.num}
          className={`relative overflow-hidden ${
            ventureIndex % 2 === 0 ? "bg-bg-primary" : "bg-bg-secondary"
          }`}
        >
          {/* ── HERO IMAGE PLACEHOLDER (full-bleed) ── */}
          <ImageReveal direction={ventureIndex % 3 === 0 ? "left" : ventureIndex % 3 === 1 ? "right" : "bottom"} delay={0.1}>
            <div className="relative h-[40vh] w-full overflow-hidden md:h-[60vh]">
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${venture.accent}08 0%, transparent 50%, ${venture.accent}05 100%)`,
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-[family-name:var(--font-playfair)] text-[25vw] font-bold leading-none md:text-[18vw]"
                  style={{ color: `${venture.accent}08` }}
                >
                  {venture.num}
                </span>
                <span className="absolute font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted/40">
                  HERO PHOTO COMING SOON
                </span>
              </div>
              {/* Bottom gradient fade */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t ${
                  ventureIndex % 2 === 0
                    ? "from-bg-primary"
                    : "from-bg-secondary"
                } to-transparent`}
              />
            </div>
          </ImageReveal>

          {/* ── VENTURE CONTENT ── */}
          <div className="relative px-6 pb-16 pt-8 md:pb-32 md:px-12 lg:px-24">
            <div className="mx-auto max-w-7xl">
              {/* Number + Name */}
              <div className="mb-16 md:mb-24">
                <ScrollReveal>
                  <div className="flex items-start gap-6 md:gap-10">
                    {/* Big number */}
                    <span
                      className="font-[family-name:var(--font-playfair)] text-[5rem] font-bold leading-none md:text-[8rem] lg:text-[16rem]"
                      style={{ color: `${venture.accent}15` }}
                    >
                      {venture.num}
                    </span>

                    {/* Name + metadata */}
                    <div className="flex flex-col justify-end pt-4 md:pt-8">
                      <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                        VENTURE {venture.num}
                      </span>
                      <h2
                        className="mt-2 font-[family-name:var(--font-playfair)] text-5xl font-bold leading-[0.9] md:text-7xl lg:text-8xl"
                        style={{ color: venture.accent }}
                      >
                        {venture.name}
                      </h2>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Role + Year + Tags row */}
                <ScrollReveal delay={0.15}>
                  <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8 md:mt-12 md:gap-8">
                    <div className="flex items-center gap-3">
                      <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                        ROLE
                      </span>
                      <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.1em] text-text-primary">
                        {venture.role}
                      </span>
                    </div>
                    <span className="hidden text-white/10 md:inline">|</span>
                    <div className="flex items-center gap-3">
                      <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                        SINCE
                      </span>
                      <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.1em] text-text-primary">
                        {venture.year}
                      </span>
                    </div>
                    <span className="hidden text-white/10 md:inline">|</span>
                    <div className="flex flex-wrap gap-2">
                      {venture.tags.map((tag, i) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          viewport={{ once: true }}
                          className="rounded-full border border-white/10 px-3 py-1 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-wider text-text-muted transition-colors hover:border-white/20 hover:text-text-primary"
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* ── Description + Stats Grid ── */}
              <div className="grid gap-16 md:grid-cols-12 md:gap-12 lg:gap-20">
                {/* Description (larger column) */}
                <div className="md:col-span-7">
                  <ScrollReveal>
                    <p className="mb-4 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                      OVERVIEW
                    </p>
                  </ScrollReveal>
                  <ScrollReveal delay={0.1}>
                    <p
                      className="mb-2 font-[family-name:var(--font-playfair)] text-xl italic leading-snug md:text-2xl"
                      style={{ color: venture.accent }}
                    >
                      {venture.tagline}
                    </p>
                  </ScrollReveal>
                  {(Array.isArray(venture.description) ? venture.description : [venture.description]).map((para, i) => (
                    <ScrollReveal key={i} delay={0.15 + i * 0.1}>
                      <p className="mt-6 text-base leading-[1.8] text-text-primary/75 md:text-lg">
                        {para}
                      </p>
                    </ScrollReveal>
                  ))}

                  {/* CTA link */}
                  <ScrollReveal delay={0.4}>
                    <AnimatedButton href={venture.link} variant="outline" className="mt-10" external>
                      {venture.linkLabel} &rarr;
                    </AnimatedButton>
                  </ScrollReveal>
                </div>

                {/* Stats grid (smaller column) */}
                <div className="md:col-span-5">
                  <ScrollReveal>
                    <p className="mb-8 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                      KEY METRICS
                    </p>
                  </ScrollReveal>
                  <div className="grid grid-cols-2 gap-6">
                    {venture.stats.map((stat, i) => (
                      <ScrollReveal key={stat.label} delay={0.1 + i * 0.1}>
                        <GlowBorder hoverOnly borderRadius={8} glowColor={`${venture.accent}66`}>
                          <div className="border-t border-white/10 pt-6 px-2 pb-2">
                            <AnimatedCounter
                              value={stat.value}
                              className="font-[family-name:var(--font-playfair)] text-4xl font-bold md:text-5xl"
                            />
                            <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted">
                              {stat.label}
                            </p>
                          </div>
                        </GlowBorder>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Photo Gallery Placeholder ── */}
              <div className="mt-16 md:mt-32">
                <ScrollReveal>
                  <p className="mb-10 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                    GALLERY
                  </p>
                </ScrollReveal>

                {/* Mobile: swipeable carousel */}
                <div className="md:hidden">
                  <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {venture.images.map((img, i) => (
                      <div key={i} className="shrink-0 snap-center w-[80vw]">
                        <div className={`${img.aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}>
                          <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                              <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold" style={{ color: `${venture.accent}10` }}>
                                {img.label}
                              </span>
                              <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/40">
                                PHOTO COMING SOON
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination dots */}
                  <div className="mt-4 flex justify-center gap-2">
                    {venture.images.map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    ))}
                  </div>
                </div>

                {/* Desktop: Asymmetric grid */}
                <div className="hidden md:grid gap-4 md:grid-cols-12 md:gap-6">
                  {venture.images.map((img, i) => {
                    const colSpan = i === 0 ? "md:col-span-7" : i === 1 ? "md:col-span-5" : i === venture.images.length - 1 ? "md:col-span-5" : "md:col-span-4";
                    return (
                      <ScrollReveal key={i} delay={0.05 + i * 0.1} className={colSpan}>
                        <div className={`${img.aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}>
                          <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                              <span className="font-[family-name:var(--font-playfair)] text-4xl font-bold" style={{ color: `${venture.accent}10` }}>
                                {img.label}
                              </span>
                              <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/40">
                                PHOTO COMING SOON
                              </p>
                            </div>
                          </div>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>

              {/* ── Venture divider ── */}
              {ventureIndex < ventures.length - 1 && (
                <BlobDivider color={venture.accent} className="mt-16 md:mt-32" />
              )}
            </div>
          </div>
        </section>
      ))}

      {/* ════════════════════════════════════════════
          CLOSING CTA
      ════════════════════════════════════════════ */}
      <section className="relative flex min-h-[40vh] flex-col items-center justify-center overflow-hidden bg-bg-primary px-6 py-16 md:min-h-[60vh] md:py-32">
        {/* Ghost watermark */}
        <span className="pointer-events-none absolute select-none font-[family-name:var(--font-playfair)] text-[20vw] font-bold leading-none text-ghost">
          MACC
        </span>

        <ScrollReveal className="relative z-10 text-center">
          <p className="mb-6 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
            WANT TO BUILD SOMETHING TOGETHER?
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-text-primary md:text-6xl">
            Let&apos;s <span className="italic text-accent">Talk</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <AnimatedButton href="/contact" variant="primary">
              GET IN TOUCH
            </AnimatedButton>
            <AnimatedButton href="/about" variant="outline">
              ABOUT MICHAEL &rarr;
            </AnimatedButton>
          </div>
        </ScrollReveal>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <Footer />
    </>
  );
}
