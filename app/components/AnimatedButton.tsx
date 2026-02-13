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
  const baseClasses = `group relative inline-flex items-center justify-center overflow-hidden rounded-full px-12 py-5 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.2em] transition-all min-h-[52px] ${className}`;

  const variantClasses =
    variant === "primary"
      ? "border border-accent bg-accent text-bg-primary hover:text-accent"
      : "border border-accent text-accent hover:text-bg-primary";

  const content = (
    <>
      {/* Fill wipe */}
      <motion.span
        className={`absolute inset-0 ${variant === "primary" ? "bg-bg-primary" : "bg-accent"}`}
        initial={{ x: "-101%" }}
        whileHover={{ x: "0%" }}
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
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
