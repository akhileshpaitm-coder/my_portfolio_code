"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * createPortal needs `document`, which doesn't exist during SSR — gate with
 * useSyncExternalStore instead of a mounted effect.
 */
function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}
const subscribeNoop = () => () => {};

export interface NewMessageInfo {
  id: number;
  name: string;
  subject: string;
}

/**
 * Toast shown when a new contact message arrives while the dashboard is
 * open. Portal-rendered like ConfirmDialog so sticky/backdrop-filter
 * ancestors can't constrain position:fixed. Auto-dismisses after 6s.
 */
export default function NewMessageToast({
  message,
  onDismiss,
}: {
  message: NewMessageInfo | null;
  onDismiss: () => void;
}) {
  const mounted = useIsClient();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message || !mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="animate-pop-in fixed right-4 bottom-4 z-[60] w-full max-w-sm"
    >
      <div className="glass pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-2xl shadow-black/50">
        <span className="relative flex h-2.5 w-2.5 shrink-0 translate-y-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">
            New message from{" "}
            <span className="text-cyan-300">{message.name}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {message.subject}
          </p>
          <Link
            href={`/dashboard/messages/${message.id}`}
            onClick={onDismiss}
            className="mt-2 inline-block text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            Open message →
          </Link>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
