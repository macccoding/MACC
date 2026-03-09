// chat/app/lib/sumi.ts
// Sumi-e (墨絵) Canvas renderer — brush-stroke nodes, ink-wash backgrounds
//
// Replaces the pixel-art sprites.ts with organic, brush-like rendering
// using Canvas 2D bezier curves and translucent washes.

import { NODE_COLORS, NODE_COLOR_DEFAULT, getNodeColor } from "./theme";

// ── Re-exports for downstream compatibility ──────────────────────────

export { NODE_COLORS, NODE_COLOR_DEFAULT, getNodeColor };

/**
 * Alias: NODE_COLORS keyed by tag type.
 * Replaces TAG_ACCENTS from sprites.ts.
 */
export const NODE_TYPE_COLORS: Record<string, string> = {
  ...NODE_COLORS,
};

/** Backward-compatible alias for downstream consumers (e.g. NodeDetail). */
export const TAG_ACCENTS: Record<string, string> = NODE_TYPE_COLORS;

/**
 * Get accent color for a set of tags.
 * Drop-in replacement for `getAccentForTags` from sprites.ts.
 */
export function getAccentForTags(tags: string[]): string {
  return getNodeColor(tags);
}

// ── Seeded randomness ────────────────────────────────────────────────

/** Simple hash producing a deterministic float in [0, 1) from a seed. */
function seededRandom(seed: number, offset: number = 0): number {
  let h = (seed + offset * 2654435761) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h % 10000) / 10000;
}

/** Hash a pair of coordinates into a stable seed. */
export function positionSeed(x: number, y: number): number {
  return ((Math.round(x) * 73856093) ^ (Math.round(y) * 19349663)) >>> 0;
}

// ── Color utilities ──────────────────────────────────────────────────

/** Parse a hex color (#RRGGBB) into [r, g, b]. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Build an rgba() string. */
function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── drawSumiNode ─────────────────────────────────────────────────────

/**
 * Draw a sumi-e style node: an irregular brush-stroke circle with a
 * translucent color wash fill, optionally with a vermillion glow ring.
 *
 * @param ctx       Canvas 2D context
 * @param x         Center x
 * @param y         Center y
 * @param radius    Base radius
 * @param nodeType  Primary tag (e.g. "person", "concept") — used for color
 * @param recency   0..1 — higher = more recent = more opaque/saturated
 * @param isSelected Whether this node has a vermillion selection ring
 * @param seed      Deterministic seed for shape randomness (use positionSeed)
 */
