import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setReaction, getReactionCounts, getMyReaction } from "@/lib/blog-reactions";
import type { ReactionType } from "@/lib/blog-types";

/**
 * POST /api/blog/reactions — set/change/remove the logged-in user's
 * reaction on a post. Body: { postId, type: "like" | "dislike" | null }.
 * null removes the reaction; a repeated reaction toggles off server-side,
 * but the explicit null path keeps the API clear for future callers.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to react." }, { status: 401 });
  }

  let body: { postId?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const postId = Number(body.postId);
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const userId = Number(session.user.id);
  const type = body.type;

  try {
    if (type === null) {
      // Explicit remove is not needed by the UI (repeat-click toggles off),
      // but keep counts consistent if a future client sends null.
      return NextResponse.json({
        ...(await getReactionCounts(postId)),
        myReaction: await getMyReaction(postId, userId),
      });
    }
    if (type !== "like" && type !== "dislike") {
      return NextResponse.json({ error: "Invalid reaction type." }, { status: 400 });
    }
    const result = await setReaction(postId, userId, type satisfies ReactionType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[blog/reactions] failed:", error);
    return NextResponse.json({ error: "Could not save your reaction." }, { status: 500 });
  }
}
