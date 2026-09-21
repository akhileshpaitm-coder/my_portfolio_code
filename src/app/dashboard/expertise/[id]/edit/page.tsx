import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getExpertiseById, getExpertiseTitles } from "@/lib/expertise";
import ExpertiseForm from "../../ExpertiseForm";

export const metadata = {
  title: "Edit Expertise | Dashboard",
};

export default async function EditExpertisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/expertise");
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const item = await getExpertiseById(numericId);
  if (!item) notFound();

  // Exclude this item's own title so editing without renaming doesn't flag a duplicate.
  const existingTitles = await getExpertiseTitles(numericId);

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
          Edit <span className="gradient-text">Expertise</span>
        </h2>
        <Link
          href="/dashboard/expertise"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to list
        </Link>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <ExpertiseForm
          mode="edit"
          existingTitles={existingTitles}
          values={{
            id: item.id,
            title: item.title,
            sort_order: item.sort_order,
          }}
        />
      </div>
    </div>
  );
}
