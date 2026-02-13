import { getAllVentures } from "@/lib/ventures-cms";
import { ventures as fallbackVentures } from "@/lib/data/ventures";
import HomeClient from "./HomeClient";

export default function HomePage() {
  // Fetch ventures from CMS for preview cards
  const cmsVentures = getAllVentures();

  const ventures =
    cmsVentures.length > 0
      ? cmsVentures.slice(0, 4).map((v) => ({
          num: v.num,
          name: v.name,
          meta: v.meta,
          tags: v.tags,
          description: v.description[0] || "",
          color: v.accent,
          coverImage: v.coverImage,
        }))
      : fallbackVentures.slice(0, 4).map((v) => ({
          num: v.num,
          name: v.name,
          meta: v.meta,
          tags: v.tags,
          description: Array.isArray(v.description)
            ? v.description[0]
            : v.description,
          color: v.accent,
          coverImage: "",
        }));

  return <HomeClient ventures={ventures} />;
}
