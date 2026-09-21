"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createSkill,
  updateSkill,
  deleteSkill,
  nextSkillSortOrder,
  getSkillNames,
} from "@/lib/skills";

export interface SkillFormState {
  error?: string;
}

/** Only admins may manage skills (defense in depth — pages also gate). */
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Category+name pairs are case-insensitively unique. */
function isDuplicateSkill(
  category: string,
  name: string,
  existing: Array<{ category: string; name: string }>
): boolean {
  const c = category.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  return existing.some(
    (e) => e.category.trim().toLowerCase() === c && e.name.trim().toLowerCase() === n
  );
}

function parseInput(formData: FormData) {
  const category = String(formData.get("category") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  return { category, name, sort_order: sortOrder };
}

function validate(input: ReturnType<typeof parseInput>): string | undefined {
  if (!input.category) return "Category is required.";
  if (input.category.length > 60)
    return "Category must be 60 characters or fewer.";
  if (!input.name) return "Skill name is required.";
  if (input.name.length > 60) return "Skill name must be 60 characters or fewer.";
  if (!Number.isFinite(input.sort_order) || input.sort_order < 0)
    return "Sort order must be a non-negative number.";
  return undefined;
}

export async function createSkillAction(
  _prev: SkillFormState | undefined,
  formData: FormData
): Promise<SkillFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage skills." };
  }

  const input = parseInput(formData);
  const error = validate(input);
  if (error) return { error };

  const existing = await getSkillNames();
  if (isDuplicateSkill(input.category, input.name, existing)) {
    return {
      error: `"${input.name}" already exists in "${input.category}".`,
    };
  }

  if (!input.sort_order) input.sort_order = await nextSkillSortOrder();

  await createSkill(input);
  revalidatePath("/dashboard/skills");
  revalidatePath("/skills");
  revalidatePath("/tech-stack");
  revalidatePath("/"); // homepage section
  redirect("/dashboard/skills");
}

export async function updateSkillAction(
  _prev: SkillFormState | undefined,
  formData: FormData
): Promise<SkillFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage skills." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid skill id." };

  const input = parseInput(formData);
  const error = validate(input);
  if (error) return { error };

  const existing = await getSkillNames(id);
  if (isDuplicateSkill(input.category, input.name, existing)) {
    return {
      error: `"${input.name}" already exists in "${input.category}".`,
    };
  }

  const ok = await updateSkill(id, input);
  if (!ok) return { error: "Skill not found." };

  revalidatePath("/dashboard/skills");
  revalidatePath("/skills");
  revalidatePath("/tech-stack");
  revalidatePath("/");
  redirect("/dashboard/skills");
}

export async function deleteSkillAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteSkill(id);
    revalidatePath("/dashboard/skills");
    revalidatePath("/skills");
    revalidatePath("/tech-stack");
    revalidatePath("/");
  }
}
