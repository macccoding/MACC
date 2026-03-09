"use client";

// Google Fonts loaded via CSS @import in globals.css or dynamically
// Yuji Syuku for headings, Zen Kaku Gothic New for body

import { useState, useEffect, useCallback, useRef } from "react";
import Garden from "@/components/kioku/Garden";
import ChatPanel from "@/components/kioku/ChatPanel";
import NodeDetail from "@/components/kioku/NodeDetail";
import InsightCards from "@/components/kioku/InsightCards";
import InkTransition from "@/components/kioku/InkTransition";
import { useKiokuTheme } from "@/hooks/useKiokuTheme";

type Tab = "garden" | "chat";

interface InsightData {
  kind: string;
  description: string;
  relatedNodes: string[];
}

export default function KnowledgePage() {
  const { colors } = useKiokuTheme();
  const [tab, setTab] = useState<Tab>("garden");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [showInk, setShowInk] = useState(true);
  const [inkDirection, setInkDirection] = useState<"in" | "out">("in");
  const [contentReady, setContentReady] = useState(false);
  const gardenRefreshRef = useRef(0);

  // Fetch insights
  useEffect(() => {
    fetch("/api/kioku/insights")
      .then((r) => r.json())
      .then((data) => setInsights(data.insights || []))
      .catch(() => {});
  }, []);

  // Ink transition on mount
  useEffect(() => {
    // Small delay so the canvas has time to mount
    const timer = setTimeout(() => setShowInk(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleInkComplete = useCallback(() => {
    if (inkDirection === "in") {
      setContentReady(true);
      setShowInk(false);
    }
  }, [inkDirection]);

  const handleNodeClick = useCallback((slug: string) => {
    setSelectedNode(slug);
  }, []);

  const handleNodesChanged = useCallback(() => {
    gardenRefreshRef.current += 1;
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Determine if desktop
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      className="fixed inset-0 md:relative md:inset-auto flex flex-col h-screen md:h-[calc(100vh-2rem)]"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "'Zen Kaku Gothic New', sans-serif",
      }}
    >
      {/* Ink transition overlay */}
      <InkTransition
        active={showInk}
        direction={inkDirection}
        onComplete={handleInkComplete}
      />

      {/* Tab bar */}
      <nav
        className="flex items-center px-4 pt-3 pb-2 shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {(
          [
            { key: "garden" as Tab, label: "庭 Garden" },
            { key: "chat" as Tab, label: "話 Chat" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 text-sm transition-all duration-200 relative"
            style={{
              color: tab === key ? colors.accent : colors.muted,
              fontFamily: "'Yuji Syuku', serif",
            }}
          >
            {label}
            {tab === key && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                style={{
                  width: "60%",
                  backgroundColor: colors.accent,
                }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Garden tab */}
        {tab === "garden" && (
          <div className="w-full h-full relative">
            <Garden
              onSelectNode={handleNodeClick}
              className="w-full h-full"
            />
            <InsightCards insights={insights} />
          </div>
        )}

        {/* Chat tab */}
        {tab === "chat" && (
          <>
            {isDesktop ? (
              // Desktop: split layout
              <div className="flex h-full">
                <div className="w-[60%] relative">
                  <Garden
                    onSelectNode={handleNodeClick}
                    className="w-full h-full"
                  />
                </div>
                <div
                  className="w-[40%] h-full"
                  style={{ borderLeft: `1px solid ${colors.border}` }}
                >
                  <ChatPanel
                    onNodeClick={handleNodeClick}
                    onNodesChanged={handleNodesChanged}
                  />
                </div>
              </div>
            ) : (
              // Mobile: full-screen chat
              <div className="h-full flex flex-col">
                <button
                  onClick={() => setTab("garden")}
                  className="px-4 py-2 text-sm self-start"
                  style={{
                    color: colors.muted,
                    fontFamily: "'Yuji Syuku', serif",
                  }}
                >
                  ← 庭
                </button>
                <div className="flex-1">
                  <ChatPanel
                    onNodeClick={handleNodeClick}
                    onNodesChanged={handleNodesChanged}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Node detail overlay */}
      <NodeDetail
        slug={selectedNode}
        onClose={handleCloseDetail}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}
