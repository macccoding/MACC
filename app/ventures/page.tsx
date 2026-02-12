"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

/* ─── VENTURE DATA ─── */
const ventures = [
  {
    num: "01",
    name: "Istry",
    role: "Founder",
    year: "2023",
    tagline: "Bespoke food & beverage. Whitelabeling. Events.",
    tags: ["FOOD & BEVERAGE", "WHITELABELING", "EVENTS", "CATERING"],
    accent: "#D4A843",
    description: [
      "Istry is a bespoke food and beverage company born from the belief that Jamaica deserves world-class culinary experiences wrapped in homegrown identity. We create whitelabel products, cater events, and develop original brands that sit at the intersection of Caribbean flavor and global ambition.",
      "Every product we develop, every event we cater, carries the same philosophy: quality without compromise, flavor without apology.",
      "What started as a side project has grown into a full-service operation with a growing client roster and a pipeline of products hitting shelves across Jamaica. We are just getting started.",
    ],
    stats: [
      { value: "2023", label: "YEAR FOUNDED" },
      { value: "JA", label: "BORN & BASED" },
      { value: "F&B", label: "INDUSTRY" },
      { value: "MINE", label: "BUILT FROM SCRATCH" },
    ],
    images: [
      { aspect: "aspect-[4/5]", label: "KITCHEN" },
      { aspect: "aspect-[3/2]", label: "EVENT SETUP" },
      { aspect: "aspect-[1/1]", label: "PRODUCT LINE" },
      { aspect: "aspect-[3/4]", label: "CATERING" },
      { aspect: "aspect-[16/9]", label: "TEAM" },
    ],
    link: "#",
    linkLabel: "VISIT ISTRY",
  },
  {
    num: "02",
    name: "SuperPlus",
    role: "Legacy",
    year: "EST.",
    tagline: "Family supermarket. Built by my grandmother. Kept alive by us.",
    tags: ["RETAIL", "COMMUNITY", "GROCERY", "FAMILY LEGACY"],
    accent: "#2D8C4E",
    description: [
      "SuperPlus was built from the ground up by my grandmother, Hyacinth Gloria Chen. It was then carried forward by my uncles, my father, and my aunt. Today I\u2019m at the heart of a couple of the stores day-to-day \u2014 operating, advising, and keeping the family legacy alive.",
      "Running a community store in Jamaica is an education in patience, relationships, and resilience. Every shelf stocked, every credit extended to a neighbor who promises to pay Friday \u2014 it all adds up to something bigger than commerce. It is trust, built daily.",
      "This is where I learned everything. Retail, margins, community, and how to talk to anyone. SuperPlus isn\u2019t just a business \u2014 it\u2019s where I come from.",
    ],
    stats: [
      { value: "3", label: "GENERATIONS DEEP" },
      { value: "DAILY", label: "I\u2019M THERE" },
      { value: "ROOTS", label: "WHERE I STARTED" },
      { value: "LEGACY", label: "WHAT IT MEANS" },
    ],
    images: [
      { aspect: "aspect-[16/9]", label: "STOREFRONT" },
      { aspect: "aspect-[1/1]", label: "AISLES" },
      { aspect: "aspect-[4/5]", label: "THE COUNTER" },
      { aspect: "aspect-[3/2]", label: "COMMUNITY" },
    ],
    link: "#",
    linkLabel: "THE LEGACY",
  },
  {
    num: "03",
    name: "Kemi",
    role: "Founder",
    year: "2025",
    tagline: "AI product. Actively building.",
    tags: ["AI", "PRODUCT", "CODE", "DESIGN"],
    accent: "#D4A843",
    description: [
      "Kemi is an AI product I\u2019m actively building \u2014 from concept to code to design to ship. It\u2019s born from running multiple businesses and realizing the tools I needed didn\u2019t exist, so I\u2019m making them.",
      "Built with Next.js, designed in Figma, and shipping from Kingston. This is the intersection of everything I care about: technology, design, and solving real problems.",
      "Currently in active development. More to come.",
    ],
    stats: [
      { value: "AI", label: "POWERED" },
      { value: "1", label: "BUILDER" },
      { value: "2025", label: "IN PROGRESS" },
      { value: "\u221E", label: "ITERATIONS" },
    ],
    images: [
      { aspect: "aspect-[3/2]", label: "UI CONCEPT" },
      { aspect: "aspect-[1/1]", label: "LOGO MARK" },
      { aspect: "aspect-[4/5]", label: "INTERFACE" },
    ],
    link: "#",
    linkLabel: "STAY TUNED",
  },
  {
    num: "04",
    name: "Caricom Freight",
    role: "Family",
    year: "EST.",
    tagline: "Family freight & logistics. Keeping goods moving across the Caribbean.",
    tags: ["FREIGHT", "LOGISTICS", "SHIPPING", "CARIBBEAN"],
    accent: "#2D8C4E",
    description: [
      "Caricom Freight is the family logistics business. Caribbean shipping infrastructure that keeps goods moving across the islands.",
      "This is my father\u2019s world \u2014 the logistics backbone that supports everything from retail inventory to commercial freight. Being close to this operation gives me a perspective on supply chain and trade that most tech people never get.",
    ],
    stats: [
      { value: "JA", label: "BASED" },
      { value: "CARIB", label: "COVERAGE" },
      { value: "FAMILY", label: "OPERATED" },
      { value: "EST.", label: "GENERATION" },
    ],
    images: [
      { aspect: "aspect-[16/9]", label: "OPERATIONS" },
      { aspect: "aspect-[1/1]", label: "LOGISTICS" },
      { aspect: "aspect-[3/2]", label: "FLEET" },
    ],
    link: "#",
    linkLabel: "CARICOM FREIGHT",
  },
];

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
          KINGSTON, JAMAICA 2026
        </span>

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
          <h1 className="font-[family-name:var(--font-playfair)] text-[14vw] font-bold leading-[0.85] text-text-primary md:text-[10vw]">
            Ventures
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
          <ScrollReveal>
            <div className="relative h-[60vh] w-full overflow-hidden md:h-[80vh]">
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
                  HERO IMAGE PLACEHOLDER
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
          </ScrollReveal>

          {/* ── VENTURE CONTENT ── */}
          <div className="relative px-6 pb-32 pt-8 md:px-12 lg:px-24">
            <div className="mx-auto max-w-7xl">
              {/* Number + Name */}
              <div className="mb-16 md:mb-24">
                <ScrollReveal>
                  <div className="flex items-start gap-6 md:gap-10">
                    {/* Big number */}
                    <span
                      className="font-[family-name:var(--font-playfair)] text-[8rem] font-bold leading-none md:text-[12rem] lg:text-[16rem]"
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
                      {venture.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-3 py-1 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-wider text-text-muted transition-colors hover:border-white/20 hover:text-text-primary"
                        >
                          {tag}
                        </span>
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
                  {venture.description.map((para, i) => (
                    <ScrollReveal key={i} delay={0.15 + i * 0.1}>
                      <p className="mt-6 text-base leading-[1.8] text-text-primary/75 md:text-lg">
                        {para}
                      </p>
                    </ScrollReveal>
                  ))}

                  {/* CTA link */}
                  <ScrollReveal delay={0.4}>
                    <a
                      href={venture.link}
                      className="mt-10 inline-flex items-center gap-3 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] transition-colors hover:opacity-70"
                      style={{ color: venture.accent }}
                    >
                      {venture.linkLabel}
                      <span>&rarr;</span>
                    </a>
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
                        <div className="border-t border-white/10 pt-6">
                          <span
                            className="font-[family-name:var(--font-playfair)] text-4xl font-bold md:text-5xl"
                            style={{ color: venture.accent }}
                          >
                            {stat.value}
                          </span>
                          <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted">
                            {stat.label}
                          </p>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Photo Gallery Placeholder (Asymmetric) ── */}
              <div className="mt-24 md:mt-32">
                <ScrollReveal>
                  <p className="mb-10 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                    GALLERY
                  </p>
                </ScrollReveal>

                {/* Asymmetric image grid */}
                {venture.images.length === 5 ? (
                  <div className="grid gap-4 md:grid-cols-12 md:gap-6">
                    {/* Row 1: 2 images */}
                    <ScrollReveal
                      delay={0.05}
                      className="md:col-span-7"
                    >
                      <div
                        className={`${venture.images[0].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-5xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[0].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                    <ScrollReveal
                      delay={0.15}
                      className="md:col-span-5"
                    >
                      <div
                        className={`${venture.images[1].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-5xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[1].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>

                    {/* Row 2: 3 images */}
                    <ScrollReveal
                      delay={0.1}
                      className="md:col-span-4"
                    >
                      <div
                        className={`${venture.images[2].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-4xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[2].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                    <ScrollReveal
                      delay={0.2}
                      className="md:col-span-3"
                    >
                      <div
                        className={`${venture.images[3].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-3xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[3].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                    <ScrollReveal
                      delay={0.25}
                      className="md:col-span-5"
                    >
                      <div
                        className={`${venture.images[4].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-4xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[4].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>
                ) : venture.images.length === 4 ? (
                  <div className="grid gap-4 md:grid-cols-12 md:gap-6">
                    {/* Row 1: 1 wide image */}
                    <ScrollReveal
                      delay={0.05}
                      className="md:col-span-8"
                    >
                      <div
                        className={`${venture.images[0].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-5xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[0].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                    <ScrollReveal
                      delay={0.15}
                      className="md:col-span-4"
                    >
                      <div
                        className={`${venture.images[1].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-4xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[1].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>

                    {/* Row 2: 2 images */}
                    <ScrollReveal
                      delay={0.1}
                      className="md:col-span-5"
                    >
                      <div
                        className={`${venture.images[2].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-4xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[2].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                    <ScrollReveal
                      delay={0.2}
                      className="md:col-span-7"
                    >
                      <div
                        className={`${venture.images[3].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-4xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[3].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>
                ) : (
                  /* 3 images (Kemi) */
                  <div className="grid gap-4 md:grid-cols-12 md:gap-6">
                    <ScrollReveal
                      delay={0.05}
                      className="md:col-span-6"
                    >
                      <div
                        className={`${venture.images[0].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-5xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[0].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                    <ScrollReveal
                      delay={0.15}
                      className="md:col-span-3"
                    >
                      <div
                        className={`${venture.images[1].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-3xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[1].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                    <ScrollReveal
                      delay={0.2}
                      className="md:col-span-3"
                    >
                      <div
                        className={`${venture.images[2].aspect} w-full overflow-hidden rounded-lg bg-white/[0.03]`}
                      >
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <span
                              className="font-[family-name:var(--font-playfair)] text-3xl font-bold"
                              style={{ color: `${venture.accent}10` }}
                            >
                              {venture.images[2].label}
                            </span>
                            <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/30">
                              IMAGE PLACEHOLDER
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>
                )}
              </div>

              {/* ── Venture divider ── */}
              {ventureIndex < ventures.length - 1 && (
                <ScrollReveal>
                  <div className="mt-32 flex items-center gap-6">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted/30">
                      NEXT VENTURE
                    </span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                </ScrollReveal>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* ════════════════════════════════════════════
          CLOSING CTA
      ════════════════════════════════════════════ */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden bg-bg-primary px-6 py-32">
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
            <Link
              href="/contact"
              className="inline-block rounded-full border border-accent bg-accent px-8 py-3 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-bg-primary transition-all hover:bg-transparent hover:text-accent"
            >
              GET IN TOUCH
            </Link>
            <Link
              href="/about"
              className="inline-block font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent"
            >
              ABOUT MICHAEL &rarr;
            </Link>
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
