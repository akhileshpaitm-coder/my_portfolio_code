import "server-only";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

export interface ExpertiseItem {
  id: number;
  title: string;
  sort_order: number;
}

interface ExpertiseRow extends RowDataPacket, ExpertiseItem {}

/** All expertise items ordered for display. */
export async function getExpertise(): Promise<ExpertiseItem[]> {
  const [rows] = await pool.query<ExpertiseRow[]>(
    "SELECT id, title, sort_order FROM expertise ORDER BY sort_order, title, id"
  );
  return rows;
}

/** Existing titles (trimmed) for duplicate checks; can exclude one id. */
export async function getExpertiseTitles(excludeId?: number): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    excludeId !== undefined
      ? "SELECT title FROM expertise WHERE id <> ?"
      : "SELECT title FROM expertise",
    excludeId !== undefined ? [excludeId] : []
  );
  return rows.map((r) => String(r.title ?? "").trim());
}

export async function getExpertiseById(id: number): Promise<ExpertiseItem | null> {
  const [rows] = await pool.query<ExpertiseRow[]>(
    "SELECT id, title, sort_order FROM expertise WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createExpertise(input: {
  title: string;
  sort_order: number;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO expertise (title, sort_order) VALUES (?, ?)",
    [input.title, input.sort_order]
  );
  return result.insertId;
}

export async function updateExpertise(
  id: number,
  input: { title: string; sort_order: number }
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE expertise SET title = ?, sort_order = ? WHERE id = ?",
    [input.title, input.sort_order, id]
  );
  return result.affectedRows > 0;
}

export async function deleteExpertise(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM expertise WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

/** Sort value for a new item when the admin leaves the field empty. */
export async function nextExpertiseSortOrder(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT MAX(sort_order) AS max FROM expertise"
  );
  const max = (rows[0] as { max: number | null } | undefined)?.max ?? 0;
  return max + 1;
}
