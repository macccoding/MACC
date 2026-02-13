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
        const delay = row * 0.1 + col * 0.05;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            viewport={{ once: true, margin: "-50px" }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
