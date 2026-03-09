"use client";

import { useEffect } from "react";

const KIOKU_CSS_VARS: Record<string, string> = {
  "--kioku-bg": "#1A1A1E",
  "--kioku-bg-raised": "#222226",
  "--kioku-text": "#E8E0D4",
  "--kioku-muted": "#6B6B73",
  "--kioku-accent": "#E04D2E",
  "--kioku-border": "rgba(232,224,212,0.10)",
  "--kioku-overlay": "rgba(26,26,30,0.85)",
};

const KIOKU_COLORS = {
  bg: "#1A1A1E",
  bgRaised: "#222226",
  text: "#E8E0D4",
  muted: "#6B6B73",
  accent: "#E04D2E",
  border: "rgba(232,224,212,0.10)",
  overlay: "rgba(26,26,30,0.85)",
} as const;

export function useKiokuTheme() {
  useEffect(() => {
    const root = document.documentElement;

    // Apply CSS variables
    for (const [key, value] of Object.entries(KIOKU_CSS_VARS)) {
      root.style.setProperty(key, value);
    }

    // Set data attribute for CSS selectors
    root.setAttribute("data-theme", "kioku");

    return () => {
      // Remove CSS variables
      for (const key of Object.keys(KIOKU_CSS_VARS)) {
        root.style.removeProperty(key);
      }
      // Remove data attribute
      root.removeAttribute("data-theme");
    };
  }, []);

  return { colors: KIOKU_COLORS };
}
