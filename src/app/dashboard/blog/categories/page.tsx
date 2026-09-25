import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/blog-categories";
import CategoryManager from "./CategoryManager";

export const metadata = {
  title: "Blog Categories | Dashboard",
};

export default async function ManageCategoriesPage() {
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

  const categories = await getCategories().catch(() => []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Admin</span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Blog <span className="gradient-text">Categories</span>
        </h2>
        <Link
          href="/dashboard/blog"
          className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
        >
          ← Back to posts
        </Link>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}
