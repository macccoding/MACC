"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedCounter from "../components/AnimatedCounter";

/* ─── STATS ─── */
const stats = [
  { label: "VENTURES ACTIVE", value: "3" },
  { label: "CUPS OF COFFEE/DAY", value: "4+" },
  { label: "3D PRINTS MADE", value: "TOO MANY" },
  { label: "COUNTRIES VISITED", value: "NOT ENOUGH" },
  { label: "PHOTOS TAKEN", value: "JUST ENOUGH" },
];

/* ─── NOW ─── */
const nowItems = [
  { label: "CURRENTLY BUILDING", value: "Kemi" },
  { label: "CURRENTLY DRIVING", value: "Hyundai IONIQ 5" },
  { label: "CURRENTLY EATING", value: "Pak Jam Gai" },
  { label: "CURRENTLY READING", value: "Ogilvy on Advertising" },
  { label: "CURRENTLY WATCHING", value: "Anything on YouTube" },
];

/* ─── TOOLS ─── */
const toolCategories = [
  { category: "CODE", tools: ["iTerm", "Next.js", "Tailwind", "Vercel"] },
  { category: "BUSINESS", tools: ["Notion", "QuickBooks", "Square POS"] },
  { category: "CREATIVE", tools: ["Sony A7IV", "DJI", "BambuLab", "Figma"] },
  { category: "DAILY", tools: ["MacBook", "AirPods", "IONIQ 5"] },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* ════════════════════════════════════════════
          SECTION 1: HERO PORTRAIT
      ════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary px-6 pt-24 pb-32 md:px-12">
        {/* Ghost text behind portrait */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-[family-name:var(--font-playfair)] text-[25vw] font-bold leading-none text-ghost"
        >
          ABOUT
        </motion.span>

        {/* Portrait placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-bg-secondary">
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <span className="font-[family-name:var(--font-playfair)] text-8xl font-bold text-white/5">
                MC
              </span>
              <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted/50">
                LIFESTYLE PORTRAIT COMING SOON
              </span>
            </div>
          </div>
        </motion.div>

        {/* Flanking metadata */}
        <span className="absolute left-6 top-1/2 hidden -translate-y-1/2 -rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block">
          MICHAEL ANTHONY CHARLES CHEN
        </span>
        <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block">
          KINGSTON, JAMAICA
        </span>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 flex flex-col items-center gap-3"
        >
          <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
            THE STORY
          </span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="text-text-muted"
          >
            &darr;
          </motion.span>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 2: THE STORY
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 py-32 md:px-12">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
              01 &mdash; THE STORY
            </span>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight md:text-7xl">
              Two Cultures,
              <br />
              <span className="italic text-accent">One Builder.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-16 space-y-8">
            <ScrollReveal delay={0.1}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                I grew up Jamaican-Chinese in Kingston &mdash; between two cultures that
                both value family above everything and understand that hustle isn&apos;t
                something you learn, it&apos;s something you inherit. My grandmother,
                Hyacinth Gloria Chen, built SuperPlus from the ground up. My uncles,
                my father, and my aunt carried it forward. I grew up behind the counter,
                bagging groceries and counting inventory before I could drive. That store
                taught me everything &mdash; retail, margins, community, and how to talk
                to anyone.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                Today I&apos;m still at the heart of a couple SuperPlus locations
                day-to-day &mdash; advising, operating, keeping the legacy alive. But
                I also build my own things. I founded Istry, a bespoke food and beverage
                company. I&apos;m actively building Kemi, an AI product. I write code,
                design brands in Figma, 3D print prototypes on my BambuLab, and shoot
                with my Sony A7IV and DJI drone. I don&apos;t have one lane &mdash; I
                have a workshop.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                What drives me is making things &mdash; the moment an idea becomes
                something real that people can touch, taste, or use. I love food, I
                love technology, I love design, and I love figuring out how they all
                connect. I want to prove that world-class things can be built from
                Kingston, not just consumed here.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3: BY THE NUMBERS
      ════════════════════════════════════════════ */}
      <section className="bg-bg-secondary px-6 py-32 md:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
              02 &mdash; BY THE NUMBERS
            </span>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight md:text-7xl">
              The <span className="italic text-accent">Stats.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-12">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className="flex flex-col gap-3">
                  <AnimatedCounter
                    value={stat.value}
                    className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-accent md:text-5xl"
                  />
                  <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted">
                    {stat.label}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4: NOW
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 py-32 md:px-12">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
              03 &mdash; NOW
            </span>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight md:text-7xl">
              What I&apos;m Doing
              <br />
              <span className="italic text-accent">Right Now.</span>
            </h2>
            <p className="mt-4 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.15em] text-text-muted">
              LAST UPDATED: FEB 2026
            </p>
          </ScrollReveal>

          <div className="mt-16 space-y-0 divide-y divide-white/5">
            {nowItems.map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 0.08}>
                <div className="flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                  <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    {item.label}
                  </span>
                  <span className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-text-primary md:text-2xl">
                    {item.value}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 5: LOCATION BLOCK
      ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-bg-secondary px-6 py-32 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center text-center">
          <ScrollReveal>
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
              04 &mdash; BASED IN
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mt-8 font-[family-name:var(--font-playfair)] text-6xl font-bold leading-tight text-text-primary md:text-8xl lg:text-9xl">
              KINGSTON,
              <br />
              <span className="italic text-accent">JAMAICA</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mt-6 font-[family-name:var(--font-jetbrains)] text-sm tracking-[0.1em] text-text-muted">
              18.0179&deg; N, 76.8099&deg; W
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 6: TOOLS I USE
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 py-32 md:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
              05 &mdash; TOOLKIT
            </span>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight md:text-7xl">
              Tools I <span className="italic text-accent">Use.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-20 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {toolCategories.map((cat, i) => (
              <ScrollReveal key={cat.category} delay={i * 0.1}>
                <div className="flex flex-col gap-5">
                  <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-accent">
                    {cat.category}
                  </span>
                  <div className="space-y-3">
                    {cat.tools.map((tool) => (
                      <div
                        key={tool}
                        className="border-b border-white/5 pb-3"
                      >
                        <span className="text-base text-text-primary/80">
                          {tool}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <Footer />
    </>
  );
}
