"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { deleteSkillAction } from "./actions";

/**
 * Delete button that opens a styled confirmation dialog before running
 * the delete server action (same pattern as DeleteProjectButton).
 */
export default function DeleteSkillButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleConfirm = () => {
    setConfirmOpen(false);
    // Defer so the dialog unmounts before the server action revalidates.
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
      >
        Delete
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete skill?"
        description={`"${name}" will be permanently removed from the skills section. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <form ref={formRef} action={deleteSkillAction} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>
    </>
  );
}
