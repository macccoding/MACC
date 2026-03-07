"use client";

import { motion } from "framer-motion";
import { Footer } from "@/components/ui/Footer";

const PROJECTS = [
  {
    number: "01",
    name: "Istry",
    role: "Founder",
    description:
      "Bespoke food & beverage. Whitelabeling, events, catering. Building at the intersection of Jamaican and Chinese food culture.",
    accent: "vermillion",
    year: "2023",
  },
  {
    number: "02",
    name: "SuperPlus",
    role: "Family Legacy",
    description:
      "Three generations of community retail. My grandmother Hyacinth Gloria Chen built this from nothing in the 1970s. We keep it going.",
    accent: "gold-seal",
    year: "EST.",
  },
  {
    number: "03",
    name: "Kemi",
    role: "Creator",
    description:
      "An AI-powered personal operating system. Sharp, warm, direct — like the best assistant you've ever had, if she were Jamaican and had opinions.",
    accent: "vermillion",
    year: "2025",
  },
  {
    number: "04",
    name: "Caricom Freight",
    role: "Family",
    description:
      "Caribbean freight and shipping. Moving things between Jamaica and the world. Supply chain runs in the family.",
    accent: "gold-seal",
    year: "EST.",
  },
];

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
          className="text-parchment font-light tracking-[-0.02em]"
          style={{ fontSize: "var(--text-display)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          The Work
        </motion.h1>
      </section>

      {/* Projects */}
      {PROJECTS.map((project, i) => (
        <section
          key={project.number}
          className="relative z-10 min-h-screen flex items-center border-t border-sumi-gray-dark/20"
        >
          <div className="w-full px-6 md:px-12 lg:px-20 xl:px-28 py-20 md:py-0">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Number + Year */}
                <div className="flex items-baseline gap-4 mb-6">
                  <span
                    className={`font-mono tracking-[0.2em] ${
                      project.accent === "vermillion"
                        ? "text-vermillion/40"
                        : "text-gold-seal/40"
                    }`}
                    style={{ fontSize: "var(--text-small)" }}
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

                {/* Name */}
                <h2
                  className="text-parchment font-light tracking-[-0.02em] mb-3"
                  style={{ fontSize: "var(--text-heading)" }}
                >
                  {project.name}
                </h2>

                {/* Role */}
                <p
                  className={`font-mono tracking-[0.15em] uppercase mb-8 ${
                    project.accent === "vermillion"
                      ? "text-vermillion/60"
                      : "text-gold-seal/60"
                  }`}
                  style={{ fontSize: "var(--text-micro)" }}
                >
                  {project.role}
                </p>

                {/* Description */}
                <p className="text-parchment-muted font-light leading-[1.7] max-w-xl" style={{ fontSize: "var(--text-body)" }}>
                  {project.description}
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      <Footer />
    </main>
  );
}
