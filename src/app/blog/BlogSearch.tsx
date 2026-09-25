"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Debounced search input wired to the ?q= URL param. Updates are additive
 * (reset page to 1) so filters/pagination stay shareable and back-button
 * friendly. Uses router.replace so search-as-you-type doesn't spam history.
 */
export default function BlogSearch({ placeholder = "Search articles…" }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  // Keep the last-seen URL param in a ref-like render comparison instead of
  // an effect: when the URL changes externally (nav, clearing filters) the
  // controlled input adopts it (React's adjust-state-during-render pattern).
  const [prevUrlQ, setPrevUrlQ] = useState(searchParams.get("q") ?? "");
  const urlQ = searchParams.get("q") ?? "";
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setValue(urlQ);
  }

  // Debounced URL sync — replaces ?q= (and resets ?page=) as the user types.
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      params.delete("page"); // new search → first page
      startTransition(() => {
        router.replace(params.toString() ? `/blog?${params.toString()}` : "/blog", {
          scroll: false,
        });
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, urlQ]);

  return (
    <div className="relative">
      <svg
        className={`pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 ${
          isPending ? "text-cyan-400" : "text-zinc-600"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search posts"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-3 pr-4 pl-11 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
      />
      {isPending && (
        <span className="absolute top-1/2 right-3 -translate-y-1/2" aria-hidden>
          <svg className="h-4 w-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </span>
      )}
    </div>
  );
}
