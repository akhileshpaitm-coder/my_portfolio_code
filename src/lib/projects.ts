import "server-only";
import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

export interface Project {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  tech: string[];
  demo_url: string | null;
  screenshot_url: string | null;
  video_url: string | null;
  video_path: string | null;
  sort_order: number;
}

interface ProjectRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string | null;
  tech: string | null;
  demo_url: string | null;
  screenshot_url: string | null;
  video_url: string | null;
  video_path: string | null;
  sort_order: number;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    color: row.color,
    features: row.features ? row.features.split("\n").map((s) => s.trim()).filter(Boolean) : [],
    tech: row.tech ? row.tech.split("\n").map((s) => s.trim()).filter(Boolean) : [],
    demo_url: row.demo_url,
    screenshot_url: row.screenshot_url,
    video_url: row.video_url,
    video_path: row.video_path,
    sort_order: row.sort_order,
  };
}

/** All projects ordered for display (public site + admin list). */
export async function getProjects(): Promise<Project[]> {
  const [rows] = await pool.query<ProjectRow[]>(
    "SELECT id, title, description, icon, color, features, tech, demo_url, screenshot_url, video_url, video_path, sort_order FROM projects ORDER BY sort_order, id"
  );
  return rows.map(toProject);
}

/**
 * Titles of all existing projects (trimmed), for client-side duplicate checks.
 * Optionally exclude one project id (the one being edited).
 */
export async function getProjectTitles(excludeId?: number): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    excludeId !== undefined
      ? "SELECT title FROM projects WHERE id <> ?"
      : "SELECT title FROM projects",
    excludeId !== undefined ? [excludeId] : []
  );
  return rows.map((r) => String(r.title ?? "").trim()).filter(Boolean);
}

export async function getProjectById(id: number): Promise<Project | null> {
  const [rows] = await pool.query<ProjectRow[]>(
    "SELECT id, title, description, icon, color, features, tech, demo_url, screenshot_url, video_url, video_path, sort_order FROM projects WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ? toProject(rows[0]) : null;
}

export interface ProjectInput {
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  tech: string[];
  demo_url: string | null;
  screenshot_url: string | null;
  video_url: string | null;
  video_path: string | null;
  sort_order: number;
}

export async function createProject(input: ProjectInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO projects (title, description, icon, color, features, tech, demo_url, screenshot_url, video_url, video_path, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.description,
      input.icon,
      input.color,
      input.features.join("\n"),
      input.tech.join("\n"),
      input.demo_url,
      input.screenshot_url,
      input.video_url,
      input.video_path,
      input.sort_order,
    ]
  );
  return result.insertId;
}

export async function updateProject(id: number, input: ProjectInput): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE projects SET title = ?, description = ?, icon = ?, color = ?, features = ?, tech = ?, demo_url = ?, screenshot_url = ?, video_url = ?, video_path = ?, sort_order = ?
     WHERE id = ?`,
    [
      input.title,
      input.description,
      input.icon,
      input.color,
      input.features.join("\n"),
      input.tech.join("\n"),
      input.demo_url,
      input.screenshot_url,
      input.video_url,
      input.video_path,
      input.sort_order,
      id,
    ]
  );
  return result.affectedRows > 0;
}

export async function deleteProject(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM projects WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

export async function nextSortOrder(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT MAX(sort_order) AS max FROM projects"
  );
  const max = (rows[0] as { max: number | null } | undefined)?.max ?? 0;
  return max + 1;
}
