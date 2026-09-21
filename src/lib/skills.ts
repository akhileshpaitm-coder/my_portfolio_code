import "server-only";
import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

export interface Skill {
  id: number;
  category: string;
  name: string;
  sort_order: number;
}

interface SkillRow extends RowDataPacket {
  id: number;
  category: string;
  name: string;
  sort_order: number;
}

/** All skills ordered for display (cards order by min sort per category). */
export async function getSkills(): Promise<Skill[]> {
  const [rows] = await pool.query<SkillRow[]>(
    "SELECT id, category, name, sort_order FROM skills ORDER BY sort_order, name, id"
  );
  return rows;
}

/**
 * Existing category+name pairs (trimmed), for client-side duplicate checks.
 * Optionally exclude one skill id (the one being edited).
 */
export async function getSkillNames(
  excludeId?: number
): Promise<Array<{ category: string; name: string }>> {
  const [rows] = await pool.query<RowDataPacket[]>(
    excludeId !== undefined
      ? "SELECT category, name FROM skills WHERE id <> ?"
      : "SELECT category, name FROM skills",
    excludeId !== undefined ? [excludeId] : []
  );
  return rows.map((r) => ({
    category: String(r.category ?? "").trim(),
    name: String(r.name ?? "").trim(),
  }));
}

/** Distinct category names (for the form's category suggestions). */
export async function getSkillCategories(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT category FROM skills GROUP BY category ORDER BY MIN(sort_order)"
  );
  return rows.map((r) => String(r.category ?? "").trim()).filter(Boolean);
}

export async function getSkillById(id: number): Promise<Skill | null> {
  const [rows] = await pool.query<SkillRow[]>(
    "SELECT id, category, name, sort_order FROM skills WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export interface SkillInput {
  category: string;
  name: string;
  sort_order: number;
}

export async function createSkill(input: SkillInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO skills (category, name, sort_order) VALUES (?, ?, ?)",
    [input.category, input.name, input.sort_order]
  );
  return result.insertId;
}

export async function updateSkill(id: number, input: SkillInput): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE skills SET category = ?, name = ?, sort_order = ? WHERE id = ?",
    [input.category, input.name, input.sort_order, id]
  );
  return result.affectedRows > 0;
}

export async function deleteSkill(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM skills WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

export async function nextSkillSortOrder(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT MAX(sort_order) AS max FROM skills"
  );
  const max = (rows[0] as { max: number | null } | undefined)?.max ?? 0;
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
