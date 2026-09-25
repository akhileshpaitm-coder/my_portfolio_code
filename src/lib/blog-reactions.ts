import "server-only";
import type { Document } from "mongodb";
import { getNativeDb, getRepo, nextId } from "@/lib/db";
import type { ReactionCounts, ReactionType } from "@/lib/blog-types";

interface ReactionStored extends Document {
  id: number;
  post_id: number;
  user_id: number;
  reaction_type: ReactionType;
  created_at: Date;
}

/**
 * Set (or change) the current user's reaction on a post.
 * - same reaction again → removes it (toggle off)
 * - different reaction → switches like ↔ dislike
 * The unique (post_id, user_id) index guarantees a single row per user.
 */
export async function setReaction(
  postId: number,
  userId: number,
  type: ReactionType
): Promise<ReactionCounts & { myReaction: ReactionType | null }> {
  const db = await getNativeDb();

  const existing = await db
    .collection<ReactionStored>("post_reactions")
    .findOne({ post_id: postId, user_id: userId });

  if (!existing) {
    const repo = await getRepo("post_reactions");
    await repo.insertOne({
      id: await nextId("post_reactions"),
      post_id: postId,
      user_id: userId,
      reaction_type: type,
      created_at: new Date(),
    });
  } else if (existing.reaction_type === type) {
    // Toggle off.
    await db.collection("post_reactions").deleteOne({ _id: existing._id });
  } else {
    await db
      .collection("post_reactions")
      .updateOne({ _id: existing._id }, { $set: { reaction_type: type } });
  }

  return { ...(await getReactionCounts(postId)), myReaction: await getMyReaction(postId, userId) };
}

export async function getReactionCounts(postId: number): Promise<ReactionCounts> {
  const db = await getNativeDb();
  const rows = await db
    .collection("post_reactions")
    .aggregate<{ _id: string; n: number }>([
      { $match: { post_id: postId } },
      { $group: { _id: "$reaction_type", n: { $sum: 1 } } },
    ])
    .toArray();
  const counts: ReactionCounts = { likes: 0, dislikes: 0 };
  for (const row of rows) {
    if (row._id === "like") counts.likes = Number(row.n);
    if (row._id === "dislike") counts.dislikes = Number(row.n);
  }
  return counts;
}

export async function getMyReaction(postId: number, userId: number): Promise<ReactionType | null> {
  const db = await getNativeDb();
  const row = await db
    .collection<ReactionStored>("post_reactions")
    .findOne({ post_id: postId, user_id: userId }, { projection: { _id: 0, reaction_type: 1 } });
  return row?.reaction_type ?? null;
}
