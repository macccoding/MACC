"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, MODULES } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { ChatPanel } from "@/components/kemi/ChatPanel";
import { FocusTimer } from "./FocusTimer";

const ease = [0.22, 1, 0.36, 1] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();

  // Listen for open-kemi custom event (from mobile homescreen tile)
  useEffect(() => {
    const handler = () => setChatOpen(true);
    window.addEventListener("open-kemi", handler);
    return () => window.removeEventListener("open-kemi", handler);
  }, []);

  const isHome = pathname === "/dashboard";
  const currentModule = MODULES.find(
    (m) => m.href !== "/dashboard" && pathname.startsWith(m.href)
  );

  return (
    <div className="min-h-screen bg-parchment">
      <Sidebar onKemiClick={() => setChatOpen(true)} />

      <main className="ml-0 lg:ml-52 min-h-screen pb-20 lg:pb-0">
        {/* Mobile top bar */}
        <div className="pt-[env(safe-area-inset-top)] h-14 flex items-center justify-between px-5 lg:px-7 border-b border-sumi-gray/15">
          <AnimatePresence mode="wait">
            {isHome || !currentModule ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, ease }}
              >
                <Link href="/dashboard" className="lg:hidden">
                  <span className="text-vermillion font-serif text-base font-semibold">
                    MikeOS
                  </span>
                </Link>
                <div className="hidden lg:block" />
              </motion.div>
            ) : (
              <motion.div
                key={currentModule.href}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, ease }}
              >
                <Link
                  href="/dashboard"
                  className="lg:hidden flex items-center gap-2 text-ink-black"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="w-4 h-4 text-sumi-gray-light"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 3L5 8L10 13" />
                  </svg>
                  <span className="text-base font-serif">
                    {currentModule.icon}
                  </span>
                  <span className="text-sm tracking-wide">
                    {currentModule.label}
                  </span>
                </Link>
                <div className="hidden lg:block" />
              </motion.div>
            )}
          </AnimatePresence>
          <CommandPalette />
        </div>

        {/* Content */}
        <div className="p-5 lg:p-7 max-w-6xl">{children}</div>
      </main>

      {/* Mobile bottom bar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-parchment/90 backdrop-blur-md border-t border-sumi-gray/15 pb-[env(safe-area-inset-bottom)]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-14">
          <Link
            href="/dashboard"
            aria-label="Home"
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
              pathname === "/dashboard"
                ? "text-vermillion"
                : "text-sumi-gray-light"
            }`}
          >
            <span className="text-lg font-serif">家</span>
            <span className="text-[10px] tracking-wide">Home</span>
          </Link>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-quickcapture"));
            }}
            aria-label="Quick capture"
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-sumi-gray-light transition-colors"
          >
            <span className="text-lg">⌘</span>
            <span className="text-[10px] tracking-wide">Capture</span>
          </button>

          <button
            onClick={() => setChatOpen(true)}
            aria-label="Talk to Kemi"
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
              chatOpen ? "text-vermillion" : "text-sumi-gray-light"
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-vermillion/10 border border-vermillion/20 flex items-center justify-center">
              <span className="text-vermillion text-[11px] font-serif">K</span>
            </div>
            <span className="text-[10px] tracking-wide">Kemi</span>
          </button>
        </div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      <FocusTimer />
    </div>
  );
}
