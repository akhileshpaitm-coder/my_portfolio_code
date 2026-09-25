"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { createTagAction, updateTagAction, deleteTagAction } from "../actions";
import type { TagWithCount } from "@/lib/blog-tags";

export default function TagManager({ tags }: { tags: TagWithCount[] }) {
  const [deleting, setDeleting] = useState<TagWithCount | null>(null);
  const deleteForm = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form
        action={createTagAction}
        className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
      >
        <input
          name="name"
          required
          maxLength={40}
          placeholder="New tag name (e.g. nextjs)"
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
        />
        <input
          name="slug"
          maxLength={40}
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

      {/* Chips grid */}
      {tags.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-zinc-500">
          No tags yet — add the first one above.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4"
            >
              <form action={updateTagAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={tag.id} />
                <input
                  name="name"
                  defaultValue={tag.name}
                  required
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-800 focus:border-cyan-500/50 focus:bg-zinc-900 focus:outline-none"
                />
                <span className="shrink-0 rounded-full bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-400">
                  {tag.post_count} post{tag.post_count === 1 ? "" : "s"}
                </span>
                <button
                  type="submit"
                  className="shrink-0 cursor-pointer rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                >
                  Save
                </button>
              </form>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px] text-zinc-600">#{tag.slug}</span>
                <button
                  type="button"
                  onClick={() => setDeleting(tag)}
                  className="shrink-0 cursor-pointer rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete tag?"
        description={
          deleting
            ? `"#${deleting.name}" will be removed from ${deleting.post_count} post(s). This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setDeleting(null);
          setTimeout(() => deleteForm.current?.requestSubmit(), 0);
        }}
        onCancel={() => setDeleting(null)}
      />
      {tags.map((tag) => (
        <form
          key={`del-${tag.id}`}
          action={deleteTagAction}
          className="hidden"
          ref={deleting?.id === tag.id ? deleteForm : undefined}
        >
          <input type="hidden" name="id" value={tag.id} />
        </form>
      ))}
    </div>
  );
}
