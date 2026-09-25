"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useToast } from "@/app/components/toast";
import type { ReactionType } from "@/lib/blog-types";

interface Props {
  postId: number;
  initialLikes: number;
  initialDislikes: number;
  initialMyReaction: ReactionType | null;
  isLoggedIn: boolean;
}

/**
 * Like / dislike bar.
 * - Click the active reaction again to remove it.
 * - Click the other one to switch.
 * - Counts update optimistically; the server response reconciles them.
 * - Not signed in → prompt with a link to /login.
 */
export default function ReactionBar({
  postId,
  initialLikes,
  initialDislikes,
  initialMyReaction,
  isLoggedIn,
}: Props) {
  const toast = useToast();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [mine, setMine] = useState<ReactionType | null>(initialMyReaction);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const react = async (type: ReactionType) => {
    if (!isLoggedIn) {
      toast.info({
        title: "Sign in to react",
        description: "Create a free account or log in to like posts.",
      });
      return;
    }
    if (busy) return;
    setBusy(true);

    // Optimistic update — compute the expected outcome locally.
    const nextMine = mine === type ? null : type;
    const nextLikes = likes + (nextMine === "like" ? 1 : 0) - (mine === "like" ? 1 : 0);
    const nextDislikes = dislikes + (nextMine === "dislike" ? 1 : 0) - (mine === "dislike" ? 1 : 0);
    setMine(nextMine);
    setLikes(nextLikes);
    setDislikes(nextDislikes);

    try {
      const res = await fetch("/api/blog/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type }),
      });
      const data = (await res.json()) as {
        likes?: number;
        dislikes?: number;
        myReaction?: ReactionType | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      // Reconcile with the server truth (handles races).
      if (typeof data.likes === "number") setLikes(data.likes);
      if (typeof data.dislikes === "number") setDislikes(data.dislikes);
      setMine(data.myReaction ?? null);
    } catch (err) {
      // Roll back on failure.
      setMine(mine);
      setLikes(initialLikes);
      setDislikes(initialDislikes);
      toast.error({
        title: "Could not save your reaction",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  void startTransition;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => react("like")}
        disabled={busy}
        aria-pressed={mine === "like"}
        className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:cursor-wait disabled:opacity-70 ${
          mine === "like"
            ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
            : "border-zinc-800 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300"
        }`}
      >
        <svg className="h-4 w-4" fill={mine === "like" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
        </svg>
        <span>{likes}</span>
        <span className="hidden sm:inline">Helpful</span>
      </button>

      <button
        type="button"
        onClick={() => react("dislike")}
        disabled={busy}
        aria-pressed={mine === "dislike"}
        className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:cursor-wait disabled:opacity-70 ${
          mine === "dislike"
            ? "border-red-500/50 bg-red-500/15 text-red-300"
            : "border-zinc-800 text-zinc-400 hover:border-red-500/40 hover:text-red-300"
        }`}
      >
        <svg className="h-4 w-4" fill={mine === "dislike" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.75 2.25 2.25 0 009.75 22a.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54" />
        </svg>
        <span>{dislikes}</span>
        <span className="hidden sm:inline">Not helpful</span>
      </button>

      {!isLoggedIn && (
        <Link href="/login" className="text-xs text-zinc-500 underline-offset-2 hover:text-cyan-300 hover:underline">
          Sign in to react
        </Link>
      )}
    </div>
  );
}
