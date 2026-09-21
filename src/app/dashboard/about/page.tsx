import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAboutParagraphs, getCoreValues } from "@/lib/about";
import { deleteParagraphAction, deleteValueAction } from "./actions";
import DeleteAboutButton from "./DeleteAboutButton";

export const metadata = {
  title: "Manage About | Dashboard",
};

/**
 * Admin: manage the homepage About section — bio paragraphs and the
 * Core Values card, both DB-backed.
 */
export default async function ManageAboutPage() {
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
            Your account does not have permission to manage about content.
          </p>
        </div>
      </div>
    );
  }

  const [paragraphs, values] = await Promise.all([
    getAboutParagraphs(),
    getCoreValues(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Admin
        </span>
        <div className="section-bar" />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Manage <span className="gradient-text">About</span>
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Bio paragraphs and core values shown on the homepage about section.
        </p>
      </div>

      {/* ── Paragraphs ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          Bio paragraphs
          <span className="ml-2 text-xs font-normal text-zinc-500">
            {paragraphs.length} paragraph{paragraphs.length === 1 ? "" : "s"}
          </span>
        </h3>
        <Link
          href="/dashboard/about/paragraphs/new"
          className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          + Add Paragraph
        </Link>
      </div>

      {paragraphs.length === 0 ? (
        <div className="glass mb-10 rounded-2xl p-8 text-center text-sm text-zinc-500">
          No paragraphs yet — add your first one.
        </div>
      ) : (
        <div className="glass mb-10 overflow-hidden rounded-2xl">
          <ul className="divide-y divide-zinc-800/60">
            {paragraphs.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="shrink-0 text-[11px] text-zinc-600">
                    #{p.sort_order}
                  </span>
                  <p className="min-w-0 flex-1 break-words text-sm text-zinc-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                    {p.body}
                  </p>
                  {p.emphasized && (
                    <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                      Intro
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/about/paragraphs/${p.id}/edit`}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    Edit
                  </Link>
                  <DeleteAboutButton
                    id={p.id}
                    action={deleteParagraphAction}
                    confirmTitle="Delete paragraph?"
                    confirmDescription="This paragraph will be permanently removed from the about section. This action cannot be undone."
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Core values ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          Core values
          <span className="ml-2 text-xs font-normal text-zinc-500">
            {values.length} value{values.length === 1 ? "" : "s"}
          </span>
        </h3>
        <Link
          href="/dashboard/about/values/new"
          className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          + Add Value
        </Link>
      </div>

      {values.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
          No core values yet — add your first one.
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <ul className="divide-y divide-zinc-800/60">
            {values.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 text-[11px] text-zinc-600">
                    #{v.sort_order}
                  </span>
                  <span className="shrink-0 text-xl">{v.icon}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-200">
                      {v.title}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {v.description}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/about/values/${v.id}/edit`}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    Edit
                  </Link>
                  <DeleteAboutButton
                    id={v.id}
                    action={deleteValueAction}
                    confirmTitle="Delete core value?"
                    confirmDescription={`"${v.title}" will be permanently removed from the core values card. This action cannot be undone.`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
