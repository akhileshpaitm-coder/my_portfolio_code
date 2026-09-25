"use client";

import { useEffect, useRef, useState } from "react";
import type { VisitStats } from "@/lib/visits";

/**
 * Visitor traffic panel for the dashboard overview.
 * Server-seeded, then live-updates via GET /api/visits every 60s (pauses in
 * hidden tabs, catches up on focus — same behavior as the message poller).
 */
export default function VisitorStatsPanel({
  initialStats,
}: {
  initialStats: VisitStats;
}) {
  const [stats, setStats] = useState<VisitStats>(initialStats);
  const statsRef = useRef(initialStats);

  // Adopt fresh server props after revalidations (adjust-during-render).
  const [prevInitial, setPrevInitial] = useState(initialStats);
  if (initialStats !== prevInitial) {
    setPrevInitial(initialStats);
    setStats(initialStats);
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/visits", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as VisitStats;
        if (typeof data?.total === "number" && typeof data?.totalVisitors === "number" && data !== statsRef.current) {
          statsRef.current = data;
          setStats(data);
        }
      } catch {
        // Keep last known values on network hiccups.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchStats();
        start();
      } else {
        stop();
      }
    };
    const start = () => {
      if (!timer) timer = setInterval(() => void fetchStats(), 60_000);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const delta = stats.today - stats.yesterday;
  const maxViews = Math.max(1, ...stats.last7.map((d) => d.views));
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="glass relative mb-10 overflow-hidden rounded-2xl p-6 sm:p-8">
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-purple-500/10 blur-[80px]" />

      {/* Heading */}
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">
            Visitor <span className="gradient-text">Traffic</span>
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Page views from the public site — updates live.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
          </span>
          Live
        </span>
      </div>

      {/* Counters */}
      <div className="relative mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div className="text-3xl font-bold gradient-text">{fmt(stats.total)}</div>
          <div className="mt-1 text-xs text-zinc-500">Total views</div>
        </div>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div className="text-3xl font-bold gradient-text">{fmt(stats.totalVisitors)}</div>
          <div className="mt-1 text-xs text-zinc-500">Total visitors</div>
        </div>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div className="text-3xl font-bold text-zinc-100">{fmt(stats.today)}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            Views today
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                delta >= 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {delta >= 0 ? "▲" : "▼"} {fmt(Math.abs(delta))} vs yest.
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div className="text-3xl font-bold text-zinc-100">{fmt(stats.todayUnique)}</div>
          <div className="mt-1 text-xs text-zinc-500">Visitors today</div>
        </div>
      </div>

      {/* 7-day chart */}
      <div className="relative mb-6">
        <p className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          Last 7 days
        </p>
        <div className="flex h-24 items-end gap-2">
          {stats.last7.map((d) => (
            <div key={d.day} className="group relative flex flex-1 flex-col items-center gap-1.5">
              {/* Tooltip */}
              <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] whitespace-nowrap text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
                {fmt(d.views)} views · {d.unique} visitors
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-cyan-500/60 to-purple-500/60 transition-all group-hover:from-cyan-400/80 group-hover:to-purple-400/80"
                style={{
                  height: `${Math.max(4, (d.views / maxViews) * 100)}%`,
                  minHeight: "4px",
                }}
              />
              <span className="text-[10px] text-zinc-600">
                {d.day.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top pages */}
      {stats.topPages.length > 0 && (
        <div className="relative border-t border-zinc-800/60 pt-5">
          <p className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Top pages (30d)
          </p>
          <div className="space-y-2">
            {stats.topPages.map((p) => {
              const max = stats.topPages[0]?.views || 1;
              return (
                <div key={p.path} className="flex items-center gap-3 text-xs">
                  <span className="w-44 truncate text-zinc-400" title={p.path}>
                    {p.path}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600"
                      style={{ width: `${(p.views / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-medium text-zinc-500">
                    {fmt(p.views)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
