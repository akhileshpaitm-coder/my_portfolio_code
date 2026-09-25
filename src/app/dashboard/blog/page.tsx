import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getPosts } from "@/lib/blog";
import PostRowActions from "./PostRowActions";

export const metadata = {
  title: "Blog Posts | Dashboard",
};

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
  draft: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
};

export default async function ManageBlogPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-3xl">🔒</p>
          <h1 className="mt-3 text-lg font-semibold text-zinc-100">Admin access required</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your account does not have permission to manage the blog.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const statusFilter =
    params.status === "draft" || params.status === "published" ? params.status : "all";
  const highlight = Number(typeof params.highlight === "string" ? params.highlight : "0") || null;

  const result = await getPosts({ status: statusFilter, page: 1, pageSize: 50 }).catch(() => ({
    posts: [],
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Admin</span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Manage <span className="gradient-text">Blog</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/blog/categories"
            className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
          >
            Categories
          </Link>
          <Link
            href="/dashboard/blog/tags"
            className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
          >
            Tags
          </Link>
          <Link
            href="/dashboard/blog/comments"
            className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
          >
            Comments
          </Link>
          <Link
            href="/dashboard/blog/new"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            + New Post
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All"],
            ["published", "Published"],
            ["draft", "Drafts"],
          ] as const
        ).map(([value, label]) => {
          const active = statusFilter === value;
          const href =
            value === "all" ? "/dashboard/blog" : `/dashboard/blog?status=${value}`;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                  : "border border-zinc-800 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <span className="ml-2 text-xs text-zinc-600">{result.total} post(s)</span>
      </div>

      {/* Posts table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800/60">
        {result.posts.length === 0 ? (
          <div className="glass p-10 text-center text-sm text-zinc-500">
            No posts{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""} yet —{" "}
            <Link href="/dashboard/blog/new" className="text-cyan-400 hover:text-cyan-300">
              write your first one
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/60 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                  <th className="px-4 py-3 text-center font-semibold">👍</th>
                  <th className="px-4 py-3 text-center font-semibold">👎</th>
                  <th className="px-4 py-3 text-center font-semibold">💬</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {result.posts.map((post) => (
                  <tr
                    key={post.id}
                    className={`transition-colors hover:bg-zinc-900/40 ${
                      highlight === post.id ? "bg-cyan-500/5" : ""
                    }`}
                  >
                    <td className="max-w-[280px] px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.featured_image ? (
                          <Image
                            src={post.featured_image}
                            alt=""
                            width={48}
                            height={32}
                            className="h-8 w-12 shrink-0 rounded-md border border-zinc-800 object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-xs">
                            📝
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-zinc-100">{post.title}</div>
                          <div className="truncate text-xs text-zinc-600">
                            by {post.author_name} · /blog/{post.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{post.category_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[post.status]}`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-zinc-500">
                      {post.published_at
                        ? post.published_at.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-400">{post.like_count}</td>
                    <td className="px-4 py-3 text-center text-zinc-400">{post.dislike_count}</td>
                    <td className="px-4 py-3 text-center text-zinc-400">{post.comment_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                        >
                          Preview
                        </Link>
                        <Link
                          href={`/dashboard/blog/${post.id}/edit`}
                          className="rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                        >
                          Edit
                        </Link>
                        <PostRowActions id={post.id} title={post.title} status={post.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
