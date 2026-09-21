"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { deleteProjectAction } from "./actions";

/**
 * Delete button that opens a styled confirmation dialog before running
 * the delete server action. Cancelling simply closes the dialog.
 */
export default function DeleteProjectButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleConfirm = () => {
    setConfirmOpen(false);
    // Defer so the dialog unmounts before the server action navigates/revalidates.
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
      >
        Delete
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete project?"
        description={`"${title}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <form ref={formRef} action={deleteProjectAction} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>
    </>
  );
}
