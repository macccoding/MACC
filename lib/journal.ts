import fs from "fs";
import path from "path";
import matter from "gray-matter";

const journalDir = path.join(process.cwd(), "content", "journal");

export interface PostMeta {
  title: string;
  date: string;
  category: string;
  readTime: string;
  excerpt: string;
  slug: string;
  featured: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

export function getAllPosts(): Post[] {
  const files = fs.readdirSync(journalDir).filter((f) => f.endsWith(".md"));

  const posts = files.map((filename) => {
    const filePath = path.join(journalDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    return {
      title: data.title,
      date: data.date,
      category: data.category,
      readTime: data.readTime,
      excerpt: data.excerpt,
      slug: data.slug,
      featured: data.featured ?? false,
      content,
    } as Post;
  });

  // Sort by date descending (newest first)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug);
}
