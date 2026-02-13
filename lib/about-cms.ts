import fs from "fs";
import path from "path";
import matter from "gray-matter";

const aboutDir = path.join(process.cwd(), "content", "about");

export interface AboutImages {
  portrait: string;
}

export function getAboutImages(): AboutImages {
  const portraitPath = path.join(aboutDir, "portrait.md");

  let portrait = "";
  if (fs.existsSync(portraitPath)) {
    const raw = fs.readFileSync(portraitPath, "utf-8");
    const { data } = matter(raw);
    portrait = data.coverImage || "";
  }

  return { portrait };
}
