"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BrushDivider } from "@/components/ink/BrushDivider";
import { Footer } from "@/components/ui/Footer";
import { WavePattern } from "@/components/ink/WavePattern";

const PROJECTS = [
  {
    number: "01",
    name: "Istry",
    role: "Founder",
    year: "2023",
    accent: "vermillion" as const,
    description:
      "Bespoke food & beverage. Whitelabeling, events, catering. Building at the intersection of Jamaican and Chinese food culture.",
    // Wok with chopsticks — brush stroke SVG
    icon: (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        <path d="M20,70 C24,86 40,96 60,96 C80,96 96,86 100,70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14,70 L106,70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M44,60 C44,50 40,38 44,28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <path d="M60,56 C60,44 56,32 60,20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
        <path d="M76,60 C76,50 80,40 76,28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
      </svg>
    ),
  },
  {
    number: "02",
    name: "SuperPlus",
    role: "Family Legacy",
    year: "EST.",
    accent: "gold-seal" as const,
    description:
      "Three generations of community retail. My grandmother Hyacinth Gloria Chen built this from nothing in the 1970s. We keep it going.",
    // Storefront — simple architectural lines
    icon: (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        <path d="M20,90 L20,40 L60,20 L100,40 L100,90" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M20,90 L100,90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <rect x="42" y="58" width="36" height="32" rx="1" stroke="currentColor" strokeWidth="2.5" />
        <path d="M60,58 L60,90" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path d="M20,40 L100,40" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
  },
  {
    number: "03",
    name: "Kemi",
    role: "Creator",
    year: "2025",
    accent: "vermillion" as const,
    description:
      "An AI-powered personal operating system. Sharp, warm, direct — like the best assistant you've ever had, if she were Jamaican and had opinions.",
    // Brain/circuit — neural network nodes
    icon: (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        <circle cx="60" cy="40" r="6" stroke="currentColor" strokeWidth="3" />
        <circle cx="34" cy="64" r="5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="86" cy="64" r="5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="44" cy="90" r="4" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="76" cy="90" r="4" stroke="currentColor" strokeWidth="2.5" />
        <path d="M60,46 L34,64" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path d="M60,46 L86,64" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path d="M34,69 L44,86" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M86,69 L76,86" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M39,64 L81,64" stroke="currentColor" strokeWidth="1.5" opacity="0.2" strokeDasharray="3 2" />
      </svg>
    ),
  },
  {
    number: "04",
    name: "Caricom Freight",
    role: "Family",
    year: "EST.",
    accent: "gold-seal" as const,
    description:
      "Caribbean freight and shipping. Moving things between Jamaica and the world. Supply chain runs in the family.",
    // Container/ship — cargo silhouette
    icon: (
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        <path d="M16,72 L24,48 L96,48 L104,72" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M10,72 L110,72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M14,78 C30,86 60,88 90,86 C100,84 106,80 106,78" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <rect x="34" y="52" width="16" height="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <rect x="54" y="52" width="16" height="16" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <rect x="74" y="52" width="16" height="16" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      </svg>
    ),
  },
];

function ProjectSection({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const iconY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const iconOpacity = useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 0.15, 0.15, 0]);
  const contentY = useTransform(scrollYProgress, [0.1, 0.4], [60, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.1, 0.35], [0, 1]);

  const accentColor =
    project.accent === "vermillion" ? "text-vermillion" : "text-gold-seal";
  const accentColorDim =
    project.accent === "vermillion" ? "text-vermillion/60" : "text-gold-seal/60";
  const accentColorFaint =
    project.accent === "vermillion" ? "text-vermillion/40" : "text-gold-seal/40";

  return (
    <section
      ref={sectionRef}
      className="relative z-10 min-h-screen flex items-center"
    >
      {/* Large background icon — parallax */}
      <motion.div
        className={`absolute right-8 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 w-48 md:w-64 lg:w-80 ${accentColorDim}`}
        style={{ y: iconY, opacity: iconOpacity }}
      >
        {project.icon}
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full px-6 md:px-12 lg:px-20 xl:px-28 py-20 md:py-0"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-2xl">
          {/* Number + Year row */}
          <div className="flex items-baseline gap-4 mb-8">
            <span
              className={`${accentColorFaint} font-mono tracking-[0.2em]`}
              style={{
                fontSize: "var(--text-display)",
                fontFamily: "var(--font-display), serif",
                fontWeight: 400,
              }}
            >
              {project.number}
            </span>
            <span
              className="font-mono text-sumi-gray tracking-wider"
              style={{ fontSize: "var(--text-micro)" }}
            >
              {project.year}
            </span>
          </div>

          {/* Project name — display font */}
          <h2
            className="text-ink-black tracking-[-0.02em] mb-3"
            style={{
              fontSize: "var(--text-heading)",
              fontFamily: "var(--font-display), serif",
              fontWeight: 500,
            }}
          >
            {project.name}
          </h2>

          {/* Role */}
          <p
            className={`${accentColorDim} font-mono tracking-[0.15em] uppercase mb-8`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {project.role}
          </p>

          {/* Description */}
          <p
            className="text-sumi-gray font-light leading-[1.8] max-w-xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {project.description}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <main className="relative">
      {/* Header */}
      <section className="relative z-10 min-h-[60vh] flex flex-col justify-end pb-16 px-6 md:px-12 lg:px-20 xl:px-28">
        <motion.p
          className="font-mono text-vermillion/50 tracking-[0.25em] uppercase mb-4"
          style={{ fontSize: "var(--text-micro)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Things I&apos;ve Built
        </motion.p>
        <motion.h1
          className="text-ink-black tracking-[-0.03em]"
          style={{
            fontSize: "var(--text-display)",
            fontFamily: "var(--font-display), serif",
            fontWeight: 500,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          The Work
        </motion.h1>
      </section>

      {/* Projects — full viewport gallery */}
      {PROJECTS.map((project, i) => (
        <div key={project.number}>
          {i > 0 && (
            <BrushDivider
              variant={((i % 3) + 1) as 1 | 2 | 3}
              color={project.accent === "vermillion" ? "vermillion" : "sumi"}
              className="px-6 md:px-12 lg:px-20 xl:px-28"
            />
          )}
          <ProjectSection project={project} index={i} />
        </div>
      ))}

      <BrushDivider variant={3} color="sumi" className="px-6 md:px-12 lg:px-20 xl:px-28" />
      <div className="relative">
        <WavePattern className="absolute inset-x-0 top-0" opacity={0.04} rows={2} />
        <Footer />
      </div>
    </main>
  );
}
