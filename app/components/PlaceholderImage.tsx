"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface PlaceholderImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  label?: string;
  accentColor?: string;
}

export default function PlaceholderImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  className = "",
  priority = false,
  label,
  accentColor = "#E5B820",
}: PlaceholderImageProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated shimmer gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${accentColor}05 0%, transparent 50%, ${accentColor}08 100%)`,
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}06 50%, transparent 100%)`,
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span
            className="font-[family-name:var(--font-playfair)] text-3xl font-bold opacity-10"
            style={{ color: accentColor }}
          >
            {label}
          </span>
          <span className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-text-muted/40">
            PHOTO COMING SOON
          </span>
        </div>
      )}
    </div>
  );
}
