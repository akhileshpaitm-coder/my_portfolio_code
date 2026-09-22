"use client";

import { useEffect, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/app/components/toast";
import { replyToMessageAction, type ReplyFormState } from "../actions";

const inputBase =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Sending…" : "Send Reply"}
    </button>
  );
}

/**
 * Reply form for a contact message. On success the server action redirects
 * back to the detail page (which then shows the stored reply).
 */
export default function ReplyForm({
  id,
  defaultSubject,
  disabled,
}: {
  id: number;
  defaultSubject: string;
  disabled?: boolean;
}) {
  const toast = useToast();
  const [state, formAction] = useActionState<ReplyFormState | undefined, FormData>(
    replyToMessageAction,
    undefined
  );

  // Send errors (SMTP failure, validation) → toast. Success redirects.
  const seenStateRef = useRef<ReplyFormState | undefined>(undefined);
  useEffect(() => {
    if (state?.error && state !== seenStateRef.current) {
      seenStateRef.current = state;
      toast.error({ title: "Reply not sent", description: state.error });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={id} />

      {state?.error && (
        <div
          role="alert"
          className="animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="reply-subject"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Reply subject
        </label>
        <input
          id="reply-subject"
          name="subject"
          maxLength={200}
          defaultValue={defaultSubject}
          className={inputBase}
          disabled={disabled}
        />
      </div>

      <div>
        <label
          htmlFor="reply-body"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Reply message
        </label>
        <textarea
          id="reply-body"
          name="body"
          rows={7}
          placeholder="Write your reply…"
          className={`${inputBase} resize-y min-h-[140px]`}
          disabled={disabled}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
