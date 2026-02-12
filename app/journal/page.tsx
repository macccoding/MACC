"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

/* ─── CATEGORIES ─── */
const categories = [
  { num: "01", slug: "BUILDING", label: "BUILDING", description: "Entrepreneurship, lessons, behind-the-scenes" },
  { num: "02", slug: "TECH", label: "TECH", description: "Gadgets, AI, code, product reviews" },
  { num: "03", slug: "FOOD", label: "FOOD", description: "Culture, recipes, restaurant reviews, Istry stories" },
  { num: "04", slug: "GADGETS", label: "GADGETS", description: "Tech gear, 3D printing, reviews, unboxings" },
  { num: "05", slug: "FRAMES", label: "FRAMES", description: "Photography, visual stories" },
  { num: "06", slug: "MOVE", label: "MOVE", description: "Travel logs, city guides" },
  { num: "07", slug: "FITNESS", label: "FITNESS", description: "Training, wellness, lifestyle" },
  { num: "08", slug: "RANDOM", label: "RANDOM", description: "Everything else" },
];

/* ─── POSTS ─── */
const posts = [
  {
    num: "01",
    title: "Why I\u2019m Building a Personal Site in 2026",
    date: "FEB 12, 2026",
    category: "BUILDING",
    readTime: "5 MIN READ",
    excerpt:
      "Instagram can change the algorithm tomorrow. None of these platforms let me tell my story the way I want to tell it. They let me rent attention. I want to own it.",
    featured: true,
  },
  {
    num: "02",
    title: "The Tech Stack Behind My Businesses",
    date: "FEB 10, 2026",
    category: "TECH",
    readTime: "8 MIN READ",
    excerpt:
      "People always ask me what I do. The real answer is that I bounce between running a food company, operating a supermarket, building an AI product, and making things \u2014 all in the same day. Here\u2019s every tool I use and why.",
    featured: false,
  },
  {
    num: "03",
    title: "Food at the Intersection of Jamaica and China",
    date: "FEB 8, 2026",
    category: "FOOD",
    readTime: "6 MIN READ",
    excerpt:
      "I grew up eating ackee and saltfish for breakfast and char siu for dinner. Being Jamaican-Chinese means you exist at the intersection of two of the most flavour-obsessed cultures on earth.",
    featured: false,
  },
];

