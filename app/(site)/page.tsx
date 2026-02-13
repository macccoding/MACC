"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import RotatingText from "../components/RotatingText";
import HeroCursorTilt from "../components/HeroCursorTilt";
import SplitReveal from "../components/SplitReveal";

/* ─── DISCIPLINES ─── */
const disciplines = [
  { num: "01", label: "Entrepreneur" },
  { num: "02", label: "Food & Beverage" },
  { num: "03", label: "Technology" },
  { num: "04", label: "Cars" },
  { num: "05", label: "Photography" },
  { num: "06", label: "Fitness" },
];

/* ─── VENTURES ─── */
const ventures = [
  {
    num: "01",
    name: "ISTRY",
    meta: "FOUNDER \u00b7 BESPOKE F&B",
    tags: ["FOOD & BEVERAGE", "WHITELABELING", "EVENTS", "CATERING"],
    description:
      "Bespoke food & beverage company specializing in whitelabel products, event catering, and culinary experiences. Building Jamaica\u2019s next great food brand.",
    color: "#E5B820",
  },
  {
    num: "02",
    name: "SUPERPLUS",
    meta: "LEGACY \u00b7 COMMUNITY RETAIL",
    tags: ["RETAIL", "COMMUNITY", "GROCERY", "FAMILY"],
    description:
      "A family supermarket legacy built by my grandmother, Hyacinth Gloria Chen. I\u2019m at the heart of operations day-to-day \u2014 keeping the family business alive and evolving.",
    color: "#C41E3A",
  },
  {
    num: "03",
    name: "KEMI",
    meta: "FOUNDER \u00b7 ACTIVELY BUILDING",
    tags: ["ARTIFICIAL INTELLIGENCE", "PRODUCTIVITY", "PRODUCT"],
    description:
      "An AI product I\u2019m actively building. Code, design, and ship \u2014 from Kingston to the world.",
    color: "#E5B820",
  },
  {
    num: "04",
    name: "CARICOM FREIGHT",
    meta: "FAMILY \u00b7 LOGISTICS",
    tags: ["FREIGHT", "LOGISTICS", "SHIPPING"],
    description:
      "Family freight and logistics business. Caribbean shipping infrastructure that keeps goods moving across the islands.",
    color: "#C41E3A",
  },
];

/* ─── JOURNAL PREVIEW ─── */
const journalPosts = [
  {
    num: "01",
    title: "Why I\u2019m Building a Personal Site in 2026",
    date: "FEB 2026",
    category: "BUILDING",
    slug: "why-im-building-a-personal-site",
  },
  {
    num: "02",
    title: "The Tech Stack Behind My Businesses",
    date: "FEB 2026",
    category: "TECH",
    slug: "the-tech-stack-behind-my-businesses",
  },
  {
    num: "03",
    title: "Food at the Intersection of Jamaica and China",
    date: "FEB 2026",
    category: "FOOD",
    slug: "food-at-the-intersection-of-jamaica-and-china",
  },
];

/* ─── GALLERY PREVIEW ─── */
const galleryItems = Array.from({ length: 10 }, (_, i) => ({
  num: String(i + 1).padStart(2, "0"),
  category: ["FOOD", "TRAVEL", "GADGETS", "STREET", "PORTRAITS", "FOOD", "TRAVEL", "DRONE", "LIFESTYLE", "MAKING"][i],
}));

