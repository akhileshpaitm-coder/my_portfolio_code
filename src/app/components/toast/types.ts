/** Visual style / semantic level of a toast. */
export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

/** Where the toast viewport sits on screen. */
export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface ToastOptions {
  /** Unique id. Auto-generated when omitted. */
  id?: string;
  /** Small bold title. */
  title?: string;
  /** Body text under the title (or the main message when no title). */
  description?: string;
  /** Auto-dismiss duration in ms. 0 = sticky until closed. */
  duration?: number;
  /** Show a ✕ close button. Default true. */
  closable?: boolean;
}

/** Fully-resolved toast stored in provider state. */
export interface Toast extends Required<Omit<ToastOptions, "duration">>, Pick<ToastOptions, "duration"> {
  variant: ToastVariant;
  createdAt: number;
}

export type ToastInput = string | ToastOptions;
