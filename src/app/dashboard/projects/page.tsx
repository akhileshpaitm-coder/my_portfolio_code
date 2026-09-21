import Link from "next/link";
import { auth } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import DeleteProjectButton from "./DeleteProjectButton";

export const metadata = {
  title: "Manage Projects | Dashboard",
};

/**
 * Admin: manage projects shown on the public /projects page.
 */
export default async function ManageProjectsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-3xl">🔒</p>
          <h1 className="mt-3 text-lg font-semibold text-zinc-100">
            Admin access required
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your account does not have permission to manage projects.
          </p>
        </div>
      </div>
    );
  }

  const projects = await getProjects();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Admin
        </span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Manage <span className="gradient-text">Projects</span>
        </h2>
        <Link
          href="/dashboard/projects/new"
          className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          + Add Project
        </Link>
      </div>

      <div className="space-y-3">
        {projects.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
            No projects yet — add your first one.
          </div>
        )}

        {projects.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 sm:flex-row sm:items-center"
          >
            {/* Icon + title */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{
                  background: `${p.color}15`,
                  border: `1px solid ${p.color}25`,
                }}
              >
                {p.icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-100">
                  {p.title}
                </div>
                <div className="truncate text-xs text-zinc-500">
                  #{p.sort_order} · {p.tech.slice(0, 4).join(", ")}
                  {p.tech.length > 4 ? ` +${p.tech.length - 4}` : ""}
                </div>
                {(p.demo_url || p.screenshot_url || p.video_url || p.video_path) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.demo_url && (
                      <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
                        Demo URL
                      </span>
                    )}
                    {p.screenshot_url && (
                      <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
                        Screenshot
                      </span>
                    )}
                    {(p.video_url || p.video_path) && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                        Video
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:shrink-0">
              <Link
                href={`/dashboard/projects/${p.id}/edit`}
                className="rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                Edit
              </Link>
              <DeleteProjectButton id={p.id} title={p.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
