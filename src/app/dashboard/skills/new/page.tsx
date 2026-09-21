import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSkillCategories, getSkillNames } from "@/lib/skills";
import SkillForm from "../SkillForm";

export const metadata = {
  title: "Add Skill | Dashboard",
};

/**
 * Admin: create a new skill. Pre-fills the category when
 * ?category=Frontend is passed from the "Add to this category" button.
 */
export default async function NewSkillPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/skills");
  }

  const { category } = await searchParams;
  const [existingNames, categories] = await Promise.all([
    getSkillNames(),
    getSkillCategories(),
  ]);

  // Only pre-fill with a category that already exists.
  const prefill = categories.find(
    (c) => c.toLowerCase() === (category ?? "").trim().toLowerCase()
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Admin
        </span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Add <span className="gradient-text">Skill</span>
        </h2>
        <Link
          href="/dashboard/skills"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to list
        </Link>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <SkillForm
          mode="create"
          existingNames={existingNames}
          categories={categories}
          values={{
            category: prefill ?? "",
            name: "",
            sort_order: 0,
          }}
        />
      </div>
    </div>
  );
}
