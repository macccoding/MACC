"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface AnimatedButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
  type?: "button" | "submit";
  external?: boolean;
}

export default function AnimatedButton({
  href,
  onClick,
  children,
  variant = "primary",
  className = "",
  type = "button",
  external = false,
}: AnimatedButtonProps) {
  const baseClasses = `group relative inline-flex items-center gap-3 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] transition-all min-h-[48px] ${className}`;

  const variantClasses =
    variant === "primary"
      ? "text-accent hover:text-text-primary"
      : "text-text-muted hover:text-accent";

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {/* Animated underline */}
      <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-100 bg-current transition-transform duration-300 group-hover:scale-x-0" />
      <span className="absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
    </>
  );

  if (href) {
    if (external) {
      return (
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.98 }}
          className={`${baseClasses} ${variantClasses}`}
        >
          {content}
        </motion.a>
      );
    }
    return (
      <Link href={href} className={`${baseClasses} ${variantClasses}`}>
        {content}
      </Link>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses}`}
    >
      {content}
    </motion.button>
  );
}
