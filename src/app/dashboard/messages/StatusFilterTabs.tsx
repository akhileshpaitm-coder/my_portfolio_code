"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type StatusFilter = "all" | "new" | "read" | "replied";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "replied", label: "Replied" },
];

export interface TabCounts {
  counts: Record<StatusFilter, number>;
  allTotal: number;
}

function sameCounts(a: TabCounts, b: TabCounts) {
  return (
    a.allTotal === b.allTotal &&
    a.counts.all === b.counts.all &&
    a.counts.new === b.counts.new &&
    a.counts.read === b.counts.read &&
    a.counts.replied === b.counts.replied
  );
}

/**
 * Inbox status filter tabs with live counts.
 * Polls /api/messages/counts every 10s so the badges update without a
 * navigation (paused in hidden tabs, caught up on focus). When a count
 * changes, router.refresh() re-renders the server message list so the
 * rows stay in sync with the tabs.
 */
export default function StatusFilterTabs({
  initialCounts,
  activeFilter,
}: {
  /** Server-rendered counts — seed state and stay in sync on revalidation. */
  initialCounts: TabCounts;
  activeFilter: StatusFilter;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tabCounts, setTabCounts] = useState<TabCounts>(initialCounts);
  const countsRef = useRef<TabCounts>(initialCounts);

  // Server revalidations (mark read/reply/delete) re-render this page with
  // fresh props — adopt them so the tabs match the list (React's
  // adjust-state-during-render pattern). countsRef is only written inside
  // fetchCounts (the poller's baseline), never during render.
  const [prevInitial, setPrevInitial] = useState(initialCounts);
  if (initialCounts !== prevInitial) {
    setPrevInitial(initialCounts);
    setTabCounts(initialCounts);
  }

  // Keep the poller's comparison baseline aligned with the adopted prop
  // (ref writes belong in effects, not render).
  useEffect(() => {
    countsRef.current = initialCounts;
  }, [initialCounts]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/messages/counts", { cache: "no-store" });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (typeof data !== "object" || data === null) return;
        const c = data as {
          counts?: Partial<Record<"new" | "read" | "replied", unknown>>;
          allTotal?: unknown;
        };
        if (
          typeof c.counts?.new === "number" &&
          typeof c.counts?.read === "number" &&
          typeof c.counts?.replied === "number" &&
          typeof c.allTotal === "number"
        ) {
          const next: TabCounts = {
            counts: {
              all: c.allTotal,
              new: c.counts.new,
              read: c.counts.read,
              replied: c.counts.replied,
            },
            allTotal: c.allTotal,
          };
          if (!sameCounts(countsRef.current, next)) {
            countsRef.current = next;
            setTabCounts(next);
            // A count changed out-of-band — the server-rendered list below
            // (and the sidebar badge via the layout) is now stale.
            router.refresh();
          }
        }
      } catch {
        // Network hiccup — keep last known counts until the next tick.
      }
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(fetchCounts, 10_000);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchCounts(); // catch up immediately when the user returns
        start();
      } else {
        stop();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  /** Inbox link preserving the filter; page 1 for tab switches. */
  const inboxHref = (f: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (f === "all") params.delete("status");
    else params.set("status", f);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {FILTERS.map((f) => {
        const active = activeFilter === f.key;
        const count = tabCounts.counts[f.key];
        return (
          <Link
            key={f.key}
            href={inboxHref(f.key)}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 ${active ? "text-cyan-400/70" : "text-zinc-600"}`}>
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
