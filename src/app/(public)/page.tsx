"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrollTextReveal } from "@/components/ink/ScrollTextReveal";
import { StoryImage } from "@/components/ink/StoryImage";
import { CloudPattern } from "@/components/ink/CloudPattern";
import { InkSplatter } from "@/components/ink/InkSplatter";
import { WavePattern } from "@/components/ink/WavePattern";
import { InkSpillTransition } from "@/components/gl/InkSpillTransition";
import { AtmosphericParticles } from "@/components/gl/AtmosphericParticles";

/* ============================================================
   FLOATING OBJECTS — scattered interests that drift into view
   ============================================================ */

const FLOATING_OBJECTS = [
  {
    src: "/images/obj-camera.png",
    alt: "Photography — Sony A7IV",
    style: "top-[2%] left-[3%] w-28 md:w-40 -rotate-12",
    delay: 0,
  },
  {
    src: "/images/obj-storefront.png",
    alt: "SuperPlus — Santa Cruz, Jamaica",
    style: "top-[8%] right-[2%] w-36 md:w-52 rotate-3",
    delay: 0.1,
  },
  {
    src: "/images/obj-code.png",
    alt: "Code — building digital things",
    style: "top-[38%] left-[1%] w-24 md:w-32 -rotate-6",
    delay: 0.15,
  },
  {
    src: "/images/obj-coffee.png",
    alt: "Coffee — daily ritual",
    style: "top-[42%] right-[3%] w-24 md:w-32 rotate-6",
    delay: 0.2,
  },
  {
    src: "/images/obj-passport.png",
    alt: "Travel — 37+ countries",
    style: "top-[72%] left-[5%] w-28 md:w-36 -rotate-3",
    delay: 0.25,
  },
  {
    src: "/images/obj-3dprint.png",
    alt: "3D Printing — BambuLab maker",
    style: "top-[76%] right-[6%] w-24 md:w-32 rotate-8",
    delay: 0.3,
  },
];

/* ============================================================
   MAIN PAGE — "The Path Isn't Straight"
   A scroll-driven story in five acts
   ============================================================ */

