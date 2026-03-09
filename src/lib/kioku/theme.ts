// chat/app/lib/theme.ts
// Wabi-sabi theme system — CSS custom properties for day/night modes

// ── Theme color definitions ──────────────────────────────────────────

export interface ThemeColors {
  /** Primary background */
  bg: string;
  /** Secondary / elevated surface background */
  bgRaised: string;
  /** Primary text color */
  text: string;
  /** Secondary / muted text */
  muted: string;
  /** Accent color (vermillion red) */
  accent: string;
  /** Faint border / separator */
  border: string;
  /** Overlay backdrop (semi-transparent) */
  overlay: string;
}

export const THEMES = {
  light: {
    bg: "#F5F0E8",
    bgRaised: "#EDE8DF",
    text: "#2C2C2C",
    muted: "#8B8680",
    accent: "#D03C1F",
    border: "rgba(44, 44, 44, 0.12)",
    overlay: "rgba(245, 240, 232, 0.85)",
  },
  dark: {
    bg: "#1A1A1E",
    bgRaised: "#222226",
    text: "#E8E0D4",
    muted: "#6B6B73",
    accent: "#E04D2E",
    border: "rgba(232, 224, 212, 0.10)",
    overlay: "rgba(26, 26, 30, 0.85)",
  },
} as const satisfies Record<string, ThemeColors>;

// ── Node type colors (muted Japanese tones) ──────────────────────────

export const NODE_COLORS = {
  person: "#4A5899",   // indigo — calm, human
  place: "#5B7A5B",    // moss — grounded, earthy
  concept: "#A0522D",  // rust — warm, intellectual
  event: "#7B5078",    // plum — rich, temporal
  work: "#4A8B8B",     // teal — creative, productive
  memory: "#B8860B",   // ochre — golden, nostalgic
} as const;

/** Fallback node color for unknown types */
export const NODE_COLOR_DEFAULT = "#7A7568"; // warm gray

/** Get a node color by type tag, with fallback */
export function getNodeColor(tags: string[]): string {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (Object.hasOwn(NODE_COLORS, key)) return NODE_COLORS[key as keyof typeof NODE_COLORS];
  }
  return NODE_COLOR_DEFAULT;
}

// ── CSS custom property mapping ──────────────────────────────────────

/**
 * Maps semantic names to CSS custom property names.
 * Usage: `var(--kioku-bg)` in CSS / Tailwind arbitrary values.
 */
export const THEME_VARS = {
  bg: "--kioku-bg",
  bgRaised: "--kioku-bg-raised",
  text: "--kioku-text",
  muted: "--kioku-muted",
  accent: "--kioku-accent",
  border: "--kioku-border",
  overlay: "--kioku-overlay",
  // Node type colors
  nodePerson: "--kioku-node-person",
  nodePlace: "--kioku-node-place",
  nodeConcept: "--kioku-node-concept",
  nodeEvent: "--kioku-node-event",
  nodeWork: "--kioku-node-work",
  nodeMemory: "--kioku-node-memory",
  nodeDefault: "--kioku-node-default",
} as const;

export type ThemeVarKey = keyof typeof THEME_VARS;
export type ThemeVarName = (typeof THEME_VARS)[ThemeVarKey];

/**
 * Build a Record of CSS custom property name -> value
 * for a given theme mode. Used by useTheme to apply to :root.
 */
export function buildThemeProperties(
  mode: "light" | "dark",
): Record<string, string> {
  const colors = THEMES[mode];
  return {
    [THEME_VARS.bg]: colors.bg,
    [THEME_VARS.bgRaised]: colors.bgRaised,
    [THEME_VARS.text]: colors.text,
    [THEME_VARS.muted]: colors.muted,
    [THEME_VARS.accent]: colors.accent,
    [THEME_VARS.border]: colors.border,
    [THEME_VARS.overlay]: colors.overlay,
    // Node colors are theme-independent (same in both modes)
    [THEME_VARS.nodePerson]: NODE_COLORS.person,
    [THEME_VARS.nodePlace]: NODE_COLORS.place,
    [THEME_VARS.nodeConcept]: NODE_COLORS.concept,
    [THEME_VARS.nodeEvent]: NODE_COLORS.event,
    [THEME_VARS.nodeWork]: NODE_COLORS.work,
    [THEME_VARS.nodeMemory]: NODE_COLORS.memory,
    [THEME_VARS.nodeDefault]: NODE_COLOR_DEFAULT,
  };
}
