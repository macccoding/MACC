"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { QuickCapture } from "./QuickCapture";
import { ChatPanel } from "@/components/kemi/ChatPanel";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();

  // Listen for open-kemi custom event (from mobile homescreen tile)
  useEffect(() => {
    const handler = () => setChatOpen(true);
    window.addEventListener("open-kemi", handler);
    return () => window.removeEventListener("open-kemi", handler);
  }, []);

  return (
    <div className="min-h-screen bg-parchment">
      <Sidebar onKemiClick={() => setChatOpen(true)} />

      <main className="ml-0 lg:ml-52 min-h-screen pb-20 lg:pb-0">
        {/* Mobile top bar */}
        <div className="h-14 flex items-center justify-between px-5 lg:px-7 border-b border-sumi-gray/15">
          <Link href="/dashboard" className="lg:hidden">
            <span className="text-vermillion font-serif text-base font-semibold">
              MikeOS
            </span>
          </Link>
          <div className="hidden lg:block" /> {/* desktop spacer */}
          <QuickCapture />
        </div>

        {/* Content */}
        <div className="p-5 lg:p-7 max-w-6xl">{children}</div>
      </main>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-parchment/90 backdrop-blur-md border-t border-sumi-gray/15 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          <Link
            href="/dashboard"
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
              // Trigger QuickCapture via keyboard shortcut
              document.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                })
              );
            }}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-sumi-gray-light transition-colors"
          >
            <span className="text-lg">⌘</span>
            <span className="text-[10px] tracking-wide">Capture</span>
          </button>

          <button
            onClick={() => setChatOpen(true)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-sumi-gray-light transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-vermillion/10 border border-vermillion/20 flex items-center justify-center">
              <span className="text-vermillion text-[11px] font-serif">K</span>
            </div>
            <span className="text-[10px] tracking-wide">Kemi</span>
          </button>
        </div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
