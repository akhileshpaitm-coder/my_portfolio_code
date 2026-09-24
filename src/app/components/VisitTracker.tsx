"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * VisitTracker — fire-and-forget page view reporting.
 *
 * Mounted once in the root layout. Sends POST /api/visits for every public
 * page load (pathname change = one visit). Skips dashboard/API paths server-
 * side; never blocks or affects rendering.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    // Skip admin area and non-page routes.
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
      return;
    }
    // Guard against double-fire in Strict Mode / repeated commits.
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const controller = new AbortController();
    // Give the page a beat to paint first — tracking is lowest priority.
    const timeout = setTimeout(() => {
      void fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        signal: controller.signal,
        keepalive: true,
      }).catch(() => {
        // Silent — tracking is best effort.
      });
    }, 800);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [pathname]);

  return null;
}
