"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ScrollReveal from "@/app/components/ScrollReveal";
import AnimatedCounter from "@/app/components/AnimatedCounter";
import TextReveal from "@/app/components/TextReveal";
import GlowBorder from "@/app/components/GlowBorder";
import StaggeredGrid from "@/app/components/StaggeredGrid";
import ParallaxLayer from "@/app/components/ParallaxLayer";
import PlaceholderImage from "@/app/components/PlaceholderImage";
import SealStamp from "@/app/components/SealStamp";
import LatticePattern from "@/app/components/LatticePattern";

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

/* ─── GENERATIONAL THREAD ─── */
const generations = [
  {
    era: "1970s",
    title: "Grandmother",
    description: "Hyacinth Gloria Chen \u2014 Built SuperPlus from the ground up",
    character: "\u7956", // 祖 (ancestor)
  },
  {
    era: "1990s",
    title: "The Family",
    description: "The Chen Clan \u2014 Carried the legacy forward",
    character: "\u5BB6", // 家 (family)
  },
  {
    era: "NOW",
    title: "Mike",
    description: "Michael A.C. Chen \u2014 Building on everything",
    character: "\u5EFA", // 建 (build)
  },
];

export default function AboutClient({ portrait }: { portrait: string }) {
  return (
    <>
      <Navbar />

      {/* ════════════════════════════════════════════
          SECTION 1: HERO PORTRAIT
      ════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary px-6 pt-24 pb-16 md:pb-32 md:px-12">
        {/* Ghost text behind portrait — 陳 (Chen) */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[35vw] font-bold leading-none text-ghost"
          style={{ fontFamily: "'Noto Serif SC', 'Songti SC', 'STSong', serif" }}
        >
          陳
        </motion.span>

        {/* Portrait placeholder with parallax accent shapes */}
        <ParallaxLayer speed={0.2}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Floating accent shapes behind portrait */}
            <motion.div
              className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-accent/20"
              animate={{ y: [-5, 5, -5], rotate: [0, 180, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              aria-hidden="true"
            />
            <motion.div
              className="absolute -bottom-6 -left-6 h-16 w-16 rounded-sm border border-accent/10"
              animate={{ y: [5, -5, 5], rotate: [0, -90, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />

            {portrait ? (
              <div className="aspect-[3/4] relative w-full overflow-hidden rounded-lg bg-bg-secondary">
                <Image
                  src={portrait}
                  alt="Mike Chen lifestyle portrait"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 400px, 100vw"
                  priority
                />
              </div>
            ) : (
              <PlaceholderImage
                alt="Mike Chen lifestyle portrait"
                label="MC"
                accentColor="#E5B820"
                className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-bg-secondary"
              />
            )}
          </motion.div>
        </ParallaxLayer>

        {/* Flanking metadata */}
        <span className="absolute left-6 top-1/2 hidden -translate-y-1/2 -rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block">
          MICHAEL ANTHONY CHARLES CHEN
        </span>
        <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block">
          MANDEVILLE, JAMAICA
        </span>

        {/* Mobile flanking text */}
        <div className="absolute top-28 flex gap-4 text-center md:hidden">
          <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/60">
            MICHAEL CHEN
          </span>
          <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/60">
            MANDEVILLE, JA
          </span>
        </div>

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
      <section className="bg-bg-primary px-6 md:px-12" style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <SealStamp character="故" />
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                01 &mdash; THE STORY
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] font-bold leading-tight text-text-primary" style={{ fontSize: "var(--text-heading)" }}>
              Two Cultures, One <span className="italic text-accent">Builder.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-10 md:mt-16 space-y-8">
            <ScrollReveal delay={0.1}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                I grew up Jamaican-Chinese in Mandeville &mdash; between two cultures that
                both value family above everything and understand that hustle isn&apos;t
                something you learn, it&apos;s something you inherit. They&apos;re blended
                for me. My grandmother, Hyacinth Gloria Chen, built SuperPlus from the
                ground up. My uncles, my father, and my aunt carried it forward. I grew up
                behind the counter, bagging groceries and counting inventory before I could
                drive. That store taught me everything &mdash; retail, margins, community,
                and how to talk to anyone. There is a large sense of family duty, duty to
                the community &mdash; hustle was born into us.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                They call us the Chen clan because of how tight we are. Cousins feel like
                brothers and sisters. Uncles feel like fathers and aunts feel like moms. And
                food is what brings us together. We love our flavors. Christmas dinner,
                Sunday lunches, random Tuesday night dinners &mdash; that is how our large
                family communes. It&apos;s how we grew up. It&apos;s how we eat, how we work,
                what family means.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                I was my mom&apos;s &ldquo;handbag&rdquo; &mdash; everywhere she went, I
                went. But I&apos;m also very calm, composed. I bring people and ideas
                together, natural leader. I don&apos;t try to steal the room but sometimes
                the room comes to me. I&apos;m not the usual creative &mdash; I didn&apos;t
                grow up drawing, painting, sketching. It&apos;s how my brain works. How I
                put together a room, an outfit, what colors go together. My brain identifies
                automatically when things look off, if the font is wrong. My creative energy
                knows no bounds, it&apos;s just not the traditional kind.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                My life is a lot about music. AirPods are always on my ears. It dictates how
                I&apos;m feeling. You might see me jamming to Not Like Us by Kendrick
                straight into Monaco by Bad Bunny, then into some R&amp;B Drake, Chicago
                Freestyle cruising down the I-95. Then you might get hit with some EDM. When
                I&apos;m deep in code, anything high tempo plays. The vibe at an Istry event
                is Afrobeats, light hip hop. Family dinner is old school Jamaican music.
                Sometimes when I&apos;m driving in the Ioniq, it&apos;s Vybz Kartel and more.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                Today I&apos;m still at the heart of a couple SuperPlus locations
                day-to-day &mdash; advising, operating, keeping the legacy alive. But
                I also build my own things. I founded Istry, a bespoke food and beverage
                company. I&apos;m actively building Kemi, an AI product. I write code,
                design brands in Figma, 3D print prototypes on my BambuLab, and shoot
                with my Sony A7IV and DJI drone. I love building things, getting them to a
                point &mdash; then going on and working on the next thing. I don&apos;t have
                one lane. I have a workshop.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.35}>
              <p className="text-lg leading-relaxed text-text-primary/80">
                What drives me is making things &mdash; the moment an idea becomes
                something real that people can touch, taste, or use. I love food, I
                love technology, I love design, and I love figuring out how they all
                connect. I want to prove that world-class things can be built from
                Jamaica, not just consumed here.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 2.5: GENERATIONAL THREAD
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 md:px-12" style={{ paddingBottom: "var(--space-section)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {generations.map((gen, i) => (
              <ScrollReveal key={gen.era} delay={i * 0.15}>
                <div className="relative border-l-2 border-accent-secondary/40 pl-6 py-4">
                  <SealStamp character={gen.character} className="mb-4" />
                  <span className="block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-accent-secondary">
                    {gen.era}
                  </span>
                  <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-bold text-text-primary">
                    {gen.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-primary/60">
                    {gen.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3: BY THE NUMBERS
      ════════════════════════════════════════════ */}
      <section className="bg-bg-secondary px-6 md:px-12" style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <SealStamp character="數" />
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                02 &mdash; BY THE NUMBERS
              </span>
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] font-bold leading-tight" style={{ fontSize: "var(--text-heading)" }}>
              The <span className="italic text-accent">Stats.</span>
            </h2>
          </ScrollReveal>

          <StaggeredGrid columns={5} className="mt-12 md:mt-20 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-12">
            {stats.map((stat) => (
              <GlowBorder key={stat.label} hoverOnly borderRadius={12}>
                <div className="glass-card flex flex-col gap-3 rounded-lg p-5 card-hover">
                  <AnimatedCounter
                    value={stat.value}
                    className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-accent md:text-5xl"
                  />
                  <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted">
                    {stat.label}
                  </span>
                </div>
              </GlowBorder>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4: NOW
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 md:px-12" style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <SealStamp character="今" />
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                03 &mdash; NOW
              </span>
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] font-bold leading-tight" style={{ fontSize: "var(--text-heading)" }}>
              What I&apos;m Doing
              <br />
              <span className="italic text-accent">Right Now.</span>
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.15em] text-text-muted">
                LAST UPDATED: FEB 2026
              </span>
            </div>
          </ScrollReveal>

          <div className="mt-10 md:mt-16 space-y-0 divide-y divide-white/5">
            {nowItems.map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 0.08}>
                <div className="flex flex-col gap-2 rounded-lg py-6 px-4 transition-all hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:gap-8">
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
      <section className="relative overflow-hidden bg-bg-secondary px-6 md:px-12" style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
        {/* Heritage lattice pattern replaces coordinate grid */}
        <LatticePattern />

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center text-center">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <SealStamp character="根" />
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                04 &mdash; BASED IN
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mt-8 font-[family-name:var(--font-playfair)] font-bold leading-tight text-text-primary" style={{ fontSize: "var(--text-display)" }}>
              MANDEVILLE,
              <br />
              <span className="italic text-accent">JAMAICA</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="mt-6 flex items-center gap-3">
              {/* Pulsing pin */}
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
              </span>
              <p className="font-[family-name:var(--font-jetbrains)] text-sm tracking-[0.1em] text-text-muted">
                18.0416&deg; N, 77.5058&deg; W
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 6: TOOLS I USE
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 md:px-12" style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <SealStamp character="器" />
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                05 &mdash; TOOLKIT
              </span>
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] font-bold leading-tight" style={{ fontSize: "var(--text-heading)" }}>
              Tools I <span className="italic text-accent">Use.</span>
            </h2>
          </ScrollReveal>

          <StaggeredGrid columns={4} className="mt-12 md:mt-20 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {toolCategories.map((cat) => (
              <GlowBorder key={cat.category} hoverOnly borderRadius={12}>
                <div className="glass-card flex flex-col gap-5 rounded-lg p-5 card-hover">
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
              </GlowBorder>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <Footer />
    </>
  );
}
