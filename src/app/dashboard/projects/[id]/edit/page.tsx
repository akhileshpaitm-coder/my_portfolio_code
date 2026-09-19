import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectById, getProjectTitles } from "@/lib/projects";
import ProjectForm from "../../ProjectForm";

export const metadata = {
  title: "Edit Project | Dashboard",
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/projects");
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const project = await getProjectById(numericId);
  if (!project) notFound();

  // Exclude this project's own title so editing without renaming doesn't flag a duplicate.
  const existingTitles = await getProjectTitles(numericId);

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
          Edit <span className="gradient-text">Project</span>
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
          mode="edit"
          existingTitles={existingTitles}
          values={{
            id: project.id,
            title: project.title,
            description: project.description,
            icon: project.icon,
            color: project.color,
            features: project.features.join("\n"),
            tech: project.tech.join("\n"),
            sort_order: project.sort_order,
            demo_url: project.demo_url ?? "",
            screenshot_url: project.screenshot_url ?? "",
            video_url: project.video_url ?? "",
            video_path: project.video_path ?? "",
          }}
        />
      </div>
    </div>
  );
}
