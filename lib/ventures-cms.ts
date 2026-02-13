import fs from "fs";
import path from "path";
import matter from "gray-matter";

const venturesDir = path.join(process.cwd(), "content", "ventures");

export interface VentureCMS {
  num: string;
  name: string;
  role: string;
  year: string;
  tagline: string;
  meta: string;
  accent: string;
  tags: string[];
  stats: { value: string; label: string }[];
  images: { aspect: string; label: string; src: string }[];
  description: string[];
  link: string;
  linkLabel: string;
  coverImage: string;
}

export function getAllVentures(): VentureCMS[] {
  if (!fs.existsSync(venturesDir)) return [];

  const files = fs.readdirSync(venturesDir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) return [];

  const items = files.map((filename) => {
    const filePath = path.join(venturesDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    // Split markdown body into paragraphs for the description
    const description = content
      .trim()
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0);

    return {
      num: data.num || "00",
      name: data.title || "",
      role: data.role || "",
      year: data.year || "",
      tagline: data.tagline || "",
      meta: data.meta || "",
      accent: data.accent || "#E5B820",
      tags: data.tags || [],
      stats: data.stats || [],
      images: (data.images || []).map((img: { aspect?: string; label?: string; src?: string }) => ({
        aspect: img.aspect || "aspect-square",
        label: img.label || "",
        src: img.src || "",
      })),
      description,
      link: data.link || "#",
      linkLabel: data.linkLabel || "LEARN MORE",
      coverImage: data.coverImage || "",
    } as VentureCMS;
  });

  items.sort((a, b) => parseInt(a.num) - parseInt(b.num));
  return items;
}
