"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface InsightData {
  kind: string;
  description: string;
  relatedNodes: string[];
}

interface InsightCardsProps {
  insights: InsightData[];
}

const KIND_LABELS: Record<string, string> = {
  unconnected_cluster: "scattered leaves",
  stale_thread: "fading path",
  emerging_theme: "first light",
};

const ROTATION_MS = 8000;

export default function InsightCards({ insights }: InsightCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next >= insights.length) {
          setDismissed(true);
          return prev;
        }
        return next;
      });
      setVisible(true);
    }, 300);
  }, [insights.length]);

  // Auto-rotate
  useEffect(() => {
    if (dismissed || insights.length === 0) return;

    timerRef.current = setInterval(advance, ROTATION_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance, dismissed, insights.length]);

  // Reset timer on manual interaction
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, ROTATION_MS);
  }, [advance]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  }, []);

  const handleSwipeUp = useCallback(() => {
    resetTimer();
    advance();
  }, [resetTimer, advance]);

  // Touch/swipe tracking
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null) return;
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      touchStartY.current = null;
      if (deltaY > 50) {
        handleSwipeUp();
      }
    },
    [handleSwipeUp]
  );

  if (insights.length === 0 || dismissed) return null;

  const insight = insights[activeIndex];
  if (!insight) return null;

  const kindLabel = KIND_LABELS[insight.kind] || insight.kind;

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
      style={{ width: "min(90vw, 360px)" }}
    >
      <div
        onClick={handleDismiss}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="cursor-pointer rounded-xl px-4 py-3 transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-12px)",
          backgroundColor: "var(--kioku-overlay)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid var(--kioku-border)",
        }}
      >
        {/* Kind label */}
        <div
          className="text-xs tracking-widest uppercase mb-1.5"
          style={{ color: "var(--kioku-muted)" }}
        >
          {kindLabel}
        </div>

        {/* Description */}
        <div
          className="text-sm leading-relaxed"
          style={{ color: "var(--kioku-text)" }}
        >
          {insight.description}
        </div>

        {/* Related nodes */}
        {insight.relatedNodes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {insight.relatedNodes.map((node) => (
              <span
                key={node}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--kioku-accent) 12%, transparent)",
                  color: "var(--kioku-accent)",
                }}
              >
                {node}
              </span>
            ))}
          </div>
        )}

        {/* Progress dots */}
        {insights.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {insights.map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor:
                    i === activeIndex
                      ? "var(--kioku-accent)"
                      : "var(--kioku-muted)",
                  opacity: i === activeIndex ? 1 : 0.4,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
