"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const socialLinks = [
  { label: "EMAIL", href: "mailto:hello@mikechen.xyz" },
  { label: "INSTAGRAM", href: "https://instagram.com/mke.chn" },
  { label: "X", href: "https://x.com/itsmikeychen" },
  { label: "LINKEDIN", href: "https://linkedin.com/in/michaelacchen" },
  { label: "WHATSAPP", href: "https://wa.me/18762607918" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-bg-primary px-6 pb-8 pt-16 md:pt-24 md:px-12">
      {/* Social Links */}
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-6 border-t border-white/10 pt-12">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent after:absolute after:bottom-[-2px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Giant Ghosted Watermark */}
      <div className="relative my-10 md:my-16 flex items-center justify-center overflow-hidden">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          className="select-none font-[family-name:var(--font-playfair)] text-[12vw] font-bold leading-none text-ghost"
        >
          CHEN
        </motion.h2>
      </div>

      {/* Bottom Bar */}
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
          &copy; 2026 MIKE CHEN
        </span>
        <Link
          href="/links"
          className="relative font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent after:absolute after:bottom-[-2px] after:left-0 after:h-[1px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
        >
          LINKS
        </Link>
        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
          BUILT BY MIKEY
        </span>
      </div>
    </footer>
  );
}
