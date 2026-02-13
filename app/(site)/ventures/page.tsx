import { getAllVentures } from "@/lib/ventures-cms";
import { ventures as fallbackVentures } from "@/lib/data/ventures";
import VenturesClient from "./VenturesClient";

export default function VenturesPage() {
  // Fetch from CMS (markdown files in content/ventures/)
  const cmsVentures = getAllVentures();

  // Use CMS items if available, otherwise fall back to hardcoded data
  const ventures =
    cmsVentures.length > 0
      ? cmsVentures
      : fallbackVentures.map((v) => ({
          num: v.num,
          name: v.name,
          role: v.role,
          year: v.year,
          tagline: v.tagline,
          meta: v.meta,
          accent: v.accent,
          tags: v.tags,
          stats: v.stats,
          images: v.images.map((img) => ({ ...img, src: "" })),
          description: Array.isArray(v.description)
            ? v.description
            : [v.description],
          link: v.link,
          linkLabel: v.linkLabel,
          coverImage: "",
        }));

  return <VenturesClient ventures={ventures} />;
}
