"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "../actions";
import type { CategoryWithCount } from "@/lib/blog-categories";

/**
 * Category management — an add form plus per-row inline edit forms.
 * Server actions run via plain form submissions; revalidatePath refreshes.
 */
export default function CategoryManager({ categories }: { categories: CategoryWithCount[] }) {
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null);
  const deleteForm = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form
        action={createCategoryAction}
        className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
      >
        <input
          name="name"
          required
          maxLength={60}
          placeholder="New category name (e.g. Tutorials)"
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
        />
        <input
          name="slug"
          maxLength={60}
          placeholder="slug (optional)"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none sm:w-48"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
        >
          Add
        </button>
      </form>

      {/* List */}
      {categories.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-zinc-500">
          No categories yet — add the first one above.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 sm:flex-row sm:items-center"
            >
              <form
                action={updateCategoryAction}
                className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input type="hidden" name="id" value={cat.id} />
                <input
                  name="name"
                  defaultValue={cat.name}
                  required
                  maxLength={60}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-800 focus:border-cyan-500/50 focus:bg-zinc-900 focus:outline-none"
                />
                <input
                  name="slug"
                  defaultValue={cat.slug}
                  maxLength={60}
                  title="Slug"
                  className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-mono text-xs text-zinc-500 transition-colors hover:border-zinc-800 focus:border-cyan-500/50 focus:bg-zinc-900 focus:outline-none sm:w-44"
                />
                <span className="shrink-0 rounded-full bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-400">
                  {cat.post_count} post{cat.post_count === 1 ? "" : "s"}
                </span>
                <button
                  type="submit"
                  className="shrink-0 cursor-pointer rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                >
                  Save
                </button>
              </form>
              <button
                type="button"
                onClick={() => setDeleting(cat)}
                className="shrink-0 cursor-pointer rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete category?"
        description={
          deleting
            ? `"${deleting.name}" will be removed. ${deleting.post_count} published post(s) will become uncategorized.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setDeleting(null);
          setTimeout(() => {
            if (deleteForm.current) {
              // The form's id field is set by the hidden form below.
              deleteForm.current.requestSubmit();
            }
          }, 0);
        }}
        onCancel={() => setDeleting(null)}
      />
      {/* Hidden delete form — id is swapped in via the map below */}
      {categories.map((cat) => (
        <form
          key={`del-${cat.id}`}
          action={deleteCategoryAction}
          className="hidden"
          ref={deleting?.id === cat.id ? deleteForm : undefined}
        >
          <input type="hidden" name="id" value={cat.id} />
        </form>
      ))}
    </div>
  );
}