export function drawSumiNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  nodeType: string,
  recency: number = 0.5,
  isSelected: boolean = false,
  seed: number = 0,
): void {
  ctx.save();
  const color = NODE_TYPE_COLORS[nodeType] ?? NODE_COLOR_DEFAULT;
  const points = 7; // control points for the irregular circle

  // ── Generate irregular circle control points ──
  const controlPoints: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // Vary radius by +-15% seeded by position + index
    const wobble = 1 + (seededRandom(seed, i) - 0.5) * 0.3;
    const r = radius * wobble;
    controlPoints.push({
      x: x + Math.cos(angle) * r,
      y: y + Math.sin(angle) * r,
    });
  }

  // ── Build the closed bezier path ──
  // We draw the path once for fill and multiple times for the brush stroke.
  function buildPath(): Path2D {
    const path = new Path2D();
    const n = controlPoints.length;

    // Start at the midpoint between last and first point
    const startX = (controlPoints[n - 1].x + controlPoints[0].x) / 2;
    const startY = (controlPoints[n - 1].y + controlPoints[0].y) / 2;
    path.moveTo(startX, startY);

    for (let i = 0; i < n; i++) {
      const curr = controlPoints[i];
      const next = controlPoints[(i + 1) % n];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      path.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }

    path.closePath();
    return path;
  }

  const path = buildPath();

  // ── Fill: translucent wash ──
  // Recency controls opacity: fresh nodes are rich, old ones are faint
  const fillAlpha = 0.15 + recency * 0.35; // 0.15 .. 0.50
  ctx.fillStyle = rgba(color, fillAlpha);
  ctx.fill(path);

  // ── Stroke: brush-like variable-width outline ──
  // We simulate brush-width variation by drawing multiple passes with
  // slight offsets and varying lineWidth, creating an organic edge.
  const baseWidth = Math.max(1.5, radius * 0.12);
  const strokeAlpha = 0.4 + recency * 0.4; // 0.4 .. 0.8

  // Main stroke
  ctx.strokeStyle = rgba(color, strokeAlpha);
  ctx.lineWidth = baseWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(path);

  // Thicker accent on one side (simulates brush pressure)
  ctx.save();
  ctx.beginPath();
  // Clip to the upper-left quadrant for the thick accent
  ctx.rect(x - radius * 1.5, y - radius * 1.5, radius * 1.8, radius * 1.8);
  ctx.clip();
  ctx.strokeStyle = rgba(color, strokeAlpha * 0.5);
  ctx.lineWidth = baseWidth * 1.8;
  ctx.stroke(path);
  ctx.restore();

  // Thin trailing edge (lower-right, lighter)
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + radius * 0.1, y + radius * 0.1, radius * 1.5, radius * 1.5);
  ctx.clip();
  ctx.strokeStyle = rgba(color, strokeAlpha * 0.25);
  ctx.lineWidth = baseWidth * 0.6;
  ctx.stroke(path);
  ctx.restore();

  // ── Selection ring: vermillion glow ──
  if (isSelected) {
    const glowColor = "#D03C1F"; // vermillion
    // Outer glow
    ctx.strokeStyle = rgba(glowColor, 0.25);
    ctx.lineWidth = baseWidth * 3;
    ctx.stroke(path);
    // Inner glow
    ctx.strokeStyle = rgba(glowColor, 0.5);
    ctx.lineWidth = baseWidth * 1.5;
    ctx.stroke(path);
  }
  ctx.restore();
}

// ── drawSumiEdge ─────────────────────────────────────────────────────

/**
 * Draw a sumi-e style edge: a natural bezier curve with brush-like
 * variable width, opacity based on relationship strength.
 *
 * @param ctx       Canvas 2D context
 * @param x1        Source x
 * @param y1        Source y
 * @param x2        Target x
 * @param y2        Target y
 * @param strength  0..1 — controls stroke opacity and width
 */
export function drawSumiEdge(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strength: number = 0.5,
): void {
  ctx.save();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) { ctx.restore(); return; }

  // Perpendicular offset for natural arc (scaled by distance)
  const perpX = -dy / len;
  const perpY = dx / len;
  // Seed the curve direction from endpoint positions
  const seed = positionSeed(x1 + x2, y1 + y2);
  const arcDirection = seededRandom(seed) > 0.5 ? 1 : -1;
  const arcAmount = len * 0.08 * arcDirection;

  // Control point at midpoint, offset perpendicular
  const mx = (x1 + x2) / 2 + perpX * arcAmount;
  const my = (y1 + y2) / 2 + perpY * arcAmount;

  // Base appearance
  const baseAlpha = 0.1 + strength * 0.35; // 0.1 .. 0.45
  const baseWidth = 0.8 + strength * 1.5;  // 0.8 .. 2.3
  const inkColor = "#4A4A4A";

  // Draw multiple thin overlapping strokes for brush texture
  const passes = 3;
  for (let i = 0; i < passes; i++) {
    const offsetScale = (i - 1) * 0.4; // -0.4, 0, 0.4
    const ox = perpX * offsetScale;
    const oy = perpY * offsetScale;
    const passAlpha = baseAlpha * (i === 1 ? 1 : 0.5); // center pass is strongest
    const passWidth = baseWidth * (i === 1 ? 1 : 0.6);

    ctx.beginPath();
    ctx.moveTo(x1 + ox, y1 + oy);
    ctx.quadraticCurveTo(mx + ox, my + oy, x2 + ox, y2 + oy);
    ctx.strokeStyle = rgba(inkColor, passAlpha);
    ctx.lineWidth = passWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.restore();
}

// ── drawInkWashBackground ────────────────────────────────────────────

