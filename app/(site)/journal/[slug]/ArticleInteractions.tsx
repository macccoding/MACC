"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

interface ArticleInteractionsProps {
  slug: string;
  title: string;
}

export default function ArticleInteractions({ slug, title }: ArticleInteractionsProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareX = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <>
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-accent"
        style={{ scaleX }}
      />

      {/* Share Buttons - Fixed on left side */}
      <div className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <button
          onClick={handleCopyLink}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-bg-secondary/80 backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-bg-secondary"
          aria-label="Copy link"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-500">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-muted transition-colors group-hover:text-accent">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <button
          onClick={handleShareX}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-bg-secondary/80 backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-bg-secondary"
          aria-label="Share on X"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-muted transition-colors group-hover:text-accent">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
      </div>
    </>
  );
}
