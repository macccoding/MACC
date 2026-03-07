/**
 * Refine background removal for problem images
 *
 * Two fixes applied:
 * 1. Crush near-background semi-transparent pixels to fully transparent
 *    (eliminates the warm rectangular ghost)
 * 2. Color-shift remaining semi-transparent pixels toward site parchment
 *    (any surviving ghosting becomes invisible)
 */
import { readFile, writeFile } from "fs/promises";
import sharp from "sharp";

// Site parchment color (from CSS --parchment variable)
const SITE_BG = { r: 237, g: 228, b: 214 };

// Images that need refinement and their specific settings
const REFINE_LIST = [
  // Text images — aggressive removal, text strokes are very dark
  { file: "text-title.png", crushThreshold: 0.6, colorShift: 0.8 },
  { file: "text-but.png", crushThreshold: 0.6, colorShift: 0.8 },
  { file: "text-ebm.png", crushThreshold: 0.6, colorShift: 0.8 },
  // Objects — moderate removal
  { file: "obj-camera.png", crushThreshold: 0.5, colorShift: 0.7 },
  { file: "obj-storefront.png", crushThreshold: 0.5, colorShift: 0.7 },
  { file: "obj-coffee.png", crushThreshold: 0.5, colorShift: 0.7 },
  { file: "obj-code.png", crushThreshold: 0.5, colorShift: 0.7 },
  { file: "obj-passport.png", crushThreshold: 0.5, colorShift: 0.7 },
  { file: "obj-3dprint.png", crushThreshold: 0.5, colorShift: 0.7 },
  // Artistic images — gentle touch, preserve washes
  { file: "footer-enso.png", crushThreshold: 0.4, colorShift: 0.6 },
  { file: "enso-moment.png", crushThreshold: 0.35, colorShift: 0.5 },
  { file: "divine-brush.png", crushThreshold: 0.3, colorShift: 0.4 },
  { file: "hero-wanderer.png", crushThreshold: 0.3, colorShift: 0.5 },
  { file: "mandeville.png", crushThreshold: 0.3, colorShift: 0.5 },
  { file: "forking-paths.png", crushThreshold: 0.3, colorShift: 0.5 },
  { file: "the-weight.png", crushThreshold: 0.3, colorShift: 0.5 },
  { file: "spiral-seasons.png", crushThreshold: 0.3, colorShift: 0.5 },
  { file: "wolf-running.png", crushThreshold: 0.3, colorShift: 0.5 },
  { file: "winding-river.png", crushThreshold: 0.3, colorShift: 0.5 },
];

/**
 * Detect background color from the original image borders
 */
function detectBgColor(pixels, width, height) {
  const samples = [];
  const step = 5;
  const inset = 8;
  for (let x = inset; x < width - inset; x += step) {
    let i = (inset * width + x) * 4;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    i = ((height - inset) * width + x) * 4;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  for (let y = inset; y < height - inset; y += step) {
    let i = (y * width + inset) * 4;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    i = (y * width + (width - inset)) * 4;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  samples.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  const mid = samples[Math.floor(samples.length / 2)];
  return { r: mid[0], g: mid[1], b: mid[2] };
}

/**
 * How similar is this pixel to the detected background?
 * Returns 0.0 (identical to bg) to 1.0 (very different from bg)
 */
function bgSimilarity(r, g, b, bg) {
  const dr = (r - bg.r) / 255;
  const dg = (g - bg.g) / 255;
  const db = (b - bg.b) / 255;
  return Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);
}

async function refineImage(config) {
  const { file, crushThreshold, colorShift } = config;
  const imgPath = `public/images/${file}`;
  const origPath = `public/images/_originals/${file}`;

  console.log(`\n🔧 Refining: ${file}`);

  // Read the already-processed image (has alpha from AI removal)
  const { data: processed, info } = await sharp(imgPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Read original to detect its background color
  const { data: original } = await sharp(origPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bgColor = detectBgColor(original, width, height);
  console.log(`  bg: rgb(${bgColor.r},${bgColor.g},${bgColor.b})`);

  const output = Buffer.from(processed);
  let crushed = 0;
  let shifted = 0;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = output[idx];
    const g = output[idx + 1];
    const b = output[idx + 2];
    const a = output[idx + 3];

    if (a === 0) continue; // Already transparent
    if (a === 255) continue; // Fully opaque — leave alone (solid ink)

    // How similar is this pixel's color to the image's background?
    const similarity = bgSimilarity(r, g, b, bgColor);

    // If very similar to the original bg AND semi-transparent → crush to zero
    // This eliminates the warm rectangular ghost
    if (similarity < crushThreshold * 0.3) {
      // Very close to bg — make fully transparent
      output[idx + 3] = 0;
      crushed++;
      continue;
    }

    if (similarity < crushThreshold * 0.5) {
      // Moderately close — reduce alpha significantly
      const factor = similarity / (crushThreshold * 0.5);
      output[idx + 3] = Math.round(a * factor * factor);
      crushed++;
    }

    // Color-shift remaining semi-transparent pixels toward site parchment
    // Stronger shift for more transparent pixels (they cause the ghosting)
    if (output[idx + 3] > 0 && output[idx + 3] < 240) {
      const transparency = 1 - output[idx + 3] / 255; // 0=opaque, 1=transparent
      const shiftAmount = transparency * colorShift;
      output[idx] = Math.round(r + (SITE_BG.r - r) * shiftAmount);
      output[idx + 1] = Math.round(g + (SITE_BG.g - g) * shiftAmount);
      output[idx + 2] = Math.round(b + (SITE_BG.b - b) * shiftAmount);
      shifted++;
    }
  }

  const resultBuffer = await sharp(output, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 6 })
    .toBuffer();

  await writeFile(imgPath, resultBuffer);

  // Stats
  let transparent = 0, semi = 0, opaque = 0;
  for (let i = 0; i < width * height; i++) {
    const a = output[i * 4 + 3];
    if (a === 0) transparent++;
    else if (a < 250) semi++;
    else opaque++;
  }
  const total = width * height;
  console.log(`  crushed: ${crushed}, color-shifted: ${shifted}`);
  console.log(`  ${((transparent/total)*100).toFixed(0)}% clear, ${((semi/total)*100).toFixed(0)}% semi, ${((opaque/total)*100).toFixed(0)}% opaque`);
}

async function main() {
  const target = process.argv[2];

  if (target) {
    const config = REFINE_LIST.find((c) => c.file.includes(target));
    if (!config) {
      console.error(`No config for "${target}"`);
      process.exit(1);
    }
    await refineImage(config);
    return;
  }

  console.log(`Refining ${REFINE_LIST.length} images...`);
  for (const config of REFINE_LIST) {
    await refineImage(config);
  }
  console.log("\n✅ All refined");
}

main().catch(console.error);