/** Module-level cache for the pre-rendered ink-wash background. */
let bgCache: {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  w: number;
  h: number;
  dark: boolean;
} | null = null;

/** Invalidate the cached background (e.g. on theme or layout change). */
export function invalidateBgCache(): void {
  bgCache = null;
}

/**
 * Draw an ink-wash (水墨) style background with atmospheric depth,
 * subtle paper texture, and distant mountain silhouettes.
 *
 * The result is cached in an offscreen canvas and reused across frames
 * until the dimensions or theme change.
 *
 * @param ctx    Canvas 2D context
 * @param width  Canvas width (CSS pixels)
 * @param height Canvas height (CSS pixels)
 * @param isDark Whether we're in dark theme mode
 */
export function drawInkWashBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isDark: boolean = true,
): void {
  // Return cached background if dimensions and theme haven't changed
  if (bgCache && bgCache.w === width && bgCache.h === height && bgCache.dark === isDark) {
    ctx.drawImage(bgCache.canvas, 0, 0);
    return;
  }

  // Create an offscreen canvas to render into
  const offscreen =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : (() => {
          const c = document.createElement("canvas");
          c.width = width;
          c.height = height;
          return c;
        })();
  const offCtx = offscreen.getContext("2d")! as CanvasRenderingContext2D;

  // ── Base fill ──
  const baseBg = isDark ? "#1A1A1E" : "#F5F0E8";
  offCtx.fillStyle = baseBg;
  offCtx.fillRect(0, 0, width, height);

  // ── Layered radial gradients for atmospheric depth ──
  // Central subtle light source (like a moon glow)
  const centerGrad = offCtx.createRadialGradient(
    width * 0.5,
    height * 0.35,
    0,
    width * 0.5,
    height * 0.35,
    Math.max(width, height) * 0.7,
  );
  if (isDark) {
    centerGrad.addColorStop(0, "rgba(60, 58, 70, 0.25)");
    centerGrad.addColorStop(0.5, "rgba(35, 33, 40, 0.15)");
    centerGrad.addColorStop(1, "rgba(26, 26, 30, 0)");
  } else {
    centerGrad.addColorStop(0, "rgba(255, 252, 240, 0.3)");
    centerGrad.addColorStop(0.5, "rgba(245, 240, 232, 0.15)");
    centerGrad.addColorStop(1, "rgba(245, 240, 232, 0)");
  }
  offCtx.fillStyle = centerGrad;
  offCtx.fillRect(0, 0, width, height);

  // Off-center atmospheric wash (subtle asymmetry)
  const sideGrad = offCtx.createRadialGradient(
    width * 0.2,
    height * 0.7,
    0,
    width * 0.2,
    height * 0.7,
    Math.max(width, height) * 0.5,
  );
  if (isDark) {
    sideGrad.addColorStop(0, "rgba(50, 45, 55, 0.12)");
    sideGrad.addColorStop(1, "rgba(26, 26, 30, 0)");
  } else {
    sideGrad.addColorStop(0, "rgba(230, 220, 205, 0.12)");
    sideGrad.addColorStop(1, "rgba(245, 240, 232, 0)");
  }
  offCtx.fillStyle = sideGrad;
  offCtx.fillRect(0, 0, width, height);

  // ── Subtle paper texture via noise dots ──
  // Sparse, deterministic noise for a hand-made paper feel
  const dotColor = isDark ? "rgba(255, 255, 255," : "rgba(0, 0, 0,";
  const step = 12; // pixel spacing between potential dots
  for (let py = 0; py < height; py += step) {
    for (let px = 0; px < width; px += step) {
      const hash = ((px * 73856093) ^ (py * 19349663)) >>> 0;
      if (hash % 7 !== 0) continue; // only ~14% of grid points get a dot
      const alpha = 0.015 + (hash % 1000) / 1000 * 0.025; // 0.015 .. 0.04
      offCtx.fillStyle = `${dotColor} ${alpha})`;
      const size = 0.5 + (hash % 3) * 0.3;
      offCtx.fillRect(px, py, size, size);
    }
  }

  // ── Mountain silhouettes (very subtle, bottom of canvas) ──
  drawMountainSilhouettes(offCtx, width, height, isDark);

  // Store in cache and blit to the main context
  bgCache = { canvas: offscreen, w: width, h: height, dark: isDark };
  ctx.drawImage(offscreen, 0, 0);
}

