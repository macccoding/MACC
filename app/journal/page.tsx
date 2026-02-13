import { getAllPosts } from "@/lib/journal";
import JournalClient from "./JournalClient";

export default function JournalPage() {
  const posts = getAllPosts();

  const postsData = posts.map((post, i) => ({
    num: String(i + 1).padStart(2, "0"),
    title: post.title,
    date: new Date(post.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).toUpperCase(),
    category: post.category,
    readTime: post.readTime.toUpperCase(),
    excerpt: post.excerpt,
    featured: post.featured,
    slug: post.slug,
  }));

  return <JournalClient posts={postsData} />;
}
