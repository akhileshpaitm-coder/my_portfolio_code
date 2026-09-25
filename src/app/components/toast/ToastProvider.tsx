"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import ToastViewport from "./ToastViewport";
import type {
  Toast,
  ToastInput,
  ToastOptions,
  ToastPosition,
  ToastVariant,
} from "./types";

/* ─────────────────────────────────────────────
 * State
 * ───────────────────────────────────────────── */
interface ToastState {
  toasts: Toast[];
  position: ToastPosition;
}

type Action =
  | { type: "add"; toast: Toast; limit: number }
  | { type: "dismiss"; id: string }
  | { type: "update"; id: string; patch: Partial<Toast> }
  | { type: "clear" };

const MAX_VISIBLE = 5;

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case "add": {
      // Replace an existing toast with the same id (dedupe / update flows)
      const withoutDuplicate = state.toasts.filter(
        (t) => t.id !== action.toast.id
      );
      const toasts = [...withoutDuplicate, action.toast];
      // Keep the most recent `limit` toasts so the screen never floods
      return {
        ...state,
        toasts:
          toasts.length > action.limit
            ? toasts.slice(toasts.length - action.limit)
            : toasts,
      };
    }
    case "dismiss":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "update":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t
        ),
      };
    case "clear":
      return { ...state, toasts: [] };
  }
}

/* ─────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────── */
let seq = 0;
function nextToastId(): string {
  seq += 1;
  return `toast-${Date.now().toString(36)}-${seq}`;
}

/** Duration defaults per variant (loading toasts stay until resolved). */
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
  loading: 0,
};

function normalizeToast(
  input: ToastInput,
  variant: ToastVariant,
  overrides?: Partial<ToastOptions>
): Toast {
  const opts: ToastOptions =
    typeof input === "string" ? { description: input } : { ...input, ...overrides };
  const rawDuration =
    opts.duration !== undefined ? opts.duration : DEFAULT_DURATION[variant];
  return {
    id: opts.id ?? nextToastId(),
    title: opts.title ?? "",
    description: opts.description ?? "",
    duration: rawDuration > 0 ? rawDuration : 0,
    closable: opts.closable ?? true,
    variant,
    createdAt: Date.now(),
  };
}

/* ─────────────────────────────────────────────
 * API surface
 * ───────────────────────────────────────────── */
export interface ToastApi {
  /** Fire a toast of any variant. */
  toast: (variant: ToastVariant, input: ToastInput) => string;
  success: (input: ToastInput) => string;
  error: (input: ToastInput) => string;
  warning: (input: ToastInput) => string;
  info: (input: ToastInput) => string;
  /** Sticky spinner toast; keep the id to resolve/dismiss it later. */
  loading: (input: ToastInput) => string;
  /** Promote a loading toast to success/error in place (keeps its slot). */
  resolve: (
    id: string,
    variant: "success" | "error",
    input?: ToastInput
  ) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/**
 * No-op fallback used when a component calls useToast outside the provider
 * (or when a bundler hiccup yields two copies of this module). Failing safe
 * keeps pages rendering — losing a toast is much better than crashing.
 */
const NOOP_TOAST_API: ToastApi = {
  toast: () => "noop",
  success: () => "noop",
  error: () => "noop",
  warning: () => "noop",
  info: () => "noop",
  loading: () => "noop",
  resolve: () => undefined,
  dismiss: () => undefined,
  clear: () => undefined,
};

/**
 * The one hook components use:
 * `const toast = useToast(); toast.success("Saved!");`
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? NOOP_TOAST_API;
}

/* ─────────────────────────────────────────────
 * Provider — owns state, exposes the API, and
 * renders the portal viewport once.
 * ───────────────────────────────────────────── */
export function ToastProvider({
  position = "bottom-right",
  limit = MAX_VISIBLE,
  children,
}: {
  /** Where toasts appear. Default: bottom-right. */
  position?: ToastPosition;
  /** Max toasts visible at once (oldest are dropped). */
  limit?: number;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    toasts: [],
    position,
  });

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "dismiss", id });
  }, []);

  const add = useCallback(
    (variant: ToastVariant, input: ToastInput): string => {
      const t = normalizeToast(input, variant);
      dispatch({ type: "add", toast: t, limit });
      return t.id;
    },
    [limit]
  );

  const resolve = useCallback(
    (id: string, variant: "success" | "error", input?: ToastInput): void => {
      const t = input
        ? normalizeToast(input, variant, {
            // keep the same slot — id stays, timings reset
            id,
          })
        : null;
      dispatch({
        type: "update",
        id,
        patch: {
          ...(t
            ? {
                title: t.title,
                description: t.description,
                closable: t.closable,
              }
            : {}),
          variant,
          duration: t ? t.duration : DEFAULT_DURATION[variant],
          createdAt: Date.now(),
        },
      });
    },
    []
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast: add,
      success: (input) => add("success", input),
      error: (input) => add("error", input),
      warning: (input) => add("warning", input),
      info: (input) => add("info", input),
      loading: (input) => add("loading", input),
      resolve,
      dismiss,
      clear: () => dispatch({ type: "clear" }),
    }),
    [add, resolve, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport
        toasts={state.toasts}
        position={state.position}
        onDismiss={dismiss}
      />
    </ToastContext.Provider>
  );
}
