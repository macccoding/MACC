"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { socialLinks } from "@/lib/data/social";

/* ─── PAC-MAN ARCADE FOOTER ─── */
const GRID_W = 28;
const DOT_SIZE = 6;
const DOT_GAP = 4;
const CELL = DOT_SIZE + DOT_GAP;

function PacManRunner() {
  const [pacX, setPacX] = useState(-20);
  const [mouthOpen, setMouthOpen] = useState(true);
  const [dots, setDots] = useState<boolean[]>(() => Array(GRID_W).fill(true));
  const [ghostX, setGhostX] = useState(-60);

  useEffect(() => {
    const interval = setInterval(() => {
      setPacX((prev) => {
        const next = prev + 3;
        if (next > GRID_W * CELL + 40) {
          setDots(Array(GRID_W).fill(true));
          setGhostX(-60);
          return -20;
        }
        return next;
      });
      setMouthOpen((prev) => !prev);
      setGhostX((prev) => prev + 3);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Eat dots
  useEffect(() => {
    const dotIndex = Math.floor((pacX + 4) / CELL);
    if (dotIndex >= 0 && dotIndex < GRID_W && dots[dotIndex]) {
      setDots((prev) => {
        const next = [...prev];
        next[dotIndex] = false;
        return next;
      });
    }
  }, [pacX, dots]);

  const totalWidth = GRID_W * CELL;

  return (
    <div className="relative mx-auto w-full overflow-hidden" style={{ maxWidth: totalWidth, height: 24 }}>
      {/* Dots */}
      {dots.map((visible, i) => (
        <div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 rounded-full transition-opacity duration-100"
          style={{
            left: i * CELL + DOT_GAP / 2,
            width: DOT_SIZE,
            height: DOT_SIZE,
            backgroundColor: visible ? "rgba(229,184,32,0.5)" : "transparent",
          }}
        />
      ))}

      {/* Ghost */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: ghostX }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 14V7a6 6 0 0112 0v7l-2-2-2 2-2-2-2 2-2-2-2 2z" fill="#FF6B6B" />
          <circle cx="6" cy="7" r="1.5" fill="white" />
          <circle cx="10" cy="7" r="1.5" fill="white" />
          <circle cx="6.5" cy="7" r="0.8" fill="#222" />
          <circle cx="10.5" cy="7" r="0.8" fill="#222" />
        </svg>
      </div>

      {/* Pac-Man */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: pacX }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {mouthOpen ? (
            <path d="M8 1a7 7 0 110 14 7 7 0 010-14zM8 8l6-5v10l-6-5z" fill="#E5B820" fillRule="evenodd" />
          ) : (
            <circle cx="8" cy="8" r="7" fill="#E5B820" />
          )}
        </svg>
      </div>
    </div>
  );
}

/* ─── SCORE DISPLAY ─── */
function ArcadeScore() {
  const [score, setScore] = useState(0);
  const highScore = 88888;

  useEffect(() => {
    const interval = setInterval(() => {
      setScore((prev) => (prev + Math.floor(Math.random() * 100)) % 99999);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="text-center">
        <span className="block font-[family-name:var(--font-jetbrains)] text-[8px] uppercase tracking-[0.3em] text-text-muted/40">
          SCORE
        </span>
        <span className="block font-[family-name:var(--font-jetbrains)] text-sm tabular-nums text-accent/60">
          {String(score).padStart(5, "0")}
        </span>
      </div>
      <div className="text-center">
        <span className="block font-[family-name:var(--font-jetbrains)] text-[8px] uppercase tracking-[0.3em] text-text-muted/40">
          HI-SCORE
        </span>
        <span className="block font-[family-name:var(--font-jetbrains)] text-sm tabular-nums text-accent/60">
          {String(highScore).padStart(5, "0")}
        </span>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-bg-primary px-6 pb-8 pt-16 md:pt-24 md:px-12">
      {/* Social Links */}
      <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-8 border-t border-white/10 pt-12 md:gap-12">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative py-3 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-accent link-underline"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* ── Retro Arcade Section ── */}
      <div className="my-10 md:my-16 flex flex-col items-center gap-6">
        <ArcadeScore />
        <PacManRunner />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.3em] text-text-muted/30"
        >
          INSERT COIN TO CONTINUE
        </motion.p>
      </div>

      {/* Bottom Bar */}
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
          &copy; 2026 MIKE CHEN
        </span>
        <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
          BUILT BY MIKEY
        </span>
      </div>
    </footer>
  );
}
