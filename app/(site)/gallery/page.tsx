"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ScrollReveal from "@/app/components/ScrollReveal";
import AnimatedButton from "@/app/components/AnimatedButton";
import { CATEGORIES, galleryItems, type Category, type GalleryItem } from "@/lib/data/gallery";

/* ─── LIGHTBOX COMPONENT ─── */
function Lightbox({
  item,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
}: {
  item: GalleryItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  totalCount: number;
}) {
  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 font-[family-name:var(--font-jetbrains)] text-lg text-text-primary transition-colors hover:border-accent hover:text-accent"
        aria-label="Close lightbox"
      >
        &times;
      </button>

      {/* Counter */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
        {currentIndex + 1} / {totalCount}
      </div>

      {/* Prev Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 font-[family-name:var(--font-jetbrains)] text-lg text-text-primary transition-colors hover:border-accent hover:text-accent md:left-8"
        aria-label="Previous image"
      >
        &larr;
      </button>

      {/* Next Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 font-[family-name:var(--font-jetbrains)] text-lg text-text-primary transition-colors hover:border-accent hover:text-accent md:right-8"
        aria-label="Next image"
      >
        &rarr;
      </button>

      {/* Content — swipeable on mobile */}
      <motion.div
        key={item.num}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) onPrev();
          else if (info.offset.x < -100) onNext();
        }}
        className="mx-auto flex max-h-[85vh] w-full max-w-4xl flex-col items-center px-4 sm:px-8 md:px-16 lg:px-24"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Placeholder */}
        <div
          className={`${item.bg} relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-white/5`}
        >
          {/* Large Number Watermark */}
          <span className="font-[family-name:var(--font-playfair)] text-[20vw] font-bold leading-none text-white/[0.03]">
            {item.num}
          </span>

          {/* Category Badge */}
          <span className="absolute left-6 top-6 rounded-full border border-white/10 bg-bg-primary/60 px-4 py-1.5 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted backdrop-blur-sm">
            {item.category}
          </span>
        </div>

        {/* Caption Bar */}
        <div className="mt-6 flex w-full items-start justify-between gap-6">
          <div>
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-accent">
              NO. {item.num}
            </span>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-primary/80">
              {item.caption}
            </p>
          </div>
          <span className="shrink-0 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted">
            {item.category}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── GALLERY PAGE ─── */
