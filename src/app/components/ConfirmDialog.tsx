"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Styled confirmation dialog (replaces window.confirm).
 * Esc / backdrop click cancel; Enter confirms. Focus is trapped inside
 * the dialog while open and restored to the previously focused element
 * on close.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastFocused.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && !e.defaultPrevented) {
        e.preventDefault();
        onConfirm();
      } else if (e.key === "Tab" && dialogRef.current) {
        // Simple focus trap: keep Tab cycling inside the dialog
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lastFocused.current?.focus();
    };
  }, [open, onCancel, onConfirm]);

  if (!open || typeof document === "undefined") return null;

  const danger = tone === "danger";

  // Portal to <body> so backdrop-filter/transform ancestors (e.g. the sticky
  // header) can't become the containing block for position:fixed — that
  // would constrain the overlay to that ancestor instead of the viewport.
  return createPortal(
    <div
      role="presentation"
      onClick={onCancel}
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
        onClick={(e) => e.stopPropagation()}
        className={`animate-pop-in w-full max-w-md rounded-2xl border bg-zinc-900 p-6 shadow-2xl ${
          danger ? "border-red-500/30" : "border-zinc-800"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              danger
                ? "bg-red-500/15 text-red-400"
                : "bg-cyan-500/15 text-cyan-400"
            }`}
          >
            {danger ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z"
                />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-zinc-100"
            >
              {title}
            </h2>
            {description && (
              <p
                id="confirm-dialog-desc"
                className="mt-1.5 text-sm leading-relaxed text-zinc-400"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
              danger
                ? "bg-red-600 hover:bg-red-500"
                : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-105"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
