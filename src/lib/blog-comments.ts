import "server-only";
import type { Document } from "mongodb";
import { getNativeDb, getRepo, nextId } from "@/lib/db";
import type { BlogComment, CommentNode } from "@/lib/blog-types";

interface CommentStored extends Document {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: Date;
  updated_at: Date;
}

const PROJECTION = {
  projection: {
    _id: 0,
    id: 1,
    post_id: 1,
    user_id: 1,
    parent_id: 1,
    content: 1,
    created_at: 1,
    updated_at: 1,
  },
};

function toComment(row: CommentStored, userName: string): BlogComment {
  return {
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    user_name: userName,
    parent_id: row.parent_id ?? null,
    content: row.content,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

/** Fetch user names in one query and attach. */
async function withUserNames(rows: CommentStored[]): Promise<BlogComment[]> {
  if (rows.length === 0) return [];
  const db = await getNativeDb();
  const users = await db
    .collection("users")
    .find({ id: { $in: [...new Set(rows.map((r) => r.user_id))] } }, { projection: { _id: 0, id: 1, name: 1 } })
    .toArray();
  const names = new Map(users.map((u) => [Number(u.id), String(u.name)]));
  return rows.map((r) => toComment(r, names.get(r.user_id) ?? "Unknown"));
}

/**
 * All comments for a post as a tree (top-level oldest-first, replies
 * nested oldest-first). Deleted users show as "Unknown"; orphaned replies
 * (parent deleted) surface as top-level comments.
 */
export async function getCommentTree(postId: number): Promise<CommentNode[]> {
  const db = await getNativeDb();
  const rows = await db
    .collection<CommentStored>("comments")
    .find({ post_id: postId }, PROJECTION)
    .sort({ created_at: 1, id: 1 })
    .toArray();

  const flat = await withUserNames(rows);
  const byId = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of flat) {
    byId.set(c.id, { ...c, replies: [] });
  }
  for (const node of byId.values()) {
    if (node.parent_id != null && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function countComments(postId: number): Promise<number> {
  const db = await getNativeDb();
  return db.collection("comments").countDocuments({ post_id: postId });
}

/** One flat page of comments with post titles (admin management). */
export async function getCommentsPage(options: {
  page?: number;
  pageSize?: number;
}): Promise<{
  comments: Array<BlogComment & { post_title: string | null; post_slug: string | null }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  const db = await getNativeDb();
  const pageSize = Math.min(50, Math.max(1, Math.floor(options.pageSize ?? 20)));
  const total = await db.collection("comments").countDocuments({});
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, Math.floor(options.page ?? 1)));

  const rows = await db
    .collection<CommentStored>("comments")
    .find({}, PROJECTION)
    .sort({ created_at: -1, id: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  const comments = await withUserNames(rows);

  const postRows = await db
    .collection("posts")
    .find(
      { id: { $in: [...new Set(rows.map((r) => r.post_id))] } },
      { projection: { _id: 0, id: 1, title: 1, slug: 1 } }
    )
    .toArray();
  const posts = new Map(postRows.map((p) => [Number(p.id), { title: String(p.title), slug: String(p.slug) }]));

  return {
    comments: comments.map((c) => ({
      ...c,
      post_title: posts.get(c.post_id)?.title ?? null,
      post_slug: posts.get(c.post_id)?.slug ?? null,
    })),
    total,
    page,
    totalPages,
  };
}

export interface CommentInput {
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
}

export async function createComment(input: CommentInput): Promise<number> {
  const repo = await getRepo("comments");
  const id = await nextId("comments");
  const now = new Date();
  await repo.insertOne({
    id,
    post_id: input.post_id,
    user_id: input.user_id,
    parent_id: input.parent_id,
    content: input.content.trim(),
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function deleteComment(id: number): Promise<boolean> {
  const db = await getNativeDb();
  const result = await db.collection("comments").deleteOne({ id });
  return result.deletedCount > 0;
}

export async function updateComment(id: number, userId: number, content: string): Promise<boolean> {
  const repo = await getRepo("comments");
  const result = await repo.updateMany(
    { id, user_id: userId },
    { $set: { content: content.trim(), updated_at: new Date() } }
  );
  return (result.modifiedCount ?? 0) > 0;
}
