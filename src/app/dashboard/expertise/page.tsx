import Link from "next/link";
import { auth } from "@/lib/auth";
import { getExpertise } from "@/lib/expertise";
import DeleteExpertiseButton from "./DeleteExpertiseButton";

export const metadata = {
  title: "Manage Expertise | Dashboard",
};

/**
 * Admin: manage the expertise items shown on the homepage section.
 */
export default async function ManageExpertisePage() {
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
            Your account does not have permission to manage expertise.
          </p>
        </div>
      </div>
    );
  }

  const items = await getExpertise();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Admin
        </span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
            Manage <span className="gradient-text">Expertise</span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {items.length} item{items.length === 1 ? "" : "s"} shown on the
            homepage expertise section.
          </p>
        </div>
        <Link
          href="/dashboard/expertise/new"
          className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          + Add Expertise
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
          No expertise items yet — add your first one.
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <ul className="divide-y divide-zinc-800/60">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 text-[11px] text-zinc-600">
                    #{item.sort_order}
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium text-zinc-200">
                    {item.title}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/expertise/${item.id}/edit`}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    Edit
                  </Link>
                  <DeleteExpertiseButton id={item.id} title={item.title} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
