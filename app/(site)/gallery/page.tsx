import { getAllGalleryItems } from "@/lib/gallery-cms";
import { galleryItems as fallbackItems } from "@/lib/data/gallery";
import GalleryClient from "./GalleryClient";

export default function GalleryPage() {
  // Fetch from CMS (markdown files in content/gallery/)
  const cmsItems = getAllGalleryItems();

  // Use CMS items if available, otherwise fall back to hardcoded data
  const items =
    cmsItems.length > 0
      ? cmsItems.map((item) => ({
          num: item.num,
          category: item.category,
          aspect: item.aspect,
          bg: item.bg,
          caption: item.caption,
          coverImage: item.coverImage,
        }))
      : fallbackItems.map((item) => ({
          ...item,
          coverImage: "",
        }));

  return <GalleryClient items={items} />;
}
