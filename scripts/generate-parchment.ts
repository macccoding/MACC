/**
 * Generate a seamless 512x512 parchment paper texture procedurally.
 *
 * Base color: warm cream (#F5EDE0 / rgb(245, 237, 224))
 * Adds subtle per-pixel noise/grain variation (±8 on each channel).
 *
 * Usage:  npx tsx scripts/generate-parchment.ts
 * Output: public/textures/parchment-seamless.png
 */

import sharp from "sharp";
import path from "path";

const SIZE = 512;
const BASE_R = 245;
const BASE_G = 237;
const BASE_B = 224;
const NOISE_RANGE = 8; // ±8 per channel

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}

// Simple mulberry32 PRNG for reproducibility
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const rng = mulberry32(42);
  const channels = 3; // RGB
  const data = Buffer.alloc(SIZE * SIZE * channels);

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = (y * SIZE + x) * channels;

      // Generate noise offset for each channel
      const nr = Math.round((rng() * 2 - 1) * NOISE_RANGE);
      const ng = Math.round((rng() * 2 - 1) * NOISE_RANGE);
      const nb = Math.round((rng() * 2 - 1) * NOISE_RANGE);

      data[idx + 0] = clamp(BASE_R + nr, 0, 255);
      data[idx + 1] = clamp(BASE_G + ng, 0, 255);
      data[idx + 2] = clamp(BASE_B + nb, 0, 255);
    }
  }

  const outDir = path.resolve(__dirname, "../public/textures");
  const outPath = path.join(outDir, "parchment-seamless.png");

  await sharp(data, {
    raw: { width: SIZE, height: SIZE, channels },
  })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(`Parchment texture saved to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
