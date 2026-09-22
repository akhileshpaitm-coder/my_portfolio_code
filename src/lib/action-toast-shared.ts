/**
 * Shared (client + server safe) bits of the action-toast relay.
 * The cookie-writing/reading functions live in action-toast.ts (server-only,
 * it imports next/headers). Client code imports ONLY from this file.
 */

export const ACTION_TOAST_COOKIE = "action_toast";

export type ActionToast = {
  variant: "success" | "error";
  title: string;
  description?: string;
};

/** Encode a toast as a cookie-safe string (URI-encoded JSON). */
export function encodeActionToast(t: ActionToast): string {
  return encodeURIComponent(JSON.stringify(t));
}