export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems =
    activeCategory === "ALL"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null
        ? prev === 0
          ? filteredItems.length - 1
          : prev - 1
        : null
    );
  }, [filteredItems.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null
        ? prev === filteredItems.length - 1
          ? 0
          : prev + 1
        : null
    );
  }, [filteredItems.length]);

  return (
    <>
      <Navbar />

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="relative flex min-h-[50vh] md:min-h-[70vh] flex-col items-center justify-center bg-bg-primary px-6 pt-24">
        {/* Flanking Text */}
        <span className="absolute left-6 top-1/2 hidden -translate-y-1/2 -rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block">
          VISUAL ARCHIVE
        </span>
        <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted md:block">
          {filteredItems.length} FRAMES
        </span>

        {/* Mobile flanking */}
        <div className="absolute top-28 flex gap-4 text-center md:hidden">
          <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/60">
            VISUAL ARCHIVE
          </span>
          <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/60">
            {filteredItems.length} FRAMES
          </span>
        </div>

        <ScrollReveal>
          <span className="mb-6 block text-center font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-accent">
            THE ARCHIVE
          </span>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <h1 className="text-center font-[family-name:var(--font-playfair)] font-bold leading-[0.85] text-text-primary" style={{ fontSize: "var(--text-hero)" }}>
            Gallery
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <p className="mt-12 max-w-md text-center font-[family-name:var(--font-jetbrains)] text-[11px] uppercase leading-relaxed tracking-[0.15em] text-text-muted md:mt-14">
            Food, travel, gadgets, aerials, people. A curated collection
            shot through my lens across Jamaica and beyond.
          </p>
        </ScrollReveal>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 flex flex-col items-center gap-3"
        >
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
          FILTER PILLS
      ════════════════════════════════════════════ */}
      <section className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 px-6 py-6 backdrop-blur-lg md:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 md:gap-3">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-full border px-5 py-3 min-h-[44px] font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] transition-all ${
                activeCategory === cat
                  ? "border-accent bg-accent text-bg-primary"
                  : "border-white/10 text-text-muted hover:border-white/30 hover:text-text-primary"
              }`}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div
                  layoutId="gallery-filter"
                  className="absolute inset-0 rounded-full bg-accent -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          MASONRY GRID
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 py-12 md:py-20 md:px-12">
        <div className="mx-auto max-w-7xl">
          {/* Item Count */}
          <ScrollReveal>
            <div className="mb-12 flex items-center justify-between border-b border-white/5 pb-6">
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                SHOWING {filteredItems.length} OF {galleryItems.length} FRAMES
              </span>
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                {activeCategory}
              </span>
            </div>
          </ScrollReveal>

          {/* CSS Columns Masonry */}
          <motion.div layout className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.num}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="mb-5 break-inside-avoid"
                >
                  <button
                    onClick={() => openLightbox(index)}
                    className="group relative block w-full overflow-hidden rounded-lg text-left transition-transform hover:scale-[1.02]"
                    aria-label={`View image ${item.num}`}
                  >
                    {/* Placeholder Image Area */}
                    <div
                      className={`${item.aspect} ${item.bg} relative flex w-full items-center justify-center overflow-hidden border border-white/[0.04] transition-all duration-300 group-hover:border-accent/30 group-hover:ring-1 group-hover:ring-accent/20 group-hover:shadow-[0_10px_40px_rgba(229,184,32,0.08)]`}
                    >
                      {/* Large Ghost Number */}
                      <span className="font-[family-name:var(--font-playfair)] text-[8rem] font-bold leading-none text-white/[0.03] transition-all group-hover:text-accent/[0.08]">
                        {item.num}
                      </span>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-5 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex justify-end">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 font-[family-name:var(--font-jetbrains)] text-xs text-white/80">
                            +
                          </span>
                        </div>
                        <div>
                          <p className="max-w-[90%] text-sm leading-relaxed text-white/80">
                            {item.caption}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Item Info Bar */}
                    <div className="flex items-center justify-between px-1 pt-3 pb-1">
                      <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.15em] text-text-muted/60 transition-colors group-hover:text-accent">
                        {item.num}
                      </span>
                      <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.15em] text-text-muted/40 transition-colors group-hover:text-text-muted">
                        {item.category}
                      </span>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="text-center">
                <span className="font-[family-name:var(--font-playfair)] text-6xl font-bold text-white/5">
                  --
                </span>
                <p className="mt-4 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-text-muted">
                  NO FRAMES IN THIS CATEGORY YET
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BOTTOM CTA
      ════════════════════════════════════════════ */}
      <section className="bg-bg-secondary px-6 md:px-12" style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl text-center">
          <ScrollReveal>
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-text-muted">
              WANT TO WORK TOGETHER?
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <h2 className="mx-auto mt-6 max-w-2xl font-[family-name:var(--font-playfair)] text-4xl font-bold md:text-6xl">
              Let&apos;s create something{" "}
              <span className="italic text-accent">worth</span> shooting.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <AnimatedButton href="/contact" variant="primary" className="mt-10">
              GET IN TOUCH
            </AnimatedButton>
          </ScrollReveal>
        </div>
      </section>

      <Footer />

      {/* ════════════════════════════════════════════
          LIGHTBOX OVERLAY
      ════════════════════════════════════════════ */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <Lightbox
            item={filteredItems[lightboxIndex]}
            onClose={closeLightbox}
            onPrev={goToPrev}
            onNext={goToNext}
            currentIndex={lightboxIndex}
            totalCount={filteredItems.length}
          />
        )}
      </AnimatePresence>
    </>
  );
}
