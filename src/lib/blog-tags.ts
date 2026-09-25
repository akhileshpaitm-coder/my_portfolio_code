import "server-only";
import type { Document } from "mongodb";
import { getNativeDb, getRepo, nextId } from "@/lib/db";
import { slugify } from "@/lib/blog";

export interface TagWithCount {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  post_count: number;
}

interface TagStored extends Document {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

interface PostTagStored extends Document {
  post_id: number;
  tag_id: number;
}

/** All tags with published-post counts. */
export async function getTags(): Promise<TagWithCount[]> {
  const db = await getNativeDb();
  const [tags, links, counts] = await Promise.all([
    db
      .collection<TagStored>("tags")
      .find({}, { projection: { _id: 0, id: 1, name: 1, slug: 1, created_at: 1, updated_at: 1 } })
      .sort({ name: 1 })
      .toArray(),
    db.collection<PostTagStored>("post_tags").find({}, { projection: { _id: 0, post_id: 1, tag_id: 1 } }).toArray(),
    db.collection("posts").aggregate<{ _id: number }>([
      { $match: { status: "published" } },
      { $project: { id: 1 } },
    ]).toArray(),
  ]);

  const publishedIds = new Set(counts.map((r) => r._id));
  const countByTag = new Map<number, number>();
  for (const link of links) {
    if (!publishedIds.has(link.post_id)) continue;
    countByTag.set(link.tag_id, (countByTag.get(link.tag_id) ?? 0) + 1);
  }
  return tags.map((t) => ({ ...t, post_count: countByTag.get(t.id) ?? 0 }));
}

export async function getTagById(id: number): Promise<TagWithCount | null> {
  const db = await getNativeDb();
  const row = await db.collection<TagStored>("tags").findOne({ id });
  if (!row) return null;
  return { ...row, post_count: 0 };
}

export async function getTagBySlug(slug: string): Promise<TagWithCount | null> {
  const db = await getNativeDb();
  const row = await db.collection<TagStored>("tags").findOne({ slug });
  if (!row) return null;
  return { ...row, post_count: 0 };
}

export async function tagNameTaken(name: string, excludeId?: number): Promise<boolean> {
  const db = await getNativeDb();
  const query: Document = { name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
  if (excludeId !== undefined) query.id = { $ne: excludeId };
  return (await db.collection("tags").countDocuments(query)) > 0;
}

export async function tagSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const db = await getNativeDb();
  const query: Document = { slug };
  if (excludeId !== undefined) query.id = { $ne: excludeId };
  return (await db.collection("tags").countDocuments(query)) > 0;
}

export interface TagInput {
  name: string;
  slug?: string;
}

export async function createTag(input: TagInput): Promise<number> {
  const repo = await getRepo("tags");
  const id = await nextId("tags");
  const now = new Date();
  await repo.insertOne({
    id,
    name: input.name.trim(),
    slug: input.slug?.trim() || slugify(input.name),
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function updateTag(id: number, input: TagInput): Promise<boolean> {
  const repo = await getRepo("tags");
  const result = await repo.updateMany(
    { id },
    { $set: { name: input.name.trim(), slug: input.slug?.trim() || slugify(input.name), updated_at: new Date() } }
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function deleteTag(id: number): Promise<boolean> {
  const db = await getNativeDb();
  await db.collection("post_tags").deleteMany({ tag_id: id });
  const repo = await getRepo("tags");
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}
