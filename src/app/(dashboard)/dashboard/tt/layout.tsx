"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TT_SECTIONS = [
  { label: "Hub", href: "/dashboard/tt", icon: "殿" },
  { label: "Log", href: "/dashboard/tt/log", icon: "記" },
  { label: "Atlas", href: "/dashboard/tt/atlas", icon: "写" },
  { label: "Lab", href: "/dashboard/tt/lab", icon: "器" },
  { label: "Matches", href: "/dashboard/tt/matches", icon: "戦" },
  { label: "Plan", href: "/dashboard/tt/plan", icon: "道" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function TTLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard/tt") return pathname === "/dashboard/tt";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-[var(--ink-wash-light)] bg-[var(--ink-deep)]/95 backdrop-blur-sm">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 lg:px-6">
          <span className="mr-3 font-mono text-[var(--vermillion)] text-xs tracking-wider uppercase">
            月読
          </span>
          {TT_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors"
              style={{
                color: isActive(s.href) ? "var(--vermillion)" : "var(--parchment-muted)",
              }}
            >
              <span className="text-xs">{s.icon}</span>
              <span>{s.label}</span>
              {isActive(s.href) && (
                <motion.div
                  layoutId="tt-tab-indicator"
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: "var(--vermillion-wash)" }}
                  transition={{ duration: 0.3, ease: [...ease] }}
                />
              )}
            </Link>
          ))}
        </div>
      </nav>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [...ease] }}
        className="p-4 lg:p-6"
      >
        {children}
      </motion.div>
    </div>
  );
}
