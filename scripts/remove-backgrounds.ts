import sharp from "sharp";
import path from "path";
import fs from "fs";

const IMAGES_DIR = path.join(process.cwd(), "public/images");
const BACKUP_DIR = path.join(process.cwd(), "public/images/_originals");

const PARCHMENT_BG = [
  "hero-wanderer.png", "mandeville.png", "forking-paths.png", "the-weight.png",
  "enso-moment.png", "winding-river.png", "divine-brush.png", "spiral-seasons.png",
  "wolf-running.png", "footer-enso.png", "text-title.png", "text-but.png", "text-ebm.png",
  "obj-camera.png", "obj-storefront.png", "obj-code.png", "obj-coffee.png",
  "obj-passport.png", "obj-3dprint.png",
];

const DARK_BG = ["submerged.png", "koi.png"];

async function removeBackground(filename: string, bgType: "parchment" | "dark") {
  const src = path.join(IMAGES_DIR, filename);
  const backup = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(src)) { console.log(`  SKIP: ${filename}`); return; }
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(backup)) fs.copyFileSync(src, backup);

  const image = sharp(src);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  const ch = info.channels;

  for (let i = 0; i < pixels.length; i += ch) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
    if (bgType === "parchment") {
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      const sat = max === 0 ? 0 : (max-min)/max;
      if (r > 210 && g > 195 && b > 170 && sat < 0.15) {
        pixels[i+3] = 0;
      } else if (r > 190 && g > 175 && b > 150 && sat < 0.2) {
        const prox = Math.min((r-190)/30, (g-175)/30, (b-150)/30);
        pixels[i+3] = Math.round(255 * (1 - Math.max(0, Math.min(1, prox)) * 0.7));
      }
    } else {
      const max = Math.max(r,g,b);
      if (max < 50) { pixels[i+3] = 0; }
      else if (max < 80) { pixels[i+3] = Math.round(255 * (max/80)); }
    }
  }

  await sharp(Buffer.from(pixels), { raw: { width: info.width, height: info.height, channels: ch } })
    .png({ compressionLevel: 9 }).toFile(src + ".tmp");
  fs.renameSync(src + ".tmp", src);
  console.log(`  OK: ${filename}`);
}

async function main() {
  console.log("Removing parchment backgrounds...");
  for (const img of PARCHMENT_BG) await removeBackground(img, "parchment");
  console.log("\nRemoving dark backgrounds...");
  for (const img of DARK_BG) await removeBackground(img, "dark");
  console.log("\nDone!");
}
main().catch(console.error);
