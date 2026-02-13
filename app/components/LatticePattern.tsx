"use client";

/**
 * Chinese geometric lattice pattern (窗花 chuanghua)
 * Repeating interlocking L-shapes / crossed rectangles at 80x80px tile
 * Pure CSS via SVG data URI — zero performance impact
 */
export default function LatticePattern({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        opacity: 0.02,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Crect x='10' y='10' width='20' height='20'/%3E%3Crect x='50' y='10' width='20' height='20'/%3E%3Crect x='10' y='50' width='20' height='20'/%3E%3Crect x='50' y='50' width='20' height='20'/%3E%3Cline x1='30' y1='20' x2='50' y2='20'/%3E%3Cline x1='30' y1='60' x2='50' y2='60'/%3E%3Cline x1='20' y1='30' x2='20' y2='50'/%3E%3Cline x1='60' y1='30' x2='60' y2='50'/%3E%3Cpath d='M0,40 L10,40 M70,40 L80,40 M40,0 L40,10 M40,70 L40,80'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "80px 80px",
      }}
      aria-hidden="true"
    />
  );
}
