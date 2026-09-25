import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import { auth } from "@/lib/auth";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { getReactionCounts, getMyReaction } from "@/lib/blog-reactions";
import { getCommentTree, countComments } from "@/lib/blog-comments";
import ArticleEnhancer from "./CodeBlocks";
import ShareButton from "./ShareButtons";
import ReactionBar from "./ReactionBar";
import CommentSection from "./CommentSection";

type Props = { params: Promise<{ slug: string }> };

/** Prebuild nothing — posts change often and drafts must stay uncached. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, { allowDrafts: true }).catch(() => null); // already guarded

  if (!post) {
    return { title: "Post not found | Akhilesh Prajapati" };
  }

  const description = post.excerpt.slice(0, 160);
  return {
    title: `${post.title} | Akhilesh Prajapati`,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    authors: [{ name: post.author_name }],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: (post.published_at ?? post.created_at).toISOString(),
      modifiedTime: post.updated_at.toISOString(),
      authors: [post.author_name],
      tags: post.tags.map((t) => t.name),
      images: post.featured_image
        ? [{ url: post.featured_image, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: post.featured_image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, { allowDrafts: true }).catch(() => null);
  if (!post) notFound();

  const session = await auth();
  const viewer = session?.user
    ? { id: Number(session.user.id), name: session.user.name ?? "User", role: session.user.role }
    : null;

  // Drafts are only visible to their author / admins.
  if (post.status === "draft" && session?.user?.role !== "admin") {
    notFound();
  }

  // Enrichment queries degrade to zeros/empty when the DB hiccups — the
  // article itself already loaded, so never 500 the whole page for counts.
  const [reactionCounts, myReaction, commentTree, commentCount, related] = await Promise.all([
    getReactionCounts(post.id).catch(() => ({ likes: 0, dislikes: 0 })),
    viewer
      ? getMyReaction(post.id, viewer.id).catch(() => null)
      : Promise.resolve(null),
    getCommentTree(post.id).catch(() => []),
    countComments(post.id).catch(() => 0),
    getRelatedPosts(post, 3).catch(() => []),
  ]);

  const canonicalUrl = `/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image ? [post.featured_image] : undefined,
    datePublished: (post.published_at ?? post.created_at).toISOString(),
    dateModified: post.updated_at.toISOString(),
    author: { "@type": "Person", name: post.author_name },
    publisher: { "@type": "Person", name: "Akhilesh Prajapati" },
    mainEntityOfPage: canonicalUrl,
    keywords: post.tags.map((t) => t.name).join(", "),
    commentCount: commentCount,
  };

  return (
    <main className="bg-background">
      <SiteNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pt-28">
        <article className="relative px-4 pb-16">
          <div className="absolute top-0 left-0 h-80 w-80 rounded-full bg-cyan-500/5 blur-[120px]" />

          <div className="relative mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-xs text-zinc-600" aria-label="Breadcrumb">
              <Link href="/blog" className="transition-colors hover:text-cyan-300">
                Blog
              </Link>
              <span aria-hidden>/</span>
              <span className="truncate text-zinc-500">{post.title}</span>
            </nav>

            {/* Category + tags */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {post.category_name && (
                <Link
                  href={`/blog?category=${post.category_slug}`}
                  className="rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-600/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-cyan-300 uppercase ring-1 ring-cyan-500/20 transition-colors hover:ring-cyan-500/50"
                >
                  {post.category_name}
                </Link>
              )}
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="rounded-full border border-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="mb-6 text-3xl leading-tight font-bold text-zinc-100 sm:text-4xl">
              {post.title}
            </h1>

            {/* Author + dates */}
            <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-sm font-bold text-cyan-300">
                  {post.author_name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold text-zinc-200">{post.author_name}</p>
                  <p className="text-xs text-zinc-500">
                    <time dateTime={(post.published_at ?? post.created_at).toISOString()}>
                      {formatDate(post.published_at ?? post.created_at)}
                    </time>
                    {post.published_at && post.updated_at.getTime() - post.published_at.getTime() > 86_400_000 && (
                      <span> · Updated {formatDate(post.updated_at)}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {post.status === "draft" && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                    Draft preview
                  </span>
                )}
                <ShareButton title={post.title} url={canonicalUrl} />
              </div>
            </div>

            {/* Featured image */}
            {post.featured_image && (
              <Image
                src={post.featured_image}
                alt={post.title}
                width={1200}
                height={675}
                priority
                className="mb-10 w-full rounded-2xl border border-zinc-800 object-cover"
              />
            )}

            {/* Article body — sanitized server-side, enhanced client-side */}
            <div className="post-content">
              <ArticleEnhancer contentHtml={post.content} />
            </div>

            {/* Reactions */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/60 pt-8">
              <ReactionBar
                postId={post.id}
                initialLikes={reactionCounts.likes}
                initialDislikes={reactionCounts.dislikes}
                initialMyReaction={myReaction}
                isLoggedIn={viewer !== null}
              />
              <span className="text-xs text-zinc-600">
                {commentCount} comment{commentCount === 1 ? "" : "s"}
              </span>
            </div>

            {/* Comments */}
            <CommentSection
              postId={post.id}
              initialTree={commentTree}
              initialCount={commentCount}
              viewer={viewer}
            />

            {/* Related posts */}
            {related.length > 0 && (
              <section className="mt-16 border-t border-zinc-800/60 pt-10">
                <h2 className="mb-6 text-lg font-bold text-zinc-100">
                  Keep <span className="gradient-text">reading</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/blog/${rel.slug}`}
                      className="skill-card group rounded-xl p-4"
                    >
                      <p className="mb-1.5 line-clamp-2 text-sm leading-snug font-semibold text-zinc-200 group-hover:text-cyan-300">
                        {rel.title}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {formatDate(rel.published_at ?? rel.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
