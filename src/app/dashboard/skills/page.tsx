import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSkills } from "@/lib/skills";
import { iconForTech, luminance } from "@/lib/tech-icons";
import DeleteSkillButton from "./DeleteSkillButton";

export const metadata = {
  title: "Manage Skills | Dashboard",
};

/**
 * Admin: manage the skills shown on /skills and the homepage section.
 * Rows are grouped by category; cards are ordered by each category's
 * lowest sort_order.
 */
export default async function ManageSkillsPage() {
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
            Your account does not have permission to manage skills.
          </p>
        </div>
      </div>
    );
  }

  const skills = await getSkills();

  // Group by category, cards ordered by each category's min sort_order.
  const byCategory = new Map<string, typeof skills>();
  for (const s of skills) {
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }
  const categories = [...byCategory.entries()].sort(
    (a, b) =>
      Math.min(...a[1].map((s) => s.sort_order)) -
      Math.min(...b[1].map((s) => s.sort_order))
  );

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
          Manage <span className="gradient-text">Skills</span>
        </h2>
        <Link
          href="/dashboard/skills/new"
          className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          + Add Skill
        </Link>
      </div>

      {categories.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
          No skills yet — add your first one.
        </div>
      )}

      <div className="space-y-6">
        {categories.map(([category, items]) => (
          <div
            key={category}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-100">
                {category}
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  {items.length} skill{items.length === 1 ? "" : "s"}
                </span>
              </h3>
              <Link
                href={`/dashboard/skills/new?category=${encodeURIComponent(category)}`}
                className="shrink-0 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                + Add to this category
              </Link>
            </div>

            <ul className="divide-y divide-zinc-800/60">
              {items
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {(() => {
                        const { icon: Icon, color } = iconForTech(s.icon ?? s.name);
                        const dark = luminance(color) < 0.35;
                        return (
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center ${
                              dark ? "rounded-full bg-white" : ""
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5" style={{ color }} />
                          </span>
                        );
                      })()}
                      <span className="tag-chip max-w-full truncate">
                        {s.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-zinc-600">
                        #{s.sort_order}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/dashboard/skills/${s.id}/edit`}
                        className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        Edit
                      </Link>
                      <DeleteSkillButton id={s.id} name={s.name} />
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
