"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { deleteCommentAction } from "../actions";

export default function DeleteCommentButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
      >
        Delete
      </button>

      <ConfirmDialog
        open={open}
        title="Delete comment?"
        description="The comment will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setOpen(false);
          setTimeout(() => formRef.current?.requestSubmit(), 0);
        }}
        onCancel={() => setOpen(false)}
      />

      <form ref={formRef} action={deleteCommentAction} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>
    </>
  );
}