export default function Home() {
  const heroRef = useRef(null);
  const venturesSectionRef = useRef<HTMLElement>(null);
  const [venturesVisible, setVenturesVisible] = useState(false);
  const [activeVenture, setActiveVenture] = useState("01");

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  // Track ventures section visibility
  useEffect(() => {
    const section = venturesSectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVenturesVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Track active venture based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      for (let i = ventures.length - 1; i >= 0; i--) {
        const el = document.getElementById(`venture-${ventures[i].num}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveVenture(ventures[i].num);
            return;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Navbar />

      {/* ════════════════════════════════════════════
          SECTION 1: HERO
      ════════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-bg-primary"
      >
        {/* Flanking Text — Left */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute left-6 top-1/2 hidden -translate-y-1/2 -rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block"
        >
          A COLLECTION OF VENTURES &amp; VISIONS
        </motion.span>

        {/* Flanking Text — Right */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block"
        >
          MICHAEL CHEN 2026
        </motion.span>

        {/* Hero Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <HeroCursorTilt>
            {/* Radial glow halo */}
            <div
              className="absolute inset-0 -m-16 rounded-full bg-[radial-gradient(circle,rgba(229,184,32,0.08)_0%,transparent_70%)]"
              style={{ animation: "pulse-glow 4s ease-in-out infinite" }}
            />
            <Image
              src="/images/macc-logo.png"
              alt="MACC Logo — Chinese Chop Stamp"
              width={320}
              height={320}
              priority
              className="relative h-auto w-[160px] drop-shadow-[0_0_80px_rgba(229,184,32,0.25)] sm:w-[200px] md:w-[320px]"
            />
          </HeroCursorTilt>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="-mt-4 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-text-muted md:-mt-6"
        >
          Building things. Tasting everything. Designing the rest.
        </motion.p>

        {/* Scroll Indicator */}
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
          SECTION 2: NAME REVEAL
      ════════════════════════════════════════════ */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-accent px-6 py-16 md:min-h-screen md:py-24">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <h1 className="text-center font-[family-name:var(--font-playfair)] text-[18vw] font-bold leading-[0.85] text-bg-primary md:text-[22vw]">
            MIKE
            <br />
            CHEN
          </h1>
        </motion.div>

        {/* Numbered Disciplines */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 md:mt-16 md:gap-x-10 md:gap-y-4">
          {disciplines.map((d, i) => (
            <motion.span
              key={d.num}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="font-[family-name:var(--font-playfair)] text-sm text-bg-primary/70 md:text-base"
            >
              <span className="font-[family-name:var(--font-jetbrains)] text-xs text-bg-primary/40">
                {d.num}
              </span>{" "}
              {d.label}
            </motion.span>
          ))}
        </div>

        {/* Video Embed Placeholder */}
        <ScrollReveal delay={0.5} className="mt-12 w-full max-w-4xl md:mt-20">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-bg-primary/20">
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-bg-primary/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="ml-1">
                    <path d="M8 5v14l11-7L8 5z" fill="#0A0A0A" fillOpacity="0.5" />
                  </svg>
                </div>
                <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-bg-primary/40">
                  SIZZLE REEL COMING SOON
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3: ABOUT CARD
      ════════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center bg-bg-primary px-6 py-20 md:py-32">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-accent px-[clamp(2.5rem,8vw,7rem)] py-[clamp(2.5rem,6vw,5rem)] text-bg-primary shadow-[0_0_80px_rgba(229,184,32,0.12)]">
            {/* Name + Rotating Role */}
            <p className="font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
              Mike Chen
            </p>
            <p className="mt-2 font-[family-name:var(--font-playfair)] text-lg text-bg-primary/60">
              does
            </p>
            <div className="mt-1 h-10 font-[family-name:var(--font-playfair)] text-2xl font-bold italic md:text-3xl">
              <RotatingText
                words={[
                  "entrepreneur",
                  "builder",
                  "coder",
                  "designer",
                  "foodie",
                ]}
                interval={2200}
              />
            </div>

            {/* Bio */}
            <p className="mt-8 max-w-lg font-[family-name:var(--font-jetbrains)] text-[11px] uppercase leading-relaxed tracking-wide text-bg-primary/70">
              I&apos;m a Jamaican-Chinese entrepreneur who builds things &mdash;
              businesses, brands, code, and whatever else I can get my hands on.
              Founder of Istry. Keeping SuperPlus alive as a family legacy.
              Actively building Kemi. I design, I ship, and I eat everything.
              Based in Kingston.
            </p>

            {/* Location */}
            <div className="mt-10 border-t border-bg-primary/20 pt-6">
              <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-bg-primary/40">
                CURRENTLY BASED IN
              </span>
              <p className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-bold">
                Kingston, Jamaica
              </p>
              <p className="mt-1 font-[family-name:var(--font-jetbrains)] text-xs text-bg-primary/50">
                18.0179&deg; N, 76.8099&deg; W
              </p>
            </div>

            {/* Read More */}
            <Link
              href="/about"
              className="group mt-8 inline-flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-bg-primary/70 transition-colors hover:text-bg-primary"
            >
              READ MORE <span className="inline-block transition-transform group-hover:translate-x-2">&rarr;</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4: FEATURED VENTURES
      ════════════════════════════════════════════ */}

      {/* Sticky Ventures Nav — only visible when ventures section is in view */}
      <div
        className={`sticky top-0 z-40 border-b border-white/5 bg-bg-secondary/80 backdrop-blur-lg transition-all duration-300 ${
          venturesVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 overflow-x-auto px-6 py-4 scrollbar-hide md:gap-8 md:px-12">
          {ventures.map((v) => (
            <a
              key={v.num}
              href={`#venture-${v.num}`}
              className={`shrink-0 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] transition-colors hover:text-accent ${
                activeVenture === v.num ? "text-accent" : "text-text-muted"
              }`}
            >
              {v.name}
            </a>
          ))}
          <span className="hidden text-white/10 md:inline">·</span>
          <Link
            href="/ventures"
            className="group shrink-0 inline-flex items-center gap-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted transition-colors hover:text-accent"
          >
            SEE ALL <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>
      </div>

      <section ref={venturesSectionRef} className="bg-bg-secondary px-6 py-16 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <ScrollReveal>
            <div className="mb-12 flex flex-col gap-4 border-b border-white/10 pb-6 md:mb-20 md:flex-row md:items-end md:justify-between">
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-6xl">
                <SplitReveal text="Featured" />
                <br />
                <span className="italic text-accent"><SplitReveal text="Ventures" delay={0.15} /></span>
              </h2>
              <Link
                href="/ventures"
                className="group inline-flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent"
              >
                SEE ALL VENTURES <span className="inline-block transition-transform group-hover:translate-x-2">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>

          {/* Ventures List */}
          <div>
            {ventures.map((venture, i) => (
              <div key={venture.num} id={`venture-${venture.num}`} className="scroll-mt-20">
                {i > 0 && (
                  <div className="border-t border-dashed border-white/10 my-10 md:my-16" />
                )}
              <ScrollReveal delay={0.1}>
                <div className="grid gap-8 md:grid-cols-2 md:gap-16">
                  {/* Left: Info */}
                  <div className={`flex flex-col justify-center ${i % 2 === 1 ? "md:order-2" : ""}`}>
                    <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                      FEATURED VENTURE {venture.num}
                    </span>
                    <h3
                      className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold md:text-5xl"
                      style={{ color: venture.color }}
                    >
                      {venture.name}
                    </h3>
                    <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted">
                      {venture.meta}
                    </p>
                    <p className="mt-6 text-lg leading-relaxed text-text-primary/80">
                      {venture.description}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {venture.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-3 py-1 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-wider text-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/ventures"
                      className="group mt-8 inline-flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-accent transition-opacity hover:opacity-70"
                    >
                      VIEW VENTURE <span className="inline-block transition-transform group-hover:translate-x-2">&rarr;</span>
                    </Link>
                  </div>

                  {/* Right: Image Placeholder */}
                  <div className={`${i % 2 === 1 ? "md:order-1" : ""}`}>
                    <HeroCursorTilt>
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-bg-primary transition-shadow duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                        <div
                          className="flex h-full items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${venture.color}08 0%, transparent 50%, ${venture.color}05 100%)`,
                          }}
                        >
                          <span
                            className="font-[family-name:var(--font-playfair)] text-6xl font-bold opacity-10"
                            style={{ color: venture.color }}
                          >
                            {venture.num}
                          </span>
                        </div>
                      </div>
                    </HeroCursorTilt>
                  </div>
                </div>
              </ScrollReveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 5: LATEST FROM THE JOURNAL
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 py-16 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-10 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-6xl">
                <SplitReveal text="Latest" /> <span className="italic text-accent"><SplitReveal text="Posts" delay={0.1} /></span>
              </h2>
              <Link
                href="/journal"
                className="group inline-flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent"
              >
                VIEW ALL <span className="inline-block transition-transform group-hover:translate-x-2">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>

          <div className="space-y-0 divide-y divide-white/5">
            {journalPosts.map((post, i) => (
              <ScrollReveal key={post.num} delay={i * 0.1}>
                <Link href={`/journal/${post.slug}`} className="group block py-8 transition-colors hover:bg-[#141414]">
                  <div className="flex items-start gap-6">
                    <span className="font-[family-name:var(--font-jetbrains)] text-sm text-text-muted/40">
                      {post.num}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold transition-colors group-hover:text-accent md:text-2xl">
                        {post.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                          {post.date}
                        </span>
                        <span className="rounded-full border border-accent/30 px-3 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-wider text-accent">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <span className="inline-block font-[family-name:var(--font-jetbrains)] text-sm text-text-muted/30 transition-all group-hover:translate-x-2 group-hover:text-accent">
                      &rarr;
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 6: ARCHIVE / GALLERY PREVIEW
      ════════════════════════════════════════════ */}
      <section className="bg-bg-secondary px-6 py-16 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-10 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-6xl">
                <SplitReveal text="Archive" />
              </h2>
              <Link
                href="/gallery"
                className="group inline-flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent"
              >
                SEE ALL <span className="inline-block transition-transform group-hover:translate-x-2">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>

          {/* Horizontal Scroll */}
          <div className="scrollbar-hide flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4">
            {galleryItems.map((item, i) => (
              <ScrollReveal key={item.num} delay={i * 0.05} className="shrink-0 snap-start">
                <Link href="/gallery" className="group relative block">
                  <div className="aspect-square min-w-[200px] md:min-w-[240px] overflow-hidden rounded-lg bg-bg-primary transition-all duration-300 group-hover:ring-2 group-hover:ring-accent/50 group-hover:scale-105">
                    <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
                      <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-white/5 transition-colors group-hover:text-accent/20">
                        {item.num}
                      </span>
                      <span className="font-[family-name:var(--font-jetbrains)] text-[8px] uppercase tracking-[0.15em] text-text-muted/40 transition-colors group-hover:text-text-muted">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 7: FOOTER
      ════════════════════════════════════════════ */}
      <Footer />
    </>
  );
}
