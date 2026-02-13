"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ScrollReveal from "@/app/components/ScrollReveal";
import GlowBorder from "@/app/components/GlowBorder";
import AnimatedButton from "@/app/components/AnimatedButton";

const subjects = [
  "General Inquiry",
  "Business / Partnerships",
  "Istry / Food & Beverage",
  "SuperPlus / Retail",
  "Speaking / Events",
  "Media / Press",
  "Other",
];

const contactLinks = [
  {
    category: "FOR BUSINESS INQUIRIES",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    items: [
      { label: "hello@mikechen.xyz", href: "mailto:hello@mikechen.xyz" },
    ],
  },
  {
    category: "FOR ISTRY / SUPERPLUS",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    items: [
      { label: "business@istry.com", href: "mailto:business@istry.com" },
    ],
  },
  {
    category: "WHATSAPP",
    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    items: [
      { label: "WhatsApp Business", href: "https://wa.me/18762607918" },
    ],
  },
  {
    category: "SOCIALS",
    icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    items: [
      { label: "Instagram", href: "https://instagram.com/mke.chn" },
      { label: "X", href: "https://x.com/itsmikeychen" },
      { label: "LinkedIn", href: "https://linkedin.com/in/michaelacchen" },
    ],
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <Navbar />

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="flex min-h-[40vh] md:min-h-[60vh] flex-col items-center justify-center bg-bg-primary px-6 pt-24 pb-12 md:pt-32 md:pb-16">
        <ScrollReveal>
          <span className="mb-6 block text-center font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-text-muted">
            GET IN TOUCH
          </span>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <h1 className="text-center font-[family-name:var(--font-playfair)] font-bold leading-[0.9] text-text-primary" style={{ fontSize: "var(--text-hero)" }}>
            Contact
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <p className="mt-6 max-w-md text-center text-lg leading-relaxed text-text-primary/70">
            Business, collab, or just vibes &mdash; my door&apos;s always open.
          </p>
        </ScrollReveal>
      </section>

      {/* ════════════════════════════════════════════
          SPLIT: FORM + DIRECT CONTACT
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 pb-16 md:pb-32 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-24 md:gap-16">
          {/* ── LEFT: CONTACT FORM ── */}
          <ScrollReveal>
            <div>
              <span className="mb-8 block font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-accent">
                SEND A MESSAGE
              </span>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
                  >
                    YOUR NAME
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 text-[16px] text-text-primary placeholder:text-text-muted/30 transition-colors focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(229,184,32,0.1)]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
                  >
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 text-[16px] text-text-primary placeholder:text-text-muted/30 transition-colors focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(229,184,32,0.1)]"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
                  >
                    SUBJECT
                  </label>
                  <div className="relative">
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 pr-12 text-[16px] text-text-primary transition-colors focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(229,184,32,0.1)]"
                    >
                      <option value="" disabled>
                        Select a subject...
                      </option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
                  >
                    MESSAGE
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="What's on your mind?"
                    className="w-full resize-none rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 text-[16px] text-text-primary placeholder:text-text-muted/30 transition-colors focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(229,184,32,0.1)]"
                  />
                </div>

                {/* Submit */}
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 py-4"
                    >
                      <motion.svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.path
                          d="M5 13l4 4L19 7"
                          stroke="#22c55e"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      </motion.svg>
                      <span className="font-[family-name:var(--font-jetbrains)] text-[12px] uppercase tracking-[0.2em] text-green-500">
                        MESSAGE SENT
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div key="button" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.98 }}
                        className="group relative w-full overflow-hidden rounded-lg bg-accent py-4 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] text-bg-primary transition-all hover:bg-accent/90 min-h-[48px]"
                      >
                        SEND MESSAGE
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </ScrollReveal>

          {/* ── RIGHT: DIRECT CONTACT ── */}
          <ScrollReveal delay={0.2}>
            <div>
              <span className="mb-8 block font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.3em] text-accent">
                DIRECT CONTACT
              </span>

              <div className="space-y-10">
                {contactLinks.map((section) => (
                  <div key={section.category}>
                    <span className="mb-4 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                      {section.category}
                    </span>
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <GlowBorder key={item.label} hoverOnly borderRadius={12}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 transition-all hover:border-accent/50"
                          >
                            <div className="flex items-center gap-4">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-text-muted/40 transition-colors group-hover:text-accent">
                                <path d={section.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span className="font-[family-name:var(--font-playfair)] text-lg text-text-primary transition-colors group-hover:text-accent">
                                {item.label}
                              </span>
                            </div>
                            <span className="inline-block font-[family-name:var(--font-jetbrains)] text-sm text-text-muted/40 transition-all group-hover:translate-x-2 group-hover:text-accent">
                              &rarr;
                            </span>
                          </a>
                        </GlowBorder>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Response Time Note */}
              <div className="mt-12 rounded-lg border border-white/5 bg-bg-secondary/50 px-6 py-5">
                <span className="mb-2 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  RESPONSE TIME
                </span>
                <p className="text-sm leading-relaxed text-text-primary/60">
                  I typically respond within 24&ndash;48 hours. For urgent business
                  inquiries, WhatsApp is the fastest way to reach me.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
