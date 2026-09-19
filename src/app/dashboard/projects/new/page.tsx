import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { nextSortOrder, getProjectTitles } from "@/lib/projects";
import ProjectForm from "../ProjectForm";

export const metadata = {
  title: "Add Project | Dashboard",
};

export default async function NewProjectPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/projects");
  }

  const [sortOrder, existingTitles] = await Promise.all([nextSortOrder(), getProjectTitles()]);

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
          Add <span className="gradient-text">Project</span>
        </h2>
        <Link
          href="/dashboard/projects"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to list
        </Link>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <ProjectForm
          mode="create"
          existingTitles={existingTitles}
          values={{
            title: "",
            description: "",
            icon: "📦",
            color: "#06b6d4",
            features: "",
            tech: "",
            sort_order: sortOrder,
          }}
        />
      </div>
    </div>
  );
}
