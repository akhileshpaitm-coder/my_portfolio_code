import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCommentsPage } from "@/lib/blog-comments";
import DeleteCommentButton from "./DeleteCommentButton";

export const metadata = {
  title: "Blog Comments | Dashboard",
};

export default async function ManageCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
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
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;
  const result = await getCommentsPage({ page, pageSize: 20 }).catch(() => ({
    comments: [],
    total: 0,
    page: 1,
    totalPages: 1,
  }));

  const buildPageUrl = (p: number) => (p > 1 ? `/dashboard/blog/comments?page=${p}` : "/dashboard/blog/comments");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Admin</span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Blog <span className="gradient-text">Comments</span>
        </h2>
        <Link
          href="/dashboard/blog"
          className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
        >
          ← Back to posts
        </Link>
      </div>

      {result.comments.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-zinc-500">
          No comments yet.
        </div>
      ) : (
        <div className="space-y-3">
          {result.comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="font-semibold text-zinc-200">{comment.user_name}</span>
                <span className="text-zinc-600">
                  on{" "}
                  {comment.post_slug ? (
                    <Link
                      href={`/blog/${comment.post_slug}`}
                      target="_blank"
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      {comment.post_title ?? comment.post_slug}
                    </Link>
                  ) : (
                    <span className="text-zinc-500">a deleted post</span>
                  )}
                </span>
                <span className="text-zinc-600">
                  {new Date(comment.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {comment.parent_id !== null && (
                  <span className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    reply
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap text-zinc-300">{comment.content}</p>
              <div className="mt-3 flex justify-end">
                <DeleteCommentButton id={comment.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          {result.page > 1 && (
            <Link
              href={buildPageUrl(result.page - 1)}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
            >
              ← Prev
            </Link>
          )}
          <span className="text-xs text-zinc-500">
            Page {result.page} of {result.totalPages} · {result.total} comments
          </span>
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
  );
}
