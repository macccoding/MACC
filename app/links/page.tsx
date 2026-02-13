"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const links = [
  { label: "ISTRY", href: "#", description: "Bespoke F&B" },
  { label: "LATEST BLOG POST", href: "/journal", description: "From the Journal" },
  { label: "INSTAGRAM", href: "https://instagram.com/mke.chn", description: "@mke.chn" },
  { label: "X / TWITTER", href: "https://x.com/itsmikeychen", description: "@itsmikeychen" },
  { label: "LINKEDIN", href: "https://linkedin.com/in/michaelacchen", description: "Connect" },
  { label: "BOOK A CALL", href: "#", description: "Let's talk" },
  { label: "WHATSAPP", href: "#", description: "Message me" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function LinksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      {/* ════════════════════════════════════════════
          MINIMAL HEADER — LOGO ONLY
      ════════════════════════════════════════════ */}
      <header className="flex items-center justify-center px-6 pt-10">
        <Link href="/">
          <Image
            src="/images/macc-logo.png"
            alt="MACC"
            width={40}
            height={40}
            className="invert brightness-200"
          />
        </Link>
      </header>

      {/* ════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════ */}
      <main className="flex flex-1 flex-col items-center px-6 pb-16 pt-10">
        <div className="w-full max-w-md">
          {/* ── PROFILE SECTION ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10 flex flex-col items-center text-center"
          >
            <div className="relative mb-5">
              <Image
                src="/images/macc-logo.png"
                alt="MACC Logo"
                width={80}
                height={80}
                className="drop-shadow-[0_0_30px_rgba(229,184,32,0.2)]"
              />
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-text-primary">
              MIKE CHEN
            </h1>
            <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-text-muted">
              Ventures &amp; Visions
            </p>
          </motion.div>

          {/* ── STACKED LINK BUTTONS ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {links.map((link) => (
              <motion.div key={link.label} variants={itemVariants}>
                {link.href.startsWith("/") ? (
                  <Link
                    href={link.href}
                    className="group flex w-full flex-col items-center rounded-xl border border-white/10 bg-bg-secondary px-6 py-4 text-center transition-all hover:scale-[1.02] hover:border-accent/50"
                  >
                    <span className="font-[family-name:var(--font-jetbrains)] text-[12px] uppercase tracking-[0.2em] text-text-primary transition-colors group-hover:text-accent">
                      {link.label}
                    </span>
                    <span className="mt-1 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.15em] text-text-muted/50">
                      {link.description}
                    </span>
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-full flex-col items-center rounded-xl border border-white/10 bg-bg-secondary px-6 py-4 text-center transition-all hover:scale-[1.02] hover:border-accent/50"
                  >
                    <span className="font-[family-name:var(--font-jetbrains)] text-[12px] uppercase tracking-[0.2em] text-text-primary transition-colors group-hover:text-accent">
                      {link.label}
                    </span>
                    <span className="mt-1 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.15em] text-text-muted/50">
                      {link.description}
                    </span>
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* ════════════════════════════════════════════
          MINIMAL FOOTER
      ════════════════════════════════════════════ */}
      <footer className="flex flex-col items-center gap-2 px-6 pb-10 pt-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent"
        >
          mikechen.xyz
        </Link>
        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted/40">
          &copy; 2026 MIKE CHEN
        </span>
      </footer>
    </div>
  );
}
