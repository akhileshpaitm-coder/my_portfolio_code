"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { deletePostAction, togglePostStatusAction } from "./actions";

/**
 * Delete + publish/unpublish actions for one post row.
 * Both are plain form actions (redirect-free), so requestSubmit() runs them
 * and the router refreshes the table via revalidatePath.
 */
export default function PostRowActions({
  id,
  title,
  status,
}: {
  id: number;
  title: string;
  status: "draft" | "published";
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteForm = useRef<HTMLFormElement>(null);
  const toggleForm = useRef<HTMLFormElement>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => toggleForm.current?.requestSubmit()}
        className={`cursor-pointer rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
          status === "published"
            ? "border-zinc-800 text-zinc-400 hover:border-amber-500/40 hover:text-amber-300"
            : "border-zinc-800 text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-300"
        }`}
      >
        {status === "published" ? "Unpublish" : "Publish"}
      </button>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="cursor-pointer rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
      >
        Delete
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete post?"
        description={`"${title}" and all its comments and reactions will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setConfirmOpen(false);
          setTimeout(() => deleteForm.current?.requestSubmit(), 0);
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      <form ref={deleteForm} action={deletePostAction} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>
      <form ref={toggleForm} action={togglePostStatusAction} className="hidden">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value={status === "published" ? "draft" : "published"} />
      </form>
    </div>
  );
}
