"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";

type DeleteAction = (formData: FormData) => Promise<void>;

/**
 * Delete button that opens a styled confirmation dialog before running
 * the given delete server action (same pattern as DeleteSkillButton).
 * `action` is a server action reference passed from the server component.
 */
export default function DeleteAboutButton({
  id,
  action,
  confirmTitle,
  confirmDescription,
}: {
  id: number;
  action: DeleteAction;
  confirmTitle: string;
  confirmDescription: string;
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
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>
    </>
  );
}