/**
 * Draw soft, distant mountain shapes near the bottom of the canvas.
 * Extremely subtle — 5-10% opacity — like a distant ink wash.
 */
function drawMountainSilhouettes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isDark: boolean,
): void {
  const mountainColor = isDark
    ? "rgba(80, 75, 90, 0.07)"   // faint cool gray
    : "rgba(120, 115, 100, 0.05)"; // faint warm gray

  // Layer 1: distant range (taller, fainter)
  ctx.fillStyle = mountainColor;
  ctx.beginPath();
  ctx.moveTo(0, height);

  const peaks1 = [
    { x: 0, y: height * 0.88 },
    { x: width * 0.12, y: height * 0.82 },
    { x: width * 0.25, y: height * 0.86 },
    { x: width * 0.38, y: height * 0.80 },
    { x: width * 0.52, y: height * 0.84 },
    { x: width * 0.65, y: height * 0.78 },
    { x: width * 0.78, y: height * 0.83 },
    { x: width * 0.90, y: height * 0.81 },
    { x: width, y: height * 0.85 },
  ];

  ctx.moveTo(0, height);
  ctx.lineTo(peaks1[0].x, peaks1[0].y);
  for (let i = 0; i < peaks1.length - 1; i++) {
    const curr = peaks1[i];
    const next = peaks1[i + 1];
    const cpx = (curr.x + next.x) / 2;
    const cpy = Math.min(curr.y, next.y) - (Math.abs(next.y - curr.y) * 0.3);
    ctx.quadraticCurveTo(cpx, cpy, next.x, next.y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Layer 2: closer range (shorter, slightly more opaque)
  const mountainColor2 = isDark
    ? "rgba(70, 65, 80, 0.05)"
    : "rgba(140, 130, 115, 0.04)";
  ctx.fillStyle = mountainColor2;
  ctx.beginPath();
  ctx.moveTo(0, height);

  const peaks2 = [
    { x: 0, y: height * 0.92 },
    { x: width * 0.15, y: height * 0.88 },
    { x: width * 0.30, y: height * 0.91 },
    { x: width * 0.45, y: height * 0.87 },
    { x: width * 0.60, y: height * 0.90 },
    { x: width * 0.75, y: height * 0.86 },
    { x: width * 0.88, y: height * 0.89 },
    { x: width, y: height * 0.91 },
  ];

  ctx.lineTo(peaks2[0].x, peaks2[0].y);
  for (let i = 0; i < peaks2.length - 1; i++) {
    const curr = peaks2[i];
    const next = peaks2[i + 1];
    const cpx = (curr.x + next.x) / 2;
    const cpy = Math.min(curr.y, next.y) - (Math.abs(next.y - curr.y) * 0.25);
    ctx.quadraticCurveTo(cpx, cpy, next.x, next.y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
}

// ── drawNodeLabel ────────────────────────────────────────────────────

/**
 * Draw a clean label below a node, with subtle shadow for readability
 * on both light and dark backgrounds.
 *
 * @param ctx     Canvas 2D context
 * @param x       Center x (text is centered here)
 * @param y       Node center y (label is placed below)
 * @param name    Text to display
 * @param radius  Node radius — label is offset below the circle edge
 * @param font    CSS font string (defaults to clean sans-serif)
 * @param isDark  Whether we're in dark mode
 */
export function drawNodeLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string,
  radius: number = 0,
  font: string = '11px -apple-system, "Segoe UI", sans-serif',
  isDark: boolean = true,
): void {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Subtle shadow for readability
  const shadowColor = isDark
    ? "rgba(0, 0, 0, 0.6)"
    : "rgba(0, 0, 0, 0.15)";
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  // Text color
  ctx.fillStyle = isDark ? "#E8E0D4" : "#2C2C2C";
  ctx.fillText(name, x, y + radius + 6); // offset below node edge

  ctx.restore();
}
