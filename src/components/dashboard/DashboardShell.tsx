"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { QuickCapture } from "./QuickCapture";
import { ChatPanel } from "@/components/kemi/ChatPanel";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-parchment">
      <Sidebar onKemiClick={() => setChatOpen(true)} />

      <main className="ml-14 lg:ml-52 min-h-screen">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-5 lg:px-7 border-b border-sumi-gray/15">
          <div /> {/* spacer */}
          <QuickCapture />
        </div>

        {/* Content */}
        <div className="p-5 lg:p-7 max-w-6xl">{children}</div>
      </main>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
