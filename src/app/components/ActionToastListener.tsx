"use client";

import { useEffect, useRef } from "react";
import { useToast } from "./toast";
import { ACTION_TOAST_COOKIE, type ActionToast } from "@/lib/action-toast-shared";

/**
 * Client bridge for Server-Action flash toasts. A server component pops the
 * one-shot toast cookie and passes the value here; this component fires it
 * as a real toast once, then clears the cookie so it never shows twice.
 */
export default function ActionToastListener({
  actionToast,
}: {
  actionToast: ActionToast | null;
}) {
  const toast = useToast();
  const firedRef = useRef<ActionToast | null>(null);

  useEffect(() => {
    if (!actionToast) return;

    // Fire once per distinct toast (React strict-mode double effect).
    const isNew = firedRef.current !== actionToast;
    if (isNew) {
      firedRef.current = actionToast;
      if (actionToast.variant === "success") {
        toast.success({
          title: actionToast.title,
          description: actionToast.description,
        });
      } else {
        toast.error({
          title: actionToast.title,
          description: actionToast.description,
        });
      }
    }

    // Clear the one-shot cookie so a later navigation can't re-fire it.
    document.cookie = `${ACTION_TOAST_COOKIE}=; Path=/; Max-Age=0`;
  }, [actionToast, toast]);

  return null;
}
