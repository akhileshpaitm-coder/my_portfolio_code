import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { SiteNavbar, SiteFooter } from "@/app/components/PageChrome";
import { getPosts } from "@/lib/blog";
import { getCategories } from "@/lib/blog-categories";
import { getTags } from "@/lib/blog-tags";
import BlogSearch from "./BlogSearch";

export const metadata: Metadata = {
  title: "Blog | Akhilesh Prajapati",
  description:
    "Articles, tutorials and notes on full-stack development — JavaScript, TypeScript, React, Next.js, Node.js and more.",
  alternates: { canonical: "/blog" },
};

const PAGE_SIZE = 9;

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function PostCard({ post }: { post: Awaited<ReturnType<typeof getPosts>>["posts"][number] }) {
  return (
    <article className="skill-card group flex h-full flex-col overflow-hidden rounded-2xl">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-zinc-900">
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-500/10 to-purple-600/10 text-4xl">
            📝
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {/* Category */}
        {post.category_name && (
          <Link
            href={`/blog?category=${post.category_slug}`}
            className="mb-3 w-fit rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-600/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-cyan-300 uppercase ring-1 ring-cyan-500/20 transition-colors hover:ring-cyan-500/50"
          >
            {post.category_name}
          </Link>
        )}

        <h3 className="mb-2 text-lg leading-snug font-bold text-zinc-100 transition-colors group-hover:text-cyan-300">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-500">{post.excerpt}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className="rounded-full border border-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                #{tag.name}
              </Link>
            ))}
            {post.tags.length > 3 && (
              <span className="text-[11px] text-zinc-600">+{post.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto border-t border-zinc-800/60 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-[10px] font-bold text-cyan-300">
                {post.author_name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{post.author_name}</span>
              <span aria-hidden>·</span>
              <time dateTime={(post.published_at ?? post.created_at).toISOString()}>
                {formatDate(post.published_at ?? post.created_at)}
              </time>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 text-xs text-zinc-500">
              <span className="flex items-center gap-1" title="Likes">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                </svg>
                {post.like_count}
              </span>
              <span className="flex items-center gap-1" title="Comments">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                {post.comment_count}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 w-fit rounded-full border border-zinc-800 px-4 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:border-cyan-500/40 hover:text-cyan-300"
        >
          Read More →
        </Link>
      </div>
    </article>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const tag = typeof params.tag === "string" ? params.tag : undefined;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  // DB hiccup → empty state instead of a 500 (same pattern as ProjectsSection).
  const categories = await getCategories().catch(() => []);
  const activeCategory = category ? categories.find((c) => c.slug === category) ?? null : null;

  const [result, allTags] = await Promise.all([
    getPosts({
      search: q,
      categoryId: activeCategory?.id ?? null,
      tagSlug: tag,
      status: "published",
      page,
      pageSize: PAGE_SIZE,
    }).catch(() => ({
      posts: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      totalPages: 1,
    })),
    getTags().catch(() => []),
  ]);

  const activeTag = tag ? allTags.find((t) => t.slug === tag) ?? null : null;
  const hasFilters = Boolean(q || activeCategory || activeTag);

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (activeCategory) sp.set("category", activeCategory.slug);
    if (activeTag) sp.set("tag", activeTag.slug);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  return (
    <main className="bg-background">
      <SiteNavbar active="/blog" />
      <div className="pt-28">
        <section className="relative px-4 pb-16">
          <div className="absolute top-0 left-0 h-80 w-80 rounded-full bg-cyan-500/5 blur-[120px]" />

          <div className="relative mx-auto max-w-5xl">
            {/* Heading */}
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">Blog</span>
              <div className="section-bar" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
              Notes from the <span className="gradient-text">terminal</span>
            </h1>
            <p className="mb-10 max-w-2xl text-zinc-500">
              Tutorials, deep dives and field notes on building software — from JavaScript and
              TypeScript to cloud architecture.
            </p>

            {/* Search */}
            <div className="mb-6 max-w-xl">
              <Suspense fallback={<div className="h-12" />}>
                <BlogSearch />
              </Suspense>
            </div>

            {/* Category chips */}
            {categories.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/blog"
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    !activeCategory
                      ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                      : "border border-zinc-800 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300"
                  }`}
                >
                  All
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/blog?category=${c.slug}`}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      activeCategory?.id === c.id
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                        : "border border-zinc-800 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300"
                    }`}
                  >
                    {c.name}
                    <span className="ml-1.5 text-[10px] opacity-70">{c.post_count}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Tag chips */}
            {allTags.length > 0 && (
              <div className="mb-10 flex flex-wrap items-center gap-1.5">
                {allTags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/blog?tag=${t.slug}`}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                      activeTag?.id === t.id
                        ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/50"
                        : "bg-zinc-900/60 text-zinc-500 ring-1 ring-zinc-800 hover:text-cyan-300 hover:ring-cyan-500/30"
                    }`}
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Active filter indicator */}
            {hasFilters && (
              <p className="mb-6 text-xs text-zinc-500">
                {result.total} result{result.total === 1 ? "" : "s"}
                {q && <> for “<span className="text-zinc-300">{q}</span>”</>}
                {activeCategory && <> in <span className="text-cyan-300">{activeCategory.name}</span></>}
                {activeTag && <> tagged <span className="text-cyan-300">#{activeTag.name}</span></>}
                {" · "}
                <Link href="/blog" className="text-cyan-400 hover:text-cyan-300">
                  Clear filters
                </Link>
              </p>
            )}

            {/* Grid */}
            {result.posts.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-4xl">🗂️</p>
                <h2 className="mt-4 text-lg font-semibold text-zinc-100">
                  {hasFilters ? "No posts match your filters" : "No posts yet"}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {hasFilters
                    ? "Try a different search term or clear the filters."
                    : "New articles are on the way — check back soon."}
                </p>
                {hasFilters && (
                  <Link
                    href="/blog"
                    className="mt-6 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
                  >
                    Clear filters
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-6 stagger sm:grid-cols-2 lg:grid-cols-3">
                {result.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {result.totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
                {result.page > 1 && (
                  <Link
                    href={buildPageUrl(result.page - 1)}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    ← Prev
                  </Link>
                )}
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={buildPageUrl(p)}
                    aria-current={p === result.page ? "page" : undefined}
                    className={`h-9 w-9 rounded-lg text-center text-sm leading-9 transition-colors ${
                      p === result.page
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold text-white"
                        : "border border-zinc-800 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {result.page < result.totalPages && (
                  <Link
                    href={buildPageUrl(result.page + 1)}
                    className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
