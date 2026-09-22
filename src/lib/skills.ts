import "server-only";
import type { Document, Filter } from "mongodb";
import { getDb, getNativeDb, nextId } from "@/lib/db";
import { Skill as SkillEntity } from "@/lib/entities";

export interface Skill {
  id: number;
  category: string;
  name: string;
  sort_order: number;
}

type SkillStored = Document & Skill;

/** All skills ordered for display (cards order by min sort per category). */
export async function getSkills(): Promise<Skill[]> {
  const db = await getNativeDb();
  const rows = await db
    .collection<SkillStored>("skills")
    .find(
      {},
      { projection: { _id: 0, id: 1, category: 1, name: 1, sort_order: 1 } }
    )
    .sort({ sort_order: 1, name: 1, id: 1 })
    .toArray();
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    name: r.name,
    sort_order: r.sort_order,
  }));
}

/**
 * Existing category+name pairs (trimmed), for client-side duplicate checks.
 * Optionally exclude one skill id (the one being edited).
 */
export async function getSkillNames(
  excludeId?: number
): Promise<Array<{ category: string; name: string }>> {
  const db = await getNativeDb();
  const query: Filter<SkillStored> =
    excludeId !== undefined ? { id: { $ne: excludeId } } : {};
  const rows = await db
    .collection<SkillStored>("skills")
    .find(query, { projection: { _id: 0, category: 1, name: 1 } })
    .toArray();
  return rows.map((r) => ({
    category: String(r.category ?? "").trim(),
    name: String(r.name ?? "").trim(),
  }));
}

/** Distinct category names (for the form's category suggestions). */
export async function getSkillCategories(): Promise<string[]> {
  const db = await getNativeDb();
  const values = await db.collection("skills").distinct("category");
  return values
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .sort();
}

export async function getSkillById(id: number): Promise<Skill | null> {
  const db = await getNativeDb();
  const row = await db
    .collection<SkillStored>("skills")
    .findOne(
      { id },
      { projection: { _id: 0, id: 1, category: 1, name: 1, sort_order: 1 } }
    );
  return row
    ? { id: row.id, category: row.category, name: row.name, sort_order: row.sort_order }
    : null;
}

export interface SkillInput {
  category: string;
  name: string;
  sort_order: number;
}

export async function createSkill(input: SkillInput): Promise<number> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(SkillEntity);
  const id = await nextId("skills");
  const now = new Date();
  await repo.insertOne({
    id,
    category: input.category,
    name: input.name,
    sort_order: input.sort_order,
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function updateSkill(id: number, input: SkillInput): Promise<boolean> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(SkillEntity);
  const result = await repo.updateMany(
    { id },
    {
      $set: {
        category: input.category,
        name: input.name,
        sort_order: input.sort_order,
        updated_at: new Date(),
      },
    }
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function deleteSkill(id: number): Promise<boolean> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(SkillEntity);
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}

export async function nextSkillSortOrder(): Promise<number> {
  const db = await getNativeDb();
  const rows = await db
    .collection("skills")
    .aggregate<{ max: number | null }>([
      { $group: { _id: null, max: { $max: "$sort_order" } } },
    ])
    .toArray();
  const max = rows[0]?.max ?? 0;
  return max + 1;
}

export interface SkillGroup {
  category: string;
  names: string[];
}

/**
 * Shape skills into category groups for the public sections.
 * Cards/rows are ordered by each category's lowest sort_order; skills
 * within a group keep sort_order, then alphabetical.
 */
export function groupSkillsByCategory(skills: Skill[]): SkillGroup[] {
  const byCategory = new Map<string, Skill[]>();
  for (const s of skills) {
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }
  return [...byCategory.entries()]
    .sort(
      (a, b) =>
        Math.min(...a[1].map((s) => s.sort_order)) -
        Math.min(...b[1].map((s) => s.sort_order))
    )
    .map(([category, items]) => ({
      category,
      names: items
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .map((s) => s.name),
    }));
}
