import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/blog-categories";
import { getTags } from "@/lib/blog-tags";
import PostForm from "../PostForm";

export const metadata = {
  title: "New Post | Dashboard",
};

export default async function NewPostPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/blog");
  }

  const [categories, tags] = await Promise.all([getCategories().catch(() => []), getTags().catch(() => [])]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Admin</span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          New <span className="gradient-text">Post</span>
        </h2>
        <Link
          href="/dashboard/blog"
          className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
        >
          ← Back to posts
        </Link>
      </div>

      <PostForm
        mode="create"
        values={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          featured_image: "",
          category_id: null,
          tagIds: [],
          status: "draft",
        }}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
