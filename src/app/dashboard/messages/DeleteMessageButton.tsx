"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { deleteMessageAction } from "./actions";

/**
 * Delete button for contact messages — opens the styled confirmation
 * dialog before running the delete server action.
 */
export default function DeleteMessageButton({
  id,
  subject,
  compact,
}: {
  id: number;
  subject: string;
  compact?: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleConfirm = () => {
    setConfirmOpen(false);
    // Defer so the dialog unmounts before the server action redirects.
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={`rounded-lg border border-zinc-800 font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 ${
          compact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-xs"
        }`}
      >
        Delete
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete message?"
        description={`The message "${subject}" and its reply history will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <form ref={formRef} action={deleteMessageAction} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>
    </>
  );
}
