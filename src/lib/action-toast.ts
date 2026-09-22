import { cookies } from "next/headers";
import {
  ACTION_TOAST_COOKIE,
  encodeActionToast,
  type ActionToast,
} from "./action-toast-shared";

/**
 * Server-only side of the action-toast relay (imports next/headers).
 *
 * Actions that redirect (create/update/delete flows) can't return state to
 * the client, so they leave a short-lived cookie that the dashboard layout
 * reads on the next render and converts into a real toast via
 * <ActionToastListener />. The listener clears the cookie from the client
 * after firing (it's NOT httpOnly for that reason — it holds no sensitive
 * data, just a display message).
 *
 * Note: the cookie is only *written* inside Server Actions (allowed) and
 * only *read* during renders — Next.js forbids cookie mutation in renders.
 */

/** Set a one-shot toast cookie (call inside a Server Action, before redirect). */
export async function setActionToast(toast: ActionToast): Promise<void> {
  try {
    const store = await cookies();
    store.set(ACTION_TOAST_COOKIE, encodeActionToast(toast), {
      httpOnly: false, // cleared from the client by ActionToastListener
      sameSite: "lax",
      path: "/",
      maxAge: 30, // one-shot: enough to survive the redirect render
    });
  } catch {
    // Never let toasts break the action itself.
  }
}

/** Read the toast cookie during a server render (no mutation). */
export async function readActionToast(): Promise<ActionToast | null> {
  try {
    const store = await cookies();
    const raw = store.get(ACTION_TOAST_COOKIE)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw)) as ActionToast;
    if (
      (parsed.variant !== "success" && parsed.variant !== "error") ||
      typeof parsed.title !== "string" ||
      !parsed.title
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// re-export so server code can import everything from one module
export { ACTION_TOAST_COOKIE, type ActionToast, encodeActionToast } from "./action-toast-shared";