export default function Home() {
  /* Hero parallax */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(heroScroll, [0, 1], [0, -120]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  return (
    <main className="relative overflow-x-hidden">
      {/* ================================================================
          HERO — "The Path Isn't Straight"
          ================================================================ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        <CloudPattern position="top-right" opacity={0.04} className="z-0" />

        <motion.div
          className="relative z-10 flex flex-col items-center w-full px-6"
          style={{ opacity: heroOpacity }}
        >
          {/* Title brush calligraphy */}
          <motion.img
            src="/images/text-title.png"
            alt="The Path Isn't Straight"
            loading="eager"
            className="w-[85vw] max-w-2xl h-auto mix-blend-multiply"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Subtitle */}
          <motion.p
            className="font-mono text-sumi-gray tracking-[0.2em] uppercase mt-6"
            style={{ fontSize: "var(--text-micro)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.6, duration: 1 }}
          >
            Mike Chen
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="mt-20 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 2.4, duration: 1 }}
          >
            <motion.div
              className="w-[1px] h-12 bg-ink-black/20"
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "top" }}
            />
          </motion.div>
        </motion.div>

        {/* Hero wanderer — peeks up from below */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none"
          style={{ y: heroImgY }}
        >
          <motion.img
            src="/images/hero-wanderer.png"
            alt="A wanderer at the base of a winding mountain path"
            loading="eager"
            className="w-[90vw] max-w-5xl h-auto mix-blend-multiply translate-y-[30%]"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      </section>

      {/* ================================================================
          ACT 1 — THE ORIGIN
          "Where I started. Small island. Big appetite."
          ================================================================ */}
      <section className="relative z-10">
        <AtmosphericParticles mode="parchment" count={40} className="z-0" />
        <div className="py-12" />

        <ScrollTextReveal
          text="From a balcony above a supermarket in Santa Cruz, watching the town wake up every morning — I learned that life is built from the edges, not the center."
          scrollSpan={2.2}
        />

        {/* Mandeville scene */}
        <div className="relative px-6 md:px-12 lg:px-20">
          <StoryImage
            src="/images/mandeville.png"
            alt="Tropical hillside of Mandeville, Jamaica through morning mist"
            className="max-w-4xl mx-auto"
            parallax={0.4}
          />
          <InkSplatter
            className="absolute -bottom-8 right-1/4 w-24 opacity-30"
            seed={23}
            count={5}
          />
        </div>

        <ScrollTextReveal
          text="I wanted to build things. To create something from nothing. To see the world and bring pieces of it back with me."
          scrollSpan={2}
          fontSize="var(--text-heading)"
          align="center"
        />

        {/* Floating objects — scattered interests */}
        <div className="relative min-h-[80vh] md:min-h-[100vh]">
          {FLOATING_OBJECTS.map((obj) => (
            <motion.div
              key={obj.src}
              className={`absolute ${obj.style}`}
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 1,
                delay: obj.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <img
                src={obj.src}
                alt={obj.alt}
                loading="lazy"
                className="w-full h-auto mix-blend-multiply"
              />
            </motion.div>
          ))}

          {/* Center text among objects */}
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <motion.p
              className="text-center font-light max-w-lg"
              style={{
                fontSize: "var(--text-subheading)",
                fontFamily: "var(--font-display), serif",
              }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.6 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              Photography. Logistics. Code. Travel. Cooking. Making.
              <br />
              <span className="text-vermillion/60 italic">
                Everything moves me.
              </span>
            </motion.p>
          </div>
        </div>
      </section>

      {/* ================================================================
          ACT 2 — THE WINDING
          "The path twists. Many directions at once."
          ================================================================ */}
      <section className="relative z-10">
        <div className="py-8" />

        {/* "But..." brush text */}
        <div className="flex justify-center px-6 md:px-12 mb-8">
          <StoryImage
            src="/images/text-but.png"
            alt="But..."
            className="max-w-sm md:max-w-md"
          />
        </div>

        <ScrollTextReveal
          text="When you chase everything that moves you, people want a straight answer for a winding path. They ask what you actually do."
          scrollSpan={2}
        />

        {/* Forking paths */}
        <div className="relative px-6 md:px-12 lg:px-20 flex justify-center">
          <StoryImage
            src="/images/forking-paths.png"
            alt="A path splitting into many diverging trails"
            className="max-w-lg md:max-w-xl"
            parallax={0.3}
          />
        </div>

        <ScrollTextReveal
          text="Pick a lane. Focus. Specialize. The pressure piles on. Slow at first. Then all at once."
          scrollSpan={1.8}
          fontSize="var(--text-heading)"
          align="center"
        />

        {/* The Weight */}
        <div className="relative px-6 md:px-12 lg:px-20">
          <StoryImage
            src="/images/the-weight.png"
            alt="A figure hunched under an enormous bundle, still walking forward"
            className="max-w-5xl mx-auto"
            parallax={0.5}
          />
        </div>

        <div className="py-16" />
      </section>

      {/* ================================================================
          INK TRANSITION — parchment dissolves into darkness
          ================================================================ */}
      <InkSpillTransition direction="enter" />

      {/* ================================================================
          ACT 3 — THE DARK WATER
          "The seasons where nothing made sense."
          ================================================================ */}
      <section
        className="relative z-10 text-parchment"
        style={{ backgroundColor: "var(--ink-deep)" }}
      >
        <AtmosphericParticles mode="dark" count={35} className="z-0" />
        <div className="py-12" />

        {/* Submerged figure */}
        <div className="relative px-4 md:px-8">
          <StoryImage
            src="/images/submerged.png"
            alt="A figure submerged in deep water, sinking slowly, a vermillion ember glowing at the chest"
            className="max-w-5xl mx-auto"
            blend={false}
            parallax={0.3}
          />
        </div>

        <ScrollTextReveal
          text="You're doing everything you're supposed to do. Building. Studying. Learning the languages. Showing up. But results never arrive fast enough to quiet the voice that says maybe you're spread too thin."
          scrollSpan={2.5}
        />

        <ScrollTextReveal
          text="Some nights you sink into the question — what if none of this connects? What if the winding path is just wandering?"
          scrollSpan={1.8}
          fontSize="var(--text-heading)"
          align="center"
        />

        {/* Koi — life in the dark */}
        <div className="relative px-6 md:px-12 lg:px-20 flex justify-center">
          <StoryImage
            src="/images/koi.png"
            alt="A koi fish swimming upward through dark water, vermillion and gold trailing behind"
            className="max-w-3xl"
            blend={false}
            parallax={0.4}
          />
        </div>

        <ScrollTextReveal
          text="But honestly, that tiny ember in your chest — the one that won't let you stop building, won't let you stop moving — that's the only compass you've ever needed."
          scrollSpan={2.2}
          fontSize="var(--text-heading)"
          align="center"
        />

        <div className="py-12" />
      </section>

      {/* ================================================================
          LIGHT RETURNS — darkness yields to parchment
          ================================================================ */}
      <InkSpillTransition direction="exit" />

      {/* ================================================================
          ACT 4 — THE BRUSH FINDS ITS STROKE
          "When you stop trying to go straight."
          ================================================================ */}
      <section className="relative z-10">
        <AtmosphericParticles mode="parchment" count={30} className="z-0" />
        {/* Enso moment — the turn */}
        <div className="relative px-6 md:px-12 lg:px-20 flex justify-center -mt-16">
          <StoryImage
            src="/images/enso-moment.png"
            alt="A vermillion enso with divine golden energy spilling from the gap"
            className="max-w-3xl md:max-w-4xl"
            parallax={0.2}
          />
        </div>

        <ScrollTextReveal
          text="Then something shifts. Not dramatically. Not all at once. You learn to breathe again."
          scrollSpan={1.8}
          fontSize="var(--text-heading)"
          align="center"
        />

        <ScrollTextReveal
          text="You stop caring about the straight path and start trusting the winding one. You start finding beauty in the uncertainty."
          scrollSpan={2}
        />

        {/* Winding river — the reveal. Full-width cinematic moment. */}
        <div className="relative w-full overflow-hidden">
          <CloudPattern position="top-right" opacity={0.03} className="z-0" />
          <StoryImage
            src="/images/winding-river.png"
            alt="A vermillion river winding through ink-wash mountains — the path seen from above forms a beautiful pattern"
            className="w-full"
            parallax={0.6}
          />
        </div>

        <ScrollTextReveal
          text="You realize that the river — seen from above — was always drawing something beautiful. What felt chaotic at ground level is elegant from a distance."
          scrollSpan={2.2}
        />

        <ScrollTextReveal
          text="Growth isn't a sprint. It's the quiet endurance between failures."
          scrollSpan={1.5}
          fontSize="var(--text-heading)"
          align="center"
        />
      </section>

      {/* ================================================================
          ACT 5 — EXPERIENCE. BUILD. MOVE.
          "Everything connects."
          ================================================================ */}
      <section className="relative z-10">
        <div className="py-8" />

        {/* Divine Brush — creation */}
        <div className="relative px-6 md:px-12 lg:px-20">
          <StoryImage
            src="/images/divine-brush.png"
            alt="A celestial brush painting reality into existence — color blooms where it touches"
            className="max-w-5xl mx-auto"
            parallax={0.4}
          />
        </div>

        <ScrollTextReveal
          text="And so, you keep going. You stop waiting for clarity and start walking anyway. You learn that direction comes slowly, like light in the morning — you don't notice it until it's already there."
          scrollSpan={2.2}
        />

        {/* Spiral Seasons — centered */}
        <div className="relative flex justify-center px-6 md:px-12">
          <StoryImage
            src="/images/spiral-seasons.png"
            alt="A spiral of seasons — winter, spring, summer, autumn — time compounding into growth"
            className="max-w-md md:max-w-lg"
            parallax={0.3}
          />
        </div>

        <ScrollTextReveal
          text="You stop trying to fix everything and instead let time do what it does best. Soften. Reveal. Align."
          scrollSpan={1.8}
          fontSize="var(--text-heading)"
          align="center"
        />

        {/* Wolf Running — full-width climax */}
        <div className="relative w-full overflow-hidden">
          <StoryImage
            src="/images/wolf-running.png"
            alt="An Ookami-inspired white wolf running at full speed, flowers blooming in its wake"
            className="w-full"
            parallax={0.5}
          />
        </div>

        <div className="py-8" />

        {/* "Experience. Build. Move." text image */}
        <div className="flex justify-center px-6 md:px-12">
          <StoryImage
            src="/images/text-ebm.png"
            alt="Experience. Build. Move."
            className="max-w-xs md:max-w-sm"
          />
        </div>

        <div className="py-16" />
      </section>

      {/* ================================================================
          CLOSING — the whisper
          ================================================================ */}
      <section className="relative z-10">
        <ScrollTextReveal
          text="Maybe direction isn't found."
          scrollSpan={1.3}
          fontSize="var(--text-heading)"
          align="center"
        />

        <ScrollTextReveal
          text="Maybe it forms under your feet as you keep walking."
          scrollSpan={1.5}
          fontSize="var(--text-heading)"
          align="center"
        />

        <ScrollTextReveal
          text="From Mandeville to wherever this takes me."
          scrollSpan={1.2}
          align="center"
        />
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="relative z-10 pb-12 pt-8">
        <WavePattern className="absolute inset-x-0 top-0" opacity={0.03} rows={2} />

        {/* Footer enso seal */}
        <div className="flex justify-center px-6 mb-12">
          <StoryImage
            src="/images/footer-enso.png"
            alt="Enso circle with vermillion seal"
            className="max-w-[200px] md:max-w-[260px]"
          />
        </div>

        {/* Personal note */}
        <div className="max-w-md mx-auto px-6 text-center mb-10">
          <p
            className="text-sumi-gray/70 font-light leading-relaxed"
            style={{ fontSize: "var(--text-small)" }}
          >
            I created this as an expression of my present chapter.
            <br />
            If you&apos;re on a winding path of your own, just know — it gets
            clearer.
          </p>
          <p
            className="text-sumi-gray/40 font-mono mt-4 italic"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Tatakae.
          </p>
        </div>

        {/* Social links */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-8 text-sumi-gray/50">
            {[
              { label: "Instagram", href: "https://instagram.com/macccoding" },
              { label: "LinkedIn", href: "https://linkedin.com/in/mikechendev" },
              { label: "X (Twitter)", href: "https://x.com/macccoding" },
              { label: "Email Me", href: "mailto:mike@mikechen.xyz" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono uppercase tracking-wider hover:text-vermillion transition-colors duration-500"
                style={{ fontSize: "var(--text-micro)" }}
              >
                {link.label}{" "}
                <span className="inline-block translate-y-[-1px]">{"↗"}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-6 text-sumi-gray/30">
            <p className="font-mono" style={{ fontSize: "var(--text-micro)" }}>
              &copy; {new Date().getFullYear()} Mike Chen
            </p>
            <span className="text-sumi-gray/15">|</span>
            <p
              className="font-mono italic"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Designed by Manifold
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
