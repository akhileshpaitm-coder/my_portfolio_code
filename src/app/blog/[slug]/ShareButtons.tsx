"use client";

import { useState } from "react";
import { useToast } from "@/app/components/toast";

/**
 * Share button — Web Share API when available (mobile), clipboard copy
 * fallback with a toast confirmation (desktop).
 */
export default function ShareButton({ title, url }: { title: string; url: string }) {
  const toast = useToast();
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Detect lazily on click — SSR-safe.
  const handleShare = async () => {
    const absolute =
      url.startsWith("http") || typeof window === "undefined"
        ? url
        : `${window.location.origin}${url}`;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title,
          url: absolute,
        });
        return;
      } catch (err) {
        // User dismissed the share sheet — not an error worth a toast.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(absolute);
      setCanNativeShare(true);
      toast.success({ title: "Link copied", description: absolute });
    } catch {
      toast.error({ title: "Could not copy the link" });
    }
    void canNativeShare;
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
      aria-label="Share this article"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
        />
      </svg>
      Share
    </button>
  );
}
