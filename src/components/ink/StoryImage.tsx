"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface StoryImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Apply mix-blend-mode: multiply to merge with parchment bg */
  blend?: boolean;
  /** Parallax strength: 0 = none, positive = slower than scroll, negative = faster */
  parallax?: number;
  /** Load eagerly (for above-the-fold) */
  priority?: boolean;
  /** Delay before reveal animation (seconds) */
  delay?: number;
  /** Unique seed for ink-bleed SVG displacement filter on edges */
  inkBleed?: number;
  /** CSS class for animations (used by scroll-triggered effects) */
  animationClass?: string;
  /** Intrinsic width — prevents layout collapse for lazy-loaded images */
  width?: number;
  /** Intrinsic height — prevents layout collapse for lazy-loaded images */
  height?: number;
}

export function StoryImage({
  src,
  alt,
  className = "",
  blend = false,
  parallax = 0,
  priority = false,
  delay = 0,
  inkBleed,
  animationClass,
  width,
  height,
}: StoryImageProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [parallax * 60, -parallax * 60]);

  const filterId = inkBleed != null ? `ink-bleed-${inkBleed}` : undefined;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`${className} ${animationClass ?? ""}`}
    >
      {filterId && (
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.04"
                numOctaves={4}
                seed={inkBleed}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={15}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
      <motion.img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        style={{
          ...(parallax ? { y } : {}),
          ...(filterId ? { filter: `url(#${filterId})` } : {}),
        }}
        className={`w-full h-auto ${blend ? "mix-blend-multiply" : ""}`}
      />
    </motion.div>
  );
}
