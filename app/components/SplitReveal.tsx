"use client";

import { motion } from "framer-motion";

interface SplitRevealProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

// Golden ratio stagger for organic feel
const PHI = 1.618033988749;

function goldenStagger(index: number, base: number): number {
  return base * (1 - 1 / (1 + index / PHI));
}

export default function SplitReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.03,
  as: Tag = "span",
}: SplitRevealProps) {
  const words = text.split(" ");

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: delay + goldenStagger(i, stagger * words.length),
              ease: [0.33, 1, 0.68, 1],
            }}
            viewport={{ once: true, margin: "-50px" }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </Tag>
  );
}
