import "server-only";
import type { Document } from "mongodb";
import { getNativeDb, getRepo, nextId } from "@/lib/db";
import { slugify } from "@/lib/blog";

export interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  post_count: number;
}

interface CategoryStored extends Document {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

/** All categories with their published-post counts (for filter chips). */
export async function getCategories(): Promise<CategoryWithCount[]> {
  const db = await getNativeDb();
  const [cats, counts] = await Promise.all([
    db
      .collection<CategoryStored>("categories")
      .find({}, { projection: { _id: 0, id: 1, name: 1, slug: 1, created_at: 1, updated_at: 1 } })
      .sort({ name: 1 })
      .toArray(),
    db
      .collection("posts")
      .aggregate<{ _id: number; n: number }>([
        { $match: { status: "published", category_id: { $ne: null } } },
        { $group: { _id: "$category_id", n: { $sum: 1 } } },
      ])
      .toArray(),
  ]);
  const countByCat = new Map(counts.map((r) => [r._id, Number(r.n)]));
  return cats.map((c) => ({ ...c, post_count: countByCat.get(c.id) ?? 0 }));
}

export async function getCategoryById(id: number): Promise<CategoryWithCount | null> {
  const db = await getNativeDb();
  const row = await db.collection<CategoryStored>("categories").findOne({ id });
  if (!row) return null;
  const post_count = await db.collection("posts").countDocuments({ category_id: id, status: "published" });
  return { ...row, post_count };
}

/** Case-insensitive duplicate check (excluding one id when editing). */
export async function categoryNameTaken(name: string, excludeId?: number): Promise<boolean> {
  const db = await getNativeDb();
  const query: Document = { name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
  if (excludeId !== undefined) query.id = { $ne: excludeId };
  return (await db.collection("categories").countDocuments(query)) > 0;
}

export async function categorySlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const db = await getNativeDb();
  const query: Document = { slug };
  if (excludeId !== undefined) query.id = { $ne: excludeId };
  return (await db.collection("categories").countDocuments(query)) > 0;
}

export interface CategoryInput {
  name: string;
  slug?: string;
}

export async function createCategory(input: CategoryInput): Promise<number> {
  const repo = await getRepo("categories");
  const id = await nextId("categories");
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

export async function updateCategory(id: number, input: CategoryInput): Promise<boolean> {
  const repo = await getRepo("categories");
  const result = await repo.updateMany(
    { id },
    { $set: { name: input.name.trim(), slug: input.slug?.trim() || slugify(input.name), updated_at: new Date() } }
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function deleteCategory(id: number): Promise<boolean> {
  const db = await getNativeDb();
  // Detach posts first (posts keep existing without a category).
  await db.collection("posts").updateMany({ category_id: id }, { $set: { category_id: null, updated_at: new Date() } });
  const repo = await getRepo("categories");
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}
