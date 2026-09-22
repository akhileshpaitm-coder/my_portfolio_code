"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { setActionToast } from "@/lib/action-toast";
import {
  createAboutParagraph,
  updateAboutParagraph,
  deleteAboutParagraph,
  nextAboutParagraphSortOrder,
  createCoreValue,
  updateCoreValue,
  deleteCoreValue,
  nextCoreValueSortOrder,
} from "@/lib/about";

export interface AboutFormState {
  error?: string;
}

/** Only admins may manage about content (defense in depth — pages also gate). */
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Shared revalidation: admin pages + the public homepage section. */
function revalidateAbout() {
  revalidatePath("/dashboard/about");
  revalidatePath("/");
}

/* ─────────────────────────────────────────────
 * Paragraphs
 * ───────────────────────────────────────────── */

function parseParagraph(formData: FormData) {
  const rawSort = String(formData.get("sort_order") ?? "").trim();
  return {
    body: String(formData.get("body") ?? "").trim(),
    emphasized: formData.get("emphasized") === "on",
    sort_order: rawSort === "" ? null : Number(rawSort),
  };
}

const MARKUP_HINT =
  'Use **bold**, ==cyan== and *white* to highlight text inline. HTML is not allowed.';

function validateParagraph(input: ReturnType<typeof parseParagraph>): string | undefined {
  if (!input.body) return "Paragraph text is required.";
  if (input.body.length > 5000) return "Paragraph must be 5000 characters or fewer.";
  if (/[<>]/.test(input.body))
    return `Angle brackets are not allowed. ${MARKUP_HINT}`;
  if (input.sort_order !== null) {
    if (!Number.isFinite(input.sort_order) || !Number.isInteger(input.sort_order) || input.sort_order < 0)
      return "Sort order must be a whole number ≥ 0.";
  }
  return undefined;
}

export async function createParagraphAction(
  _prev: AboutFormState | undefined,
  formData: FormData
): Promise<AboutFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage about content." };
  }

  const input = parseParagraph(formData);
  const error = validateParagraph(input);
  if (error) return { error };

  const sort_order =
    input.sort_order !== null && input.sort_order !== 0
      ? input.sort_order
      : await nextAboutParagraphSortOrder();

  await createAboutParagraph({
    body: input.body,
    emphasized: input.emphasized,
    sort_order,
  });
  revalidateAbout();
  await setActionToast({
    variant: "success",
    title: "Paragraph added",
    description: "The about paragraph is now live.",
  });
  redirect("/dashboard/about");
}

export async function updateParagraphAction(
  _prev: AboutFormState | undefined,
  formData: FormData
): Promise<AboutFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage about content." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid paragraph id." };

  const input = parseParagraph(formData);
  const error = validateParagraph(input);
  if (error) return { error };

  const ok = await updateAboutParagraph(id, {
    body: input.body,
    emphasized: input.emphasized,
    sort_order: input.sort_order ?? 0,
  });
  if (!ok) return { error: "Paragraph not found." };

  revalidateAbout();
  await setActionToast({
    variant: "success",
    title: "Paragraph updated",
    description: "Your changes are now live.",
  });
  redirect("/dashboard/about");
}

export async function deleteParagraphAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteAboutParagraph(id);
    await setActionToast({
      variant: "success",
      title: "Paragraph deleted",
      description: "The about paragraph was removed.",
    });
    revalidateAbout();
  }
}

/* ─────────────────────────────────────────────
 * Core values
 * ───────────────────────────────────────────── */

function parseValue(formData: FormData) {
  const rawSort = String(formData.get("sort_order") ?? "").trim();
  return {
    icon: String(formData.get("icon") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    sort_order: rawSort === "" ? null : Number(rawSort),
  };
}

/** Single emoji (grapheme cluster), no letters/words. */
function isValidEmoji(s: string): boolean {
  return /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})(\uFE0F|\u200D(\p{Extended_Pictographic}|\p{Emoji_Presentation}))*$/u.test(
    s
  );
}

function validateValue(input: ReturnType<typeof parseValue>): string | undefined {
  if (!input.icon) return "Icon is required.";
  if (!isValidEmoji(input.icon))
    return "Icon must be a single emoji (e.g. 🎯, 🚀, 💡).";
  if (!input.title) return "Title is required.";
  if (input.title.length > 60) return "Title must be 60 characters or fewer.";
  if (!input.description) return "Description is required.";
  if (input.description.length > 160)
    return "Description must be 160 characters or fewer.";
  if (/[<>]/.test(input.description) || /[<>]/.test(input.title))
    return "Angle brackets are not allowed.";
  if (input.sort_order !== null) {
    if (!Number.isFinite(input.sort_order) || !Number.isInteger(input.sort_order) || input.sort_order < 0)
      return "Sort order must be a whole number ≥ 0.";
  }
  return undefined;
}

export async function createValueAction(
  _prev: AboutFormState | undefined,
  formData: FormData
): Promise<AboutFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage about content." };
  }

  const input = parseValue(formData);
  const error = validateValue(input);
  if (error) return { error };

  const sort_order =
    input.sort_order !== null && input.sort_order !== 0
      ? input.sort_order
      : await nextCoreValueSortOrder();

  await createCoreValue({
    icon: input.icon,
    title: input.title,
    description: input.description,
    sort_order,
  });
  revalidateAbout();
  await setActionToast({
    variant: "success",
    title: "Core value added",
    description: `"${input.title}" is now live.`,
  });
  redirect("/dashboard/about");
}

export async function updateValueAction(
  _prev: AboutFormState | undefined,
  formData: FormData
): Promise<AboutFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to manage about content." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid value id." };

  const input = parseValue(formData);
  const error = validateValue(input);
  if (error) return { error };

  const ok = await updateCoreValue(id, {
    icon: input.icon,
    title: input.title,
    description: input.description,
    sort_order: input.sort_order ?? 0,
  });
  if (!ok) return { error: "Core value not found." };

  revalidateAbout();
  await setActionToast({
    variant: "success",
    title: "Core value updated",
    description: `"${input.title}" was saved.`,
  });
  redirect("/dashboard/about");
}

export async function deleteValueAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteCoreValue(id);
    await setActionToast({
      variant: "success",
      title: "Core value deleted",
      description: "The core value was removed.",
    });
    revalidateAbout();
  }
}
