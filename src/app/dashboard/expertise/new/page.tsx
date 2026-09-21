import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getExpertiseTitles } from "@/lib/expertise";
import ExpertiseForm from "../ExpertiseForm";

export const metadata = {
  title: "Add Expertise | Dashboard",
};

/** Admin: create a new expertise item. */
export default async function NewExpertisePage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/expertise");
  }

  const existingTitles = await getExpertiseTitles();

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
          Add <span className="gradient-text">Expertise</span>
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
          mode="create"
          existingTitles={existingTitles}
          values={{ title: "", sort_order: 0 }}
        />
      </div>
    </div>
  );
}
