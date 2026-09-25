import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPostById } from "@/lib/blog";
import { getCategories } from "@/lib/blog-categories";
import { getTags } from "@/lib/blog-tags";
import PostForm from "../../PostForm";

export const metadata = {
  title: "Edit Post | Dashboard",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/blog");
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const post = await getPostById(numericId);
  if (!post) notFound();

  const [categories, tags] = await Promise.all([getCategories().catch(() => []), getTags().catch(() => [])]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Admin</span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Edit <span className="gradient-text">Post</span>
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
          >
            Preview ↗
          </Link>
          <Link
            href="/dashboard/blog"
            className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
          >
            ← Back to posts
          </Link>
        </div>
      </div>

      <PostForm
        mode="edit"
        values={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featured_image: post.featured_image ?? "",
          category_id: post.category_id,
          tagIds: post.tags.map((t) => t.id),
          status: post.status,
        }}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
