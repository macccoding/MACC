"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import GlowBorder from "@/app/components/GlowBorder";
import StaggeredGrid from "@/app/components/StaggeredGrid";

const links = [
  { label: "ISTRY", href: "#", description: "Bespoke F&B" },
  { label: "LATEST BLOG POST", href: "/journal", description: "From the Journal" },
  { label: "INSTAGRAM", href: "https://instagram.com/mke.chn", description: "@mke.chn" },
  { label: "X / TWITTER", href: "https://x.com/itsmikeychen", description: "@itsmikeychen" },
  { label: "LINKEDIN", href: "https://linkedin.com/in/michaelacchen", description: "Connect" },
  { label: "BOOK A CALL", href: "#", description: "Let's talk" },
  { label: "WHATSAPP", href: "https://wa.me/18762607918", description: "Message me" },
];

export default function LinksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      {/* ════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════ */}
      <main className="relative flex flex-1 flex-col items-center px-6 pb-16 pt-12">
        {/* Subtle rotating background gradient */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            background: "conic-gradient(from 0deg at 50% 50%, #E5B820, transparent, #E5B820, transparent)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-md">
          {/* ── PROFILE SECTION ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10 flex flex-col items-center text-center"
          >
            <Link href="/" className="relative mb-5 block transition-transform hover:scale-105">
              <Image
                src="/images/macc-logo.png"
                alt="MACC Logo — Return to Home"
                width={80}
                height={80}
                className="drop-shadow-[0_0_30px_rgba(229,184,32,0.2)]"
              />
            </Link>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-text-primary">
              MIKE CHEN
            </h1>
            <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-text-muted">
              Ventures &amp; Visions
            </p>
          </motion.div>

          {/* ── STACKED LINK BUTTONS ── */}
          <StaggeredGrid columns={1} className="space-y-3">
            {links.map((link) => (
              <GlowBorder key={link.label} hoverOnly borderRadius={12}>
                {link.href.startsWith("/") ? (
                  <Link href={link.href}>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="group flex w-full min-h-[48px] flex-col items-center justify-center rounded-xl border border-white/10 bg-bg-secondary px-6 py-4 text-center transition-all hover:border-accent/50"
                    >
                      <span className="font-[family-name:var(--font-jetbrains)] text-[12px] uppercase tracking-[0.2em] text-text-primary transition-colors group-hover:text-accent">
                        {link.label}
                      </span>
                      <span className="mt-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted/50">
                        {link.description}
                      </span>
                    </motion.div>
                  </Link>
                ) : (
                  <motion.a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.98 }}
                    className="group flex w-full min-h-[48px] flex-col items-center justify-center rounded-xl border border-white/10 bg-bg-secondary px-6 py-4 text-center transition-all hover:border-accent/50"
                  >
                    <span className="font-[family-name:var(--font-jetbrains)] text-[12px] uppercase tracking-[0.2em] text-text-primary transition-colors group-hover:text-accent">
                      {link.label}
                    </span>
                    <span className="mt-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted/50">
                      {link.description}
                    </span>
                  </motion.a>
                )}
              </GlowBorder>
            ))}
          </StaggeredGrid>
        </div>
      </main>

      {/* ════════════════════════════════════════════
          MINIMAL FOOTER
      ════════════════════════════════════════════ */}
      <footer className="flex flex-col items-center gap-2 px-6 pb-10 pt-6">
        <Link
          href="/"
          className="py-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent"
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
