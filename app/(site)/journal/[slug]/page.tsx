import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/journal";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ScrollReveal from "@/app/components/ScrollReveal";
import TextReveal from "@/app/components/TextReveal";
import GlowBorder from "@/app/components/GlowBorder";
import AnimatedButton from "@/app/components/AnimatedButton";
import ArticleInteractions from "./ArticleInteractions";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — MACC`,
    description: post.excerpt,
  };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Navbar />

      {/* Reading Progress Bar */}
      <ArticleInteractions slug={slug} title={post.title} />

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="relative flex min-h-[60vh] flex-col justify-end overflow-hidden bg-bg-primary px-6 pb-16 pt-32 md:px-12">
        {/* Background ghost number */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="select-none font-[family-name:var(--font-playfair)] text-[30vw] font-bold leading-none text-ghost">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-3xl">
          <ScrollReveal>
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {formattedDate}
              </span>
              <span className="rounded-full border border-accent/30 px-3 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-wider text-accent">
                {post.category}
              </span>
              <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {post.readTime}
              </span>
            </div>
          </ScrollReveal>

          <TextReveal
            text={post.title}
            as="h1"
            className="mt-6 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight text-text-primary md:text-6xl"
          />

          <ScrollReveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-primary/60">
              {post.excerpt}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          ARTICLE BODY
      ════════════════════════════════════════════ */}
      <article className="bg-bg-primary px-6 pb-24 pt-16 md:px-12">
        <ScrollReveal>
          <div className="prose-article mx-auto max-w-3xl">
            <MDXRemote source={post.content} />
          </div>
        </ScrollReveal>
      </article>

      {/* ════════════════════════════════════════════
          PREV / NEXT NAVIGATION
      ════════════════════════════════════════════ */}
      <section className="border-t border-white/5 bg-bg-primary px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          {prevPost ? (
            <GlowBorder hoverOnly borderRadius={12}>
              <Link
                href={`/journal/${prevPost.slug}`}
                className="group block rounded-lg border border-white/5 bg-bg-secondary p-6 transition-all hover:border-accent/20"
              >
                <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                  &larr; PREVIOUS
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-xl font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {prevPost.title}
                </h3>
                <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted/50">
                  {prevPost.date} &middot; {prevPost.readTime}
                </p>
              </Link>
            </GlowBorder>
          ) : (
            <div />
          )}

          {nextPost ? (
            <GlowBorder hoverOnly borderRadius={12}>
              <Link
                href={`/journal/${nextPost.slug}`}
                className="group block rounded-lg border border-white/5 bg-bg-secondary p-6 text-right transition-all hover:border-accent/20"
              >
                <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.3em] text-text-muted">
                  NEXT &rarr;
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-xl font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {nextPost.title}
                </h3>
                <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.15em] text-text-muted/50">
                  {nextPost.date} &middot; {nextPost.readTime}
                </p>
              </Link>
            </GlowBorder>
          ) : (
            <div />
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BACK TO JOURNAL
      ════════════════════════════════════════════ */}
      <section className="bg-bg-primary px-6 pb-24 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <AnimatedButton href="/journal" variant="outline">
            &larr; BACK TO JOURNAL
          </AnimatedButton>
        </div>
      </section>

      <Footer />
    </>
  );
}
