import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSkillById, getSkillCategories, getSkillNames } from "@/lib/skills";
import SkillForm from "../../SkillForm";

export const metadata = {
  title: "Edit Skill | Dashboard",
};

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/skills");
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const skill = await getSkillById(numericId);
  if (!skill) notFound();

  // Exclude this skill's own name so editing without renaming doesn't flag a duplicate.
  const [existingNames, categories] = await Promise.all([
    getSkillNames(numericId),
    getSkillCategories(),
  ]);

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
          Edit <span className="gradient-text">Skill</span>
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
          mode="edit"
          existingNames={existingNames}
          categories={categories}
          values={{
            id: skill.id,
            category: skill.category,
            name: skill.name,
            sort_order: skill.sort_order,
          }}
        />
      </div>
    </div>
  );
}
