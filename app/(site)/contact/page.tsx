"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ScrollReveal from "../../components/ScrollReveal";
import MagneticButton from "../../components/MagneticButton";

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
    items: [
      { label: "hello@mikechen.xyz", href: "mailto:hello@mikechen.xyz", type: "email" },
    ],
  },
  {
    category: "FOR ISTRY / SUPERPLUS",
    items: [
      { label: "business@istry.com", href: "mailto:business@istry.com", type: "email" },
    ],
  },
  {
    category: "WHATSAPP",
    items: [
      { label: "WhatsApp Business", href: "https://wa.me/18762607918", type: "link" },
    ],
  },
  {
    category: "SOCIALS",
    items: [
      { label: "Instagram", href: "https://instagram.com/mke.chn", type: "link" },
      { label: "X", href: "https://x.com/itsmikeychen", type: "link" },
      { label: "LinkedIn", href: "https://linkedin.com/in/michaelacchen", type: "link" },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <h1 className="text-center font-[family-name:var(--font-playfair)] text-[14vw] font-bold leading-[0.9] text-text-primary sm:text-[10vw] md:text-[8vw]">
            Contact
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <p className="mt-6 max-w-md text-center text-lg leading-relaxed text-text-primary/70">
            Whether it&apos;s business, a collaboration, or just to say what&apos;s up &mdash; I&apos;d love to hear from you.
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

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-3 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
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
                    placeholder="Michael Chen"
                    className="w-full rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 text-text-primary placeholder:text-text-muted/40 transition-colors focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-3 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
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
                    className="w-full rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 text-text-primary placeholder:text-text-muted/40 transition-colors focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="mb-3 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
                  >
                    SUBJECT
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 text-text-primary transition-colors focus:border-accent focus:outline-none"
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
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="mb-3 block font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted"
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
                    placeholder="Tell me what's on your mind..."
                    className="w-full resize-none rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 text-text-primary placeholder:text-text-muted/40 transition-colors focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Submit */}
                <MagneticButton className="w-full" strength={0.15}>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-lg bg-accent py-4 font-[family-name:var(--font-jetbrains)] text-[12px] font-bold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90"
                  >
                    SEND MESSAGE
                  </motion.button>
                </MagneticButton>
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
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between rounded-lg border border-white/10 bg-bg-secondary px-5 py-4 transition-all hover:border-accent/50"
                        >
                          <span className="font-[family-name:var(--font-playfair)] text-lg text-text-primary transition-colors group-hover:text-accent">
                            {item.label}
                          </span>
                          <span className="inline-block font-[family-name:var(--font-jetbrains)] text-sm text-text-muted/40 transition-all group-hover:translate-x-2 group-hover:text-accent">
                            &rarr;
                          </span>
                        </a>
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
