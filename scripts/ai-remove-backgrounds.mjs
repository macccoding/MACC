/**
 * Hybrid AI + adaptive color-keying background removal for sumi-e images
 *
 * Strategy:
 *   1. Auto-detect each image's background color from border pixels
 *   2. AI mask — identifies the main subject
 *   3. Ink mask — identifies painted content via color distance from detected bg
 *   4. Combine both masks: keep anything that's painted OR a subject
 *   5. Only the bare paper/background becomes transparent
 */
import { removeBackground } from "@imgly/background-removal-node";
import { readFile, writeFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const ORIGINALS_DIR = "public/images/_originals";
const OUTPUT_DIR = "public/images";

// How far a pixel can be from auto-detected bg and still be considered "paper"
const PARCHMENT_THRESHOLD = 38;
const DARK_THRESHOLD = 35;

// Edge feathering radius
const FEATHER_RADIUS = 3;

// Dark background images
const DARK_BG_IMAGES = new Set(["submerged.png", "koi.png"]);

/**
 * Auto-detect background color by sampling border pixels
 * Takes median of pixels along all 4 edges (10px inset to avoid artifacts)
 */
function detectBackgroundColor(pixels, width, height, channels) {
  const samples = [];
  const inset = 10;
  const step = 5; // sample every 5th pixel along borders

  // Top edge
  for (let x = inset; x < width - inset; x += step) {
    const i = (inset * width + x) * channels;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  // Bottom edge
  for (let x = inset; x < width - inset; x += step) {
    const i = ((height - inset) * width + x) * channels;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  // Left edge
  for (let y = inset; y < height - inset; y += step) {
    const i = (y * width + inset) * channels;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  // Right edge
  for (let y = inset; y < height - inset; y += step) {
    const i = (y * width + (width - inset)) * channels;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }

  // Use median for robustness against edge artifacts
  samples.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  const mid = Math.floor(samples.length / 2);
  const median = samples[mid];

  return { r: median[0], g: median[1], b: median[2] };
}

/**
 * Perceptual color distance (weighted Euclidean in RGB)
 */
function colorDistance(r, g, b, base) {
  const dr = r - base.r;
  const dg = g - base.g;
  const db = b - base.b;
  // Weighted by human perception
  return Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);
}

/**
 * Build ink detection mask based on color distance from background
 */
function buildInkMask(pixels, width, height, base, threshold) {
  const mask = new Uint8Array(width * height);
  const softZone = threshold * 0.4; // Transition zone width

  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];

    const dist = colorDistance(r, g, b, base);

    if (dist > threshold) {
      mask[i] = 255;
    } else if (dist > threshold - softZone) {
      // Smooth transition
      const t = (dist - (threshold - softZone)) / softZone;
      mask[i] = Math.round(t * t * 255); // Quadratic easing for smoother fade
    } else {
      mask[i] = 0;
    }
  }

  return mask;
}

/**
 * Box blur for feathering
 */
function blurMask(mask, width, height, radius) {
  if (radius <= 0) return mask;
  const result = new Uint8Array(mask.length);

  // Horizontal pass
  const temp = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    const size = radius * 2 + 1;
    // Initialize window
    for (let x = -radius; x <= radius; x++) {
      sum += mask[y * width + Math.max(0, Math.min(x, width - 1))];
    }
    for (let x = 0; x < width; x++) {
      temp[y * width + x] = Math.round(sum / size);
      const removeX = Math.max(0, x - radius);
      const addX = Math.min(width - 1, x + radius + 1);
      sum += mask[y * width + addX] - mask[y * width + removeX];
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    const size = radius * 2 + 1;
    for (let y = -radius; y <= radius; y++) {
      sum += temp[Math.max(0, Math.min(y, height - 1)) * width + x];
    }
    for (let y = 0; y < height; y++) {
      result[y * width + x] = Math.round(sum / size);
      const removeY = Math.max(0, y - radius);
      const addY = Math.min(height - 1, y + radius + 1);
      sum += temp[addY * width + x] - temp[removeY * width + x];
    }
  }

  return result;
}

/**
 * Dilate mask to expand foreground regions (catches soft edges)
 */
function dilateMask(mask, width, height, radius) {
  const result = new Uint8Array(mask.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(Math.max(x + dx, 0), width - 1);
          const ny = Math.min(Math.max(y + dy, 0), height - 1);
          maxVal = Math.max(maxVal, mask[ny * width + nx]);
        }
      }
      result[y * width + x] = maxVal;
    }
  }

  return result;
}

