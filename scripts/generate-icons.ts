import sharp from "sharp";
import { mkdirSync } from "fs";
import { join } from "path";

const PARCHMENT = "#F5EDE0";
const VERMILLION = "#D03A2C";
const ICONS_DIR = join(process.cwd(), "public", "icons");

mkdirSync(ICONS_DIR, { recursive: true });

function svgIcon(size: number, padding = 0): Buffer {
  const safe = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const kanjiSize = Math.round(safe * 0.45);
  const labelSize = Math.round(safe * 0.09);
  const kanjiY = cy - safe * 0.02;
  const labelY = cy + safe * 0.32;

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${PARCHMENT}" rx="${Math.round(size * 0.18)}"/>
  <text x="${cx}" y="${kanjiY}" text-anchor="middle" dominant-baseline="central"
    font-family="serif" font-size="${kanjiSize}" fill="${VERMILLION}">陳</text>
  <text x="${cx}" y="${labelY}" text-anchor="middle" dominant-baseline="central"
    font-family="monospace" font-size="${labelSize}" fill="${VERMILLION}" opacity="0.6"
    letter-spacing="${Math.round(labelSize * 0.3)}">MikeOS</text>
</svg>`;
  return Buffer.from(svg);
}

async function generate() {
  // icon-192.png
  await sharp(svgIcon(192))
    .png()
    .toFile(join(ICONS_DIR, "icon-192.png"));
  console.log("  icon-192.png");

  // icon-512.png
  await sharp(svgIcon(512))
    .png()
    .toFile(join(ICONS_DIR, "icon-512.png"));
  console.log("  icon-512.png");

  // icon-maskable-512.png (with safe zone padding — 20% each side)
  await sharp(svgIcon(512, 52))
    .png()
    .toFile(join(ICONS_DIR, "icon-maskable-512.png"));
  console.log("  icon-maskable-512.png");

  // apple-touch-icon.png (180x180)
  await sharp(svgIcon(180))
    .png()
    .toFile(join(ICONS_DIR, "apple-touch-icon.png"));
  console.log("  apple-touch-icon.png");

  console.log("Done!");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
