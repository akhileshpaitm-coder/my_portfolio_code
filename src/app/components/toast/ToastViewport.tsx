"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Toast, ToastPosition } from "./types";

/** createPortal needs `document`, which doesn't exist during SSR — gate
 * with useSyncExternalStore instead of a mounted effect (same pattern as
 * NewMessageToast). */
const subscribeNoop = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

/* ─────────────────────────────────────────────
 * Icons (inline SVG, heroicons-style outlines)
 * ───────────────────────────────────────────── */
function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="toast-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="toast-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="toast-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="toast-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="toast-icon animate-spin">
      <path strokeLinecap="round" d="M12 3a9 9 0 109 9" />
    </svg>
  );
}

const ICONS: Record<Toast["variant"], () => React.ReactNode> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
  loading: LoadingIcon,
};

const POSITION_CLS: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-4 right-4 items-end",
};

/* ─────────────────────────────────────────────
 * Single toast card
 * ───────────────────────────────────────────── */
function ToastCard({
  toast,
  onDismiss,
  index,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  index: number;
}) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);

  const duration = toast.duration ?? 0;

  /* Auto-dismiss timer, pause on hover */
  useEffect(() => {
    if (duration === 0 || paused || leaving) return;
    const t = setTimeout(() => setLeaving(true), duration);
    return () => clearTimeout(t);
  }, [duration, paused, leaving]);

  /* Play the exit animation before unmounting */
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => onDismiss(toast.id), 180);
    return () => clearTimeout(t);
  }, [leaving, onDismiss, toast.id]);

  const Icon = ICONS[toast.variant];
  const pausedRef = paused || duration === 0;

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`toast-card toast-${toast.variant} ${leaving ? "toast-leave" : "toast-enter"} ${
        index > 0 ? `toast-stacked-${Math.min(index, 2)}` : ""
      }`}
    >
      {/* Variant icon */}
      <span className={`toast-icon-wrap toast-icon-${toast.variant}`}>
        <Icon />
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="toast-title">{toast.title}</p>
        )}
        {toast.description && (
          <p className={toast.title ? "toast-desc" : "toast-desc toast-desc-only"}>
            {toast.description}
          </p>
        )}
      </div>

      {/* Close button */}
      {toast.closable && (
        <button
          type="button"
          onClick={() => setLeaving(true)}
          aria-label="Dismiss notification"
          className="toast-close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Progress bar (auto-dismiss countdown, pauses on hover) */}
      {duration > 0 && (
        <span
          key={`${toast.createdAt}-${pausedRef ? "p" : "r"}`}
          className={`toast-progress toast-progress-${toast.variant} ${
            paused ? "toast-progress-paused" : ""
          }`}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Viewport
 * ───────────────────────────────────────────── */
export default function ToastViewport({
  toasts,
  position,
  onDismiss,
}: {
  toasts: Toast[];
  position: ToastPosition;
  onDismiss: (id: string) => void;
}) {
  const isClient = useIsClient();
  if (!isClient) return null; // SSR-safe portal

  return createPortal(
    <div
      aria-label="Notifications"
      className={`toast-viewport ${POSITION_CLS[position]}`}
    >
      {/* Newest first visually (top of the stack) */}
      {[...toasts].reverse().map((toast, i) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          index={i}
        />
      ))}
    </div>,
    document.body
  );
}