async function processImage(filename) {
  const inputPath = path.join(ORIGINALS_DIR, filename);
  const outputPath = path.join(OUTPUT_DIR, filename);
  const isDark = DARK_BG_IMAGES.has(filename);

  console.log(`\n📸 Processing: ${filename}${isDark ? " (dark bg)" : ""}`);
  const start = Date.now();

  try {
    const inputBuffer = await readFile(inputPath);

    // Get raw pixel data
    const { data: pixels, info } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;

    // Step 1: Auto-detect background color
    const bgColor = detectBackgroundColor(pixels, width, height, channels);
    console.log(
      `  🎨 Detected bg: rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`
    );

    // Step 2: AI segmentation
    console.log("  🤖 Running AI segmentation...");
    const inputBlob = new Blob([inputBuffer], { type: "image/png" });
    const resultBlob = await removeBackground(inputBlob, {
      output: { format: "image/png", quality: 1.0 },
    });
    const aiBuffer = Buffer.from(await resultBlob.arrayBuffer());

    // Extract and dilate AI alpha channel
    const { data: aiPixels } = await sharp(aiBuffer)
      .resize(width, height, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let aiMask = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      aiMask[i] = aiPixels[i * 4 + 3];
    }
    // Dilate AI mask to be generous with subject edges
    aiMask = dilateMask(aiMask, width, height, 4);

    // Step 3: Build ink detection mask
    console.log("  🖌️  Building ink detection mask...");
    const threshold = isDark ? DARK_THRESHOLD : PARCHMENT_THRESHOLD;
    let inkMask = buildInkMask(pixels, width, height, bgColor, threshold);

    // Step 4: Combine masks (union)
    console.log("  🔀 Combining masks...");
    const finalMask = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      finalMask[i] = Math.max(aiMask[i], inkMask[i]);
    }

    // Step 5: Feather the final mask edges
    const feathered = blurMask(finalMask, width, height, FEATHER_RADIUS);

    // Step 6: Apply mask to original pixels
    const output = Buffer.from(pixels);
    for (let i = 0; i < width * height; i++) {
      output[i * 4 + 3] = feathered[i];
    }

    // Step 7: Write result
    const resultBuffer = await sharp(output, {
      raw: { width, height, channels: 4 },
    })
      .png({ compressionLevel: 6 })
      .toBuffer();

    await writeFile(outputPath, resultBuffer);

    // Stats
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    let transparent = 0,
      semi = 0,
      opaque = 0;
    for (let i = 0; i < width * height; i++) {
      const a = feathered[i];
      if (a === 0) transparent++;
      else if (a < 250) semi++;
      else opaque++;
    }
    const total = width * height;
    console.log(
      `  ✅ Done in ${elapsed}s — ${((transparent / total) * 100).toFixed(0)}% clear, ${((semi / total) * 100).toFixed(0)}% semi, ${((opaque / total) * 100).toFixed(0)}% opaque`
    );
    return true;
  } catch (err) {
    console.error(`  ❌ Failed: ${err.message}`);
    return false;
  }
}

async function main() {
  const files = await readdir(ORIGINALS_DIR);
  const pngFiles = files.filter((f) => f.endsWith(".png")).sort();

  console.log(`Found ${pngFiles.length} images to process`);
  console.log("Hybrid AI + adaptive color-keying removal\n");

  // Single image mode
  const targetFile = process.argv[2];
  if (targetFile) {
    const filename = pngFiles.find((f) => f.includes(targetFile));
    if (!filename) {
      console.error(`No file matching "${targetFile}" found`);
      process.exit(1);
    }
    await processImage(filename);
    return;
  }

  // Process all
  let success = 0,
    failed = 0;
  for (const file of pngFiles) {
    const ok = await processImage(file);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n🎯 Complete: ${success} succeeded, ${failed} failed`);
}

main().catch(console.error);
