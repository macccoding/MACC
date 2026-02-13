"use client";

import { motion } from "framer-motion";

interface BlobDividerProps {
  color?: string;
  flip?: boolean;
  className?: string;
}

const paths = [
  "M0,64 C80,20 160,100 240,64 C320,28 400,90 480,64 C560,38 640,80 720,64 C800,48 880,96 960,64 L960,128 L0,128 Z",
  "M0,64 C80,90 160,30 240,64 C320,98 400,20 480,64 C560,108 640,10 720,64 C800,118 880,30 960,64 L960,128 L0,128 Z",
  "M0,64 C80,40 160,88 240,64 C320,40 400,100 480,64 C560,28 640,96 720,64 C800,32 880,88 960,64 L960,128 L0,128 Z",
];

export default function BlobDivider({ color = "#E5B820", flip = false, className = "" }: BlobDividerProps) {
  return (
    <div className={`relative w-full overflow-hidden ${flip ? "rotate-180" : ""} ${className}`} style={{ height: 80 }}>
      <svg
        viewBox="0 0 960 128"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <motion.path
          d={paths[0]}
          fill={color}
          fillOpacity={0.06}
          animate={{
            d: paths,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}
