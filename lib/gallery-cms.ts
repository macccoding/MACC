import fs from "fs";
import path from "path";
import matter from "gray-matter";

const galleryDir = path.join(process.cwd(), "content", "gallery");

export interface GalleryItemCMS {
  num: string;
  category: string;
  aspect: string;
  bg: string;
  caption: string;
  coverImage: string;
  slug: string;
}

export function getAllGalleryItems(): GalleryItemCMS[] {
  if (!fs.existsSync(galleryDir)) return [];

  const files = fs.readdirSync(galleryDir).filter((f) => f.endsWith(".md"));

  const items = files.map((filename) => {
    const filePath = path.join(galleryDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    return {
      num: data.num || "00",
      category: data.category || "STREET / LIFESTYLE",
      aspect: data.aspect || "aspect-square",
      bg: data.bg || "bg-[#14110F]",
      caption: data.caption || "",
      coverImage: data.coverImage || "",
      slug: filename.replace(/\.md$/, ""),
    } as GalleryItemCMS;
  });

  items.sort((a, b) => parseInt(a.num) - parseInt(b.num));
  return items;
}
