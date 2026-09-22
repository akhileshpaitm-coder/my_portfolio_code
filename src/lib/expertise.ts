import "server-only";
import type { Filter, Document } from "mongodb";
import { getNativeDb, getRepo, nextId } from "@/lib/db";

export interface ExpertiseItem {
  id: number;
  title: string;
  sort_order: number;
}

type ExpertiseStored = ExpertiseItem & Document;

/** All expertise items ordered for display. */
export async function getExpertise(): Promise<ExpertiseItem[]> {
  const db = await getNativeDb();
  const rows = await db
    .collection<ExpertiseStored>("expertise")
    .find({})
    .sort({ sort_order: 1, title: 1, id: 1 })
    .toArray();
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    sort_order: r.sort_order,
  }));
}

/** Existing titles (trimmed) for duplicate checks; can exclude one id. */
export async function getExpertiseTitles(excludeId?: number): Promise<string[]> {
  const db = await getNativeDb();
  const query: Filter<ExpertiseStored> =
    excludeId !== undefined ? { id: { $ne: excludeId } } : {};
  const rows = await db
    .collection<ExpertiseStored>("expertise")
    .find(query, { projection: { _id: 0, title: 1 } })
    .toArray();
  return rows.map((r) => String(r.title ?? "").trim());
}

export async function getExpertiseById(id: number): Promise<ExpertiseItem | null> {
  const db = await getNativeDb();
  const row = await db
    .collection<ExpertiseStored>("expertise")
    .findOne({ id }, { projection: { _id: 0, id: 1, title: 1, sort_order: 1 } });
  return row ?? null;
}

export async function createExpertise(input: {
  title: string;
  sort_order: number;
}): Promise<number> {
  const repo = await getRepo("expertise");
  const id = await nextId("expertise");
  const now = new Date();
  await repo.insertOne({
    id,
    title: input.title,
    sort_order: input.sort_order,
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function updateExpertise(
  id: number,
  input: { title: string; sort_order: number }
): Promise<boolean> {
  const repo = await getRepo("expertise");
  const result = await repo.updateMany(
    { id },
    { $set: { title: input.title, sort_order: input.sort_order, updated_at: new Date() } }
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function deleteExpertise(id: number): Promise<boolean> {
  const repo = await getRepo("expertise");
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}

/** Sort value for a new item when the admin leaves the field empty. */
export async function nextExpertiseSortOrder(): Promise<number> {
  const db = await getNativeDb();
  const rows = await db
    .collection("expertise")
    .aggregate<{ max: number | null }>([
      { $group: { _id: null, max: { $max: "$sort_order" } } },
    ])
    .toArray();
  const max = rows[0]?.max ?? 0;
  return max + 1;
}
