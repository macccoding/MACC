"use client";

import { motion } from "framer-motion";
import React from "react";

interface StaggeredGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export default function StaggeredGrid({ children, columns = 3, className = "" }: StaggeredGridProps) {
  const items = React.Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        // Diagonal wave: distance from top-left corner determines delay
        const delay = Math.sqrt(row * row + col * col) * 0.08;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: "-50px" }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
