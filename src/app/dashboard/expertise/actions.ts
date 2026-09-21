"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createExpertise,
  updateExpertise,
  deleteExpertise,
  nextExpertiseSortOrder,
  getExpertiseTitles,
} from "@/lib/expertise";

export interface ExpertiseFormState {
  error?: string;
}

/** Only admins may manage expertise (defense in depth — pages also gate). */
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Titles are case-insensitively unique. */
function isDuplicate(title: string, existing: string[]): boolean {
  const t = title.trim().toLowerCase();
  return existing.some((e) => e.trim().toLowerCase() === t);
}

function parseInput(formData: FormData) {
  const rawSort = String(formData.get("sort_order") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    // Empty field = auto-assign; invalid values fall through to validate().
    sort_order: rawSort === "" ? null : Number(rawSort),
  };
}

function validate(input: ReturnType<typeof parseInput>): string | undefined {
  if (!input.title) return "Title is required.";
  if (input.title.length > 120)
    return "Title must be 120 characters or fewer.";
  if (input.sort_order !== null) {
    if (!Number.isFinite(input.sort_order) || !Number.isInteger(input.sort_order) || input.sort_order < 0)
      return "Sort order must be a whole number ≥ 0.";
  }
  return undefined;
}

/** Shared revalidation: admin list + the public homepage section. */
function revalidateExpertise() {
  revalidatePath("/dashboard/expertise");
  revalidatePath("/"); // homepage section
}

export async function createExpertiseAction(
  _prev: ExpertiseFormState | undefined,
  formData: FormData
): Promise<ExpertiseFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage expertise." };
  }

  const input = parseInput(formData);
  const error = validate(input);
  if (error) return { error };

  const existing = await getExpertiseTitles();
  if (isDuplicate(input.title, existing)) {
    return { error: `"${input.title}" already exists.` };
  }

  const sort_order =
    input.sort_order !== null && input.sort_order !== 0
      ? input.sort_order
      : await nextExpertiseSortOrder();

  await createExpertise({ title: input.title, sort_order });
  revalidateExpertise();
  redirect("/dashboard/expertise");
}

export async function updateExpertiseAction(
  _prev: ExpertiseFormState | undefined,
  formData: FormData
): Promise<ExpertiseFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage expertise." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid expertise id." };

  const input = parseInput(formData);
  const error = validate(input);
  if (error) return { error };

  const existing = await getExpertiseTitles(id);
  if (isDuplicate(input.title, existing)) {
    return { error: `"${input.title}" already exists.` };
  }

  const sort_order =
    input.sort_order !== null && input.sort_order !== 0
      ? input.sort_order
      : 0;

  const ok = await updateExpertise(id, { title: input.title, sort_order });
  if (!ok) return { error: "Expertise item not found." };

  revalidateExpertise();
  redirect("/dashboard/expertise");
}

export async function deleteExpertiseAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteExpertise(id);
    revalidateExpertise();
  }
}
