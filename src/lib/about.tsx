import "server-only";
import type { ReactNode } from "react";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

export interface AboutParagraph {
  id: number;
  body: string;
  /** Intro-style paragraph (larger, brighter) — mirrors the old hardcoded first paragraph. */
  emphasized: boolean;
  sort_order: number;
}

export interface CoreValue {
  id: number;
  /** Emoji shown before the title. */
  icon: string;
  title: string;
  description: string;
  sort_order: number;
}

interface AboutParagraphRow extends RowDataPacket, AboutParagraph {}
interface CoreValueRow extends RowDataPacket, CoreValue {}

/* ─────────────────────────────────────────────
 * Paragraphs
 * ───────────────────────────────────────────── */

export async function getAboutParagraphs(): Promise<AboutParagraph[]> {
  const [rows] = await pool.query<AboutParagraphRow[]>(
    "SELECT id, body, emphasized, sort_order FROM about_paragraphs ORDER BY sort_order, id"
  );
  return rows;
}

export async function getAboutParagraphById(id: number): Promise<AboutParagraph | null> {
  const [rows] = await pool.query<AboutParagraphRow[]>(
    "SELECT id, body, emphasized, sort_order FROM about_paragraphs WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createAboutParagraph(input: {
  body: string;
  emphasized: boolean;
  sort_order: number;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO about_paragraphs (body, emphasized, sort_order) VALUES (?, ?, ?)",
    [input.body, input.emphasized ? 1 : 0, input.sort_order]
  );
  return result.insertId;
}

export async function updateAboutParagraph(
  id: number,
  input: { body: string; emphasized: boolean; sort_order: number }
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE about_paragraphs SET body = ?, emphasized = ?, sort_order = ? WHERE id = ?",
    [input.body, input.emphasized ? 1 : 0, input.sort_order, id]
  );
  return result.affectedRows > 0;
}

export async function deleteAboutParagraph(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM about_paragraphs WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

export async function nextAboutParagraphSortOrder(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT MAX(sort_order) AS max FROM about_paragraphs"
  );
  const max = (rows[0] as { max: number | null } | undefined)?.max ?? 0;
  return max + 1;
}

/* ─────────────────────────────────────────────
 * Core values
 * ───────────────────────────────────────────── */

export async function getCoreValues(): Promise<CoreValue[]> {
  const [rows] = await pool.query<CoreValueRow[]>(
    "SELECT id, icon, title, description, sort_order FROM core_values ORDER BY sort_order, id"
  );
  return rows;
}

export async function getCoreValueById(id: number): Promise<CoreValue | null> {
  const [rows] = await pool.query<CoreValueRow[]>(
    "SELECT id, icon, title, description, sort_order FROM core_values WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createCoreValue(input: {
  icon: string;
  title: string;
  description: string;
  sort_order: number;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO core_values (icon, title, description, sort_order) VALUES (?, ?, ?, ?)",
    [input.icon, input.title, input.description, input.sort_order]
  );
  return result.insertId;
}

export async function updateCoreValue(
  id: number,
  input: { icon: string; title: string; description: string; sort_order: number }
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE core_values SET icon = ?, title = ?, description = ?, sort_order = ? WHERE id = ?",
    [input.icon, input.title, input.description, input.sort_order, id]
  );
  return result.affectedRows > 0;
}

export async function deleteCoreValue(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM core_values WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

export async function nextCoreValueSortOrder(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT MAX(sort_order) AS max FROM core_values"
  );
  const max = (rows[0] as { max: number | null } | undefined)?.max ?? 0;
  return max + 1;
}

/* ─────────────────────────────────────────────
 * Inline markup → JSX
 * ───────────────────────────────────────────── */

/**
 * Render the paragraph markup understood by the admin form:
 *   **text**  → semibold white highlight
 *   ==text==  → cyan highlight
 *   *text*    → soft white emphasis
 * Plain text is escaped by React — raw HTML is never injected.
 */
export function renderInlineMarkup(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|==([^=]+)==|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-zinc-100">
          {m[1]}
        </strong>
      );
    } else if (m[2] !== undefined) {
      nodes.push(
        <span key={key++} className="text-cyan-300">
          {m[2]}
        </span>
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <span key={key++} className="text-zinc-200">
          {m[3]}
        </span>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
