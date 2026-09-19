"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createProject,
  updateProject,
  deleteProject,
  nextSortOrder,
  getProjectTitles,
} from "@/lib/projects";

export interface ProjectFormState {
  error?: string;
}

/** Only admins may manage projects (defense in depth — pages also gate). */
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

const URL_RE = /^https?:\/\/\S+$/i;
/** Local uploads are served from /uploads/... */
const PATH_RE = /^\/uploads\/\S+$/;

/** Titles are case-insensitively unique. */
function isDuplicateTitle(title: string, existing: string[]): boolean {
  const t = title.trim().toLowerCase();
  return existing.some((e) => e.trim().toLowerCase() === t);
}

/** Optional URL-or-upload-path field: null when empty. */
function parseUrlField(formData: FormData, name: string): string | null | "invalid" {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  if (PATH_RE.test(raw) || URL_RE.test(raw)) return raw;
  return "invalid";
}

function parseInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "📦").trim() || "📦";
  const color = String(formData.get("color") ?? "#06b6d4").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  const demoUrl = parseUrlField(formData, "demo_url");
  const screenshotUrl = parseUrlField(formData, "screenshot_url");
  const videoUrl = parseUrlField(formData, "video_url");
  const videoPath = parseUrlField(formData, "video_path");

  const features = String(formData.get("features") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const tech = String(formData.get("tech") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    title, description, icon, color, features, tech, sort_order: sortOrder,
    demo_url: demoUrl, screenshot_url: screenshotUrl, video_url: videoUrl, video_path: videoPath,
  };
}

function validate(input: ReturnType<typeof parseInput>): string | undefined {
  if (!input.title) return "Title is required.";
  if (input.title.length > 180) return "Title must be 180 characters or fewer.";
  if (!input.description) return "Description is required.";
  if (!/^#[0-9a-fA-F]{6}$/.test(input.color)) return "Color must be a hex value like #06b6d4.";
  if (!Number.isFinite(input.sort_order) || input.sort_order < 0) return "Sort order must be a non-negative number.";
  if (input.demo_url === "invalid") return "Demo URL must start with http:// or https://";
  if (input.screenshot_url === "invalid") return "Screenshot must be an uploaded file or an http(s) URL.";
  if (input.video_url === "invalid") return "Video URL must start with http:// or https://";
  if (input.video_path === "invalid") return "Uploaded video path is invalid — upload the file again.";
  return undefined;
}

/** Server actions persist null for empty/invalid media fields. */
function normalizeMedia(input: ReturnType<typeof parseInput>) {
  const pick = (v: string | null | "invalid") => (v && v !== "invalid" ? v : null);
  return {
    demo_url: pick(input.demo_url),
    screenshot_url: pick(input.screenshot_url),
    video_url: pick(input.video_url),
    video_path: pick(input.video_path),
  };
}

export async function createProjectAction(
  _prev: ProjectFormState | undefined,
  formData: FormData
): Promise<ProjectFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage projects." };
  }

  const input = parseInput(formData);
  const error = validate(input);
  if (error) return { error };

  const existingTitles = await getProjectTitles();
  if (isDuplicateTitle(input.title, existingTitles)) {
    return { error: `A project titled "${input.title}" already exists. Please choose a different title.` };
  }

  if (!input.sort_order) input.sort_order = await nextSortOrder();

  await createProject({ ...input, ...normalizeMedia(input) });
  revalidatePath("/dashboard/projects");
  revalidatePath("/projects");
  revalidatePath("/"); // homepage section
  redirect("/dashboard/projects");
}

export async function updateProjectAction(
  _prev: ProjectFormState | undefined,
  formData: FormData
): Promise<ProjectFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage projects." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid project id." };

  const input = parseInput(formData);
  const error = validate(input);
  if (error) return { error };

  const existingTitles = await getProjectTitles(id);
  if (isDuplicateTitle(input.title, existingTitles)) {
    return { error: `A project titled "${input.title}" already exists. Please choose a different title.` };
  }

  const ok = await updateProject(id, { ...input, ...normalizeMedia(input) });
  if (!ok) return { error: "Project not found." };

  revalidatePath("/dashboard/projects");
  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/dashboard/projects");
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteProject(id);
    revalidatePath("/dashboard/projects");
    revalidatePath("/projects");
    revalidatePath("/");
  }
}
