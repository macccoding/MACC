"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface SidebarProps {
  onKemiClick?: () => void;
}

export const MODULES = [
  { label: "Home", href: "/dashboard", icon: "家" },
  { label: "Finances", href: "/dashboard/finances", icon: "金" },
  { label: "Budget", href: "/dashboard/budget", icon: "算" },
  { label: "Email", href: "/dashboard/email", icon: "信" },
  { label: "Calendar", href: "/dashboard/calendar", icon: "暦" },
  { label: "Goals", href: "/dashboard/goals", icon: "的" },
  { label: "Habits", href: "/dashboard/habits", icon: "習" },
  { label: "Health", href: "/dashboard/health", icon: "体" },
  { label: "Learning", href: "/dashboard/learning", icon: "学" },
  { label: "Journal", href: "/dashboard/journal", icon: "記" },
  { label: "Investments", href: "/dashboard/investments", icon: "株" },
  { label: "Travel", href: "/dashboard/travel", icon: "旅" },
  { label: "Creative", href: "/dashboard/creative", icon: "芸" },
  { label: "Reading", href: "/dashboard/reading", icon: "読" },
  { label: "People", href: "/dashboard/people", icon: "人" },
  { label: "Focus", href: "/dashboard/focus", icon: "集" },
  { label: "Kioku", href: "/dashboard/knowledge", icon: "脳" },
  { label: "Review", href: "/dashboard/review", icon: "省" },
  { label: "Blueprint", href: "/dashboard/blueprint", icon: "図" },
  { label: "Tsukuyomi", href: "/dashboard/tt", icon: "卓" },
];

export function Sidebar({ onKemiClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside data-sidebar className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-52 lg:flex lg:flex-col bg-parchment/60 border-r border-sumi-gray/15 z-40 backdrop-blur-sm">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center lg:justify-start lg:px-4 border-b border-sumi-gray/15">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-vermillion font-serif text-base font-semibold">
            <span className="lg:hidden">陳</span>
            <span className="hidden lg:inline">MikeOS</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
        <ul className="flex flex-col gap-0.5 px-1.5 lg:px-2">
          {MODULES.map((mod) => {
            const isActive =
              pathname === mod.href ||
              (mod.href !== "/dashboard" && pathname.startsWith(mod.href));
            return (
              <li key={mod.href} className="relative">
                <Link
                  href={mod.href}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-300 group ${
                    isActive
                      ? "bg-vermillion/8 text-vermillion"
                      : "text-sumi-gray-light hover:text-ink-black hover:bg-parchment-warm/20"
                  }`}
                >
                  <span className="w-7 h-7 flex items-center justify-center text-[13px] shrink-0 font-serif">
                    {mod.icon}
                  </span>
                  <span className="hidden lg:block text-xs tracking-wide truncate">
                    {mod.label}
                  </span>
                </Link>
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-vermillion rounded-r-full"
                    layoutId="sidebar-active"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Kemi avatar */}
      <div className="border-t border-sumi-gray/15 p-2 lg:p-3">
        <button
          onClick={onKemiClick}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-parchment-warm/20 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-vermillion/10 border border-vermillion/20 flex items-center justify-center shrink-0 group-hover:border-vermillion/40 transition-colors">
            <span className="text-vermillion text-xs font-serif">K</span>
          </div>
          <span className="hidden lg:block text-xs text-sumi-gray-light group-hover:text-ink-black transition-colors">
            Talk to Kemi
          </span>
        </button>
      </div>
    </aside>
  );
}