export default function JournalPage() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const filteredPosts =
    activeCategory === "ALL"
      ? posts
      : posts.filter((post) => post.category === activeCategory);

  const featuredPost = filteredPosts.find((p) => p.featured);
  const remainingPosts = filteredPosts.filter((p) => !p.featured);

  return (
    <>
      <Navbar />

      {/* ════════════════════════════════════════════
          HERO / PAGE HEADER
      ════════════════════════════════════════════ */}
      <section className="relative flex min-h-[70vh] flex-col justify-end overflow-hidden bg-bg-primary px-6 pb-16 pt-32 md:px-12">
        {/* Background ghost number */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="select-none font-[family-name:var(--font-playfair)] text-[40vw] font-bold leading-none text-ghost">
            J
          </span>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <ScrollReveal>
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-text-muted">
              THE JOURNAL
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="mt-6 font-[family-name:var(--font-playfair)] text-[12vw] font-bold leading-[0.85] text-text-primary md:text-[8vw]">
              Thoughts,
              <br />
              <span className="italic text-accent">Stories</span> &amp;
              <br />
              Lessons
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-text-primary/60">
              A running log of what I&apos;m building, learning, eating, driving,
              and thinking about. No algorithm. No feed. Just words.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CATEGORY INDEX
      ════════════════════════════════════════════ */}
      <section className="border-b border-white/5 bg-bg-primary px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-8">
              <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                CATEGORIES
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="flex flex-wrap gap-3">
              {/* ALL pill */}
              <button
                onClick={() => setActiveCategory("ALL")}
                className={`rounded-full border px-5 py-2 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] transition-all ${
                  activeCategory === "ALL"
                    ? "border-accent bg-accent text-bg-primary"
                    : "border-white/10 text-text-muted hover:border-accent/50 hover:text-accent"
                }`}
              >
                ALL
              </button>

              {/* Category pills */}
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === cat.slug ? "ALL" : cat.slug
                    )
                  }
                  className={`rounded-full border px-5 py-2 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] transition-all ${
                    activeCategory === cat.slug
                      ? "border-accent bg-accent text-bg-primary"
                      : "border-white/10 text-text-muted hover:border-accent/50 hover:text-accent"
                  }`}
                >
                  <span className="opacity-40">{cat.num}</span> {cat.label}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Active category description */}
          <AnimatePresence mode="wait">
            {activeCategory !== "ALL" && (
              <motion.p
                key={activeCategory}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mt-6 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.15em] text-accent-secondary"
              >
                {categories.find((c) => c.slug === activeCategory)?.description}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURED POST
      ════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {featuredPost && (
          <motion.section
            key={`featured-${activeCategory}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-bg-primary px-6 pt-24 pb-0 md:px-12"
          >
            <div className="mx-auto max-w-7xl">
              <ScrollReveal>
                <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-accent">
                  FEATURED POST
                </span>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <Link href="#" className="group mt-8 block">
                  <div className="mt-8 grid gap-8 rounded-2xl border border-white/5 bg-bg-secondary p-8 transition-all duration-500 group-hover:border-accent/20 group-hover:bg-bg-secondary/80 md:grid-cols-2 md:gap-16 md:p-14">
                    {/* Left: Image placeholder */}
                    <div className="aspect-[16/10] overflow-hidden rounded-lg bg-bg-primary">
                      <div className="flex h-full items-center justify-center">
                        <span className="font-[family-name:var(--font-playfair)] text-[8rem] font-bold text-white/[0.03] transition-colors duration-500 group-hover:text-accent/10">
                          {featuredPost.num}
                        </span>
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-4">
                        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                          {featuredPost.date}
                        </span>
                        <span className="rounded-full border border-accent/30 px-3 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-wider text-accent">
                          {featuredPost.category}
                        </span>
                        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                          {featuredPost.readTime}
                        </span>
                      </div>

                      <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight text-text-primary transition-colors duration-300 group-hover:text-accent md:text-5xl">
                        {featuredPost.title}
                      </h2>

                      <p className="mt-6 text-base leading-relaxed text-text-primary/60 md:text-lg">
                        {featuredPost.excerpt}
                      </p>

                      <span className="mt-8 inline-flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-accent transition-opacity group-hover:opacity-70">
                        READ POST
                        <motion.span
                          className="inline-block"
                          animate={{ x: [0, 4, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut",
                          }}
                        >
                          &rarr;
                        </motion.span>
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          POST LIST
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-12 flex items-center justify-between">
              <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                {activeCategory === "ALL" ? "ALL POSTS" : activeCategory} &mdash;{" "}
                {filteredPosts.length} {filteredPosts.length === 1 ? "ENTRY" : "ENTRIES"}
              </span>
            </div>
          </ScrollReveal>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="divide-y divide-white/5"
            >
              {remainingPosts.length > 0 ? (
                remainingPosts.map((post, i) => (
                  <ScrollReveal key={post.num} delay={i * 0.1}>
                    <Link href="#" className="group block py-12 transition-colors first:pt-0">
                      <div className="grid items-start gap-6 md:grid-cols-12 md:gap-8">
                        {/* Number */}
                        <div className="md:col-span-1">
                          <span className="font-[family-name:var(--font-jetbrains)] text-sm text-text-muted/30 transition-colors group-hover:text-accent/50">
                            {post.num}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 md:col-span-3">
                          <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                            {post.date}
                          </span>
                          <span className="rounded-full border border-accent/30 px-3 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-wider text-accent">
                            {post.category}
                          </span>
                        </div>

                        {/* Title + Excerpt */}
                        <div className="md:col-span-7">
                          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-text-primary transition-colors group-hover:text-accent md:text-3xl">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-base leading-relaxed text-text-primary/50">
                            {post.excerpt}
                          </p>
                          <div className="mt-4 flex items-center gap-4">
                            <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted/50">
                              {post.readTime}
                            </span>
                            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted/30 transition-colors group-hover:text-accent">
                              &rarr;
                            </span>
                          </div>
                        </div>

                        {/* Arrow (desktop) */}
                        <div className="hidden items-center justify-end md:col-span-1 md:flex">
                          <span className="font-[family-name:var(--font-jetbrains)] text-lg text-text-muted/20 transition-colors group-hover:text-accent">
                            &rarr;
                          </span>
                        </div>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))
              ) : (
                /* If only featured post matches (or no posts at all) */
                !featuredPost && (
                  <div className="py-24 text-center">
                    <span className="font-[family-name:var(--font-playfair)] text-2xl text-text-muted/30">
                      No posts yet
                    </span>
                    <p className="mt-4 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted/40">
                      Check back soon
                    </p>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CATEGORY INDEX (FULL)
      ════════════════════════════════════════════ */}
      <section className="bg-bg-secondary px-6 py-32 md:px-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-20 border-b border-white/10 pb-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-bold md:text-6xl">
                Journal <span className="italic text-accent">Index</span>
              </h2>
              <p className="mt-4 max-w-lg text-base text-text-primary/50">
                Everything I write about, organized by what matters to me.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-0 divide-y divide-white/5 md:grid-cols-2 md:gap-x-16 md:divide-y-0">
            {categories.map((cat, i) => (
              <ScrollReveal key={cat.slug} delay={i * 0.05}>
                <button
                  onClick={() => {
                    setActiveCategory(cat.slug);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group flex w-full items-start gap-6 border-b border-white/5 py-8 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <span className="font-[family-name:var(--font-jetbrains)] text-sm text-text-muted/30 transition-colors group-hover:text-accent/50">
                    {cat.num}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-text-primary transition-colors group-hover:text-accent md:text-2xl">
                      {cat.label}
                    </h3>
                    <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.1em] text-text-muted/60">
                      {cat.description}
                    </p>
                  </div>
                  <span className="mt-1 font-[family-name:var(--font-jetbrains)] text-sm text-text-muted/20 transition-colors group-hover:text-accent">
                    &rarr;
                  </span>
                </button>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          NEWSLETTER / CTA
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 py-32 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
              STAY IN THE LOOP
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h2 className="mt-6 font-[family-name:var(--font-playfair)] text-4xl font-bold md:text-6xl">
              Don&apos;t miss a <span className="italic text-accent">post</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="mt-6 text-lg text-text-primary/50">
              No spam. No algorithm. Just an email when something new drops.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full max-w-sm rounded-full border border-white/10 bg-bg-secondary px-6 py-3.5 font-[family-name:var(--font-jetbrains)] text-[12px] text-text-primary placeholder:text-text-muted/40 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 sm:w-auto sm:min-w-[320px]"
              />
              <button className="w-full rounded-full bg-accent px-8 py-3.5 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.15em] text-bg-primary transition-opacity hover:opacity-90 sm:w-auto">
                SUBSCRIBE
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <Footer />
    </>
  );
}
