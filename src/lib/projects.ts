import "server-only";
import type { Filter, Document } from "mongodb";
import { getNativeDb, getRepo, nextId } from "@/lib/db";

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

interface ProjectStored extends Document {
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

function toProject(row: ProjectStored): Project {
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

const PROJECTION = {
  projection: {
    _id: 0,
    id: 1,
    title: 1,
    description: 1,
    icon: 1,
    color: 1,
    features: 1,
    tech: 1,
    demo_url: 1,
    screenshot_url: 1,
    video_url: 1,
    video_path: 1,
    sort_order: 1,
  },
};

/** All projects ordered for display (public site + admin list). */
export async function getProjects(): Promise<Project[]> {
  const db = await getNativeDb();
  const rows = await db
    .collection<ProjectStored>("projects")
    .find({})
    .sort({ sort_order: 1, id: 1 })
    .toArray();
  return rows.map(toProject);
}

/**
 * Titles of all existing projects (trimmed), for client-side duplicate checks.
 * Optionally exclude one project id (the one being edited).
 */
export async function getProjectTitles(excludeId?: number): Promise<string[]> {
  const db = await getNativeDb();
  const query: Filter<ProjectStored> =
    excludeId !== undefined ? { id: { $ne: excludeId } } : {};
  const rows = await db
    .collection<ProjectStored>("projects")
    .find(query, { projection: { _id: 0, title: 1 } })
    .toArray();
  return rows.map((r) => String(r.title ?? "").trim()).filter(Boolean);
}

export async function getProjectById(id: number): Promise<Project | null> {
  const db = await getNativeDb();
  const row = await db
    .collection<ProjectStored>("projects")
    .findOne({ id }, PROJECTION);
  return row ? toProject(row) : null;
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
  const repo = await getRepo("projects");
  const id = await nextId("projects");
  const now = new Date();
  await repo.insertOne({
    id,
    title: input.title,
    description: input.description,
    icon: input.icon,
    color: input.color,
    features: input.features.join("\n"),
    tech: input.tech.join("\n"),
    demo_url: input.demo_url,
    screenshot_url: input.screenshot_url,
    video_url: input.video_url,
    video_path: input.video_path,
    sort_order: input.sort_order,
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function updateProject(id: number, input: ProjectInput): Promise<boolean> {
  const repo = await getRepo("projects");
  const result = await repo.updateMany(
    { id },
    {
      $set: {
        title: input.title,
        description: input.description,
        icon: input.icon,
        color: input.color,
        features: input.features.join("\n"),
        tech: input.tech.join("\n"),
        demo_url: input.demo_url,
        screenshot_url: input.screenshot_url,
        video_url: input.video_url,
        video_path: input.video_path,
        sort_order: input.sort_order,
        updated_at: new Date(),
      },
    }
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function deleteProject(id: number): Promise<boolean> {
  const repo = await getRepo("projects");
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}

export async function nextSortOrder(): Promise<number> {
  const db = await getNativeDb();
  const rows = await db
    .collection("projects")
    .aggregate<{ max: number | null }>([
      { $group: { _id: null, max: { $max: "$sort_order" } } },
    ])
    .toArray();
  const max = rows[0]?.max ?? 0;
  return max + 1;
}
