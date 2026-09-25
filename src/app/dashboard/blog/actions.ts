"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { setActionToast } from "@/lib/action-toast";
import {
  createPost,
  updatePost,
  deletePost,
  setPostStatus,
  slugTaken,
  type PostInput,
} from "@/lib/blog";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  categoryNameTaken,
} from "@/lib/blog-categories";
import { createTag, updateTag, deleteTag, tagNameTaken } from "@/lib/blog-tags";
import { deleteComment } from "@/lib/blog-comments";

/* ─────────────────────────────────────────────
 * Guards
 * ───────────────────────────────────────────── */

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Form-state flavor of the guard: returns an error state instead of throwing. */
async function guardAdmin(): Promise<PostFormState | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return { error: "You are not authorized to manage posts." };
  }
}

function parseTags(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

/* ─────────────────────────────────────────────
 * Posts
 * ───────────────────────────────────────────── */

export interface PostFormState {
  error?: string;
}

function readPostForm(formData: FormData): PostInput & { customSlug: string } {
  const title = String(formData.get("title") ?? "").trim();
  return {
    title,
    slug: String(formData.get("slug") ?? "").trim() || undefined,
    excerpt: String(formData.get("excerpt") ?? "").trim() || undefined,
    content: String(formData.get("content") ?? ""),
    featured_image: String(formData.get("featured_image") ?? "").trim() || null,
    category_id: Number(formData.get("category_id")) || null,
    tagIds: parseTags(String(formData.get("tag_ids") ?? "")),
    status: (String(formData.get("status") ?? "draft") === "published"
      ? "published"
      : "draft") as PostInput["status"],
    customSlug: String(formData.get("slug") ?? "").trim(),
  };
}

export async function createPostAction(
  _prev: PostFormState | undefined,
  formData: FormData
): Promise<PostFormState> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const input = readPostForm(formData);
  if (!input.title) return { error: "Title is required." };
  if (input.title.length > 180) return { error: "Title must be 180 characters or fewer." };
  if (input.customSlug && (await slugTaken(input.customSlug))) {
    return { error: `The slug "${input.customSlug}" is already in use.` };
  }

  let id: number;
  try {
    const session = await requireAdmin();
    id = await createPost(input, Number(session.user.id));
  } catch (error) {
    console.error("[blog/createPost] failed:", error);
    return { error: "Could not save the post. Please try again." };
  }

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  revalidatePath("/");
  await setActionToast({
    variant: "success",
    title: input.status === "published" ? "Post published" : "Draft saved",
    description: `"${input.title}" was created.`,
  });
  redirect(`/dashboard/blog?highlight=${id}`);
}

export async function updatePostAction(
  _prev: PostFormState | undefined,
  formData: FormData
): Promise<PostFormState> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid post id." };

  const input = readPostForm(formData);
  if (!input.title) return { error: "Title is required." };
  if (input.title.length > 180) return { error: "Title must be 180 characters or fewer." };
  if (input.customSlug && (await slugTaken(input.customSlug, id))) {
    return { error: `The slug "${input.customSlug}" is already in use.` };
  }

  let ok: boolean;
  try {
    ok = await updatePost(id, input);
  } catch (error) {
    console.error("[blog/updatePost] failed:", error);
    return { error: "Could not save the post. Please try again." };
  }
  if (!ok) return { error: "Post not found." };

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${input.slug}`);
  await setActionToast({
    variant: "success",
    title: "Post updated",
    description: `"${input.title}" was saved.`,
  });
  redirect("/dashboard/blog");
}

/** Publish / unpublish from the posts table (no redirect — form action). */
export async function togglePostStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) === "published" ? "published" : "draft";
  if (Number.isInteger(id) && id > 0) {
    await setPostStatus(id, status);
    await setActionToast({
      variant: "success",
      title: status === "published" ? "Post published" : "Post unpublished",
      description: status === "published"
        ? "The post is now live on the blog."
        : "The post was moved back to drafts.",
    });
    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");
  }
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deletePost(id);
    await setActionToast({
      variant: "success",
      title: "Post deleted",
      description: "The post and its comments were removed.",
    });
    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");
  }
}

/* ─────────────────────────────────────────────
 * Categories
 * ───────────────────────────────────────────── */

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || undefined;
  if (!name) return;

  if (await categoryNameTaken(name)) {
    await setActionToast({
      variant: "error",
      title: "Category exists",
      description: `A category named "${name}" already exists.`,
    });
    revalidatePath("/dashboard/blog/categories");
    return;
  }

  await createCategory({ name, slug });
  await setActionToast({ variant: "success", title: "Category created", description: name });
  revalidatePath("/dashboard/blog/categories");
  revalidatePath("/blog");
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || undefined;
  if (!Number.isInteger(id) || id <= 0 || !name) return;

  if (await categoryNameTaken(name, id)) {
    await setActionToast({
      variant: "error",
      title: "Category exists",
      description: `A category named "${name}" already exists.`,
    });
    revalidatePath("/dashboard/blog/categories");
    return;
  }

  const ok = await updateCategory(id, { name, slug });
  await setActionToast({
    variant: ok ? "success" : "error",
    title: ok ? "Category updated" : "Category not found",
    description: ok ? name : undefined,
  });
  revalidatePath("/dashboard/blog/categories");
  revalidatePath("/blog");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteCategory(id);
    await setActionToast({
      variant: "success",
      title: "Category deleted",
      description: "Posts in this category are now uncategorized.",
    });
    revalidatePath("/dashboard/blog/categories");
    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");
  }
}

/* ─────────────────────────────────────────────
 * Tags
 * ───────────────────────────────────────────── */

export async function createTagAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || undefined;
  if (!name) return;

  if (await tagNameTaken(name)) {
    await setActionToast({
      variant: "error",
      title: "Tag exists",
      description: `A tag named "${name}" already exists.`,
    });
    revalidatePath("/dashboard/blog/tags");
    return;
  }

  await createTag({ name, slug });
  await setActionToast({ variant: "success", title: "Tag created", description: name });
  revalidatePath("/dashboard/blog/tags");
  revalidatePath("/blog");
}

export async function updateTagAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || undefined;
  if (!Number.isInteger(id) || id <= 0 || !name) return;

  if (await tagNameTaken(name, id)) {
    await setActionToast({
      variant: "error",
      title: "Tag exists",
      description: `A tag named "${name}" already exists.`,
    });
    revalidatePath("/dashboard/blog/tags");
    return;
  }

  const ok = await updateTag(id, { name, slug });
  await setActionToast({
    variant: ok ? "success" : "error",
    title: ok ? "Tag updated" : "Tag not found",
    description: ok ? name : undefined,
  });
  revalidatePath("/dashboard/blog/tags");
  revalidatePath("/blog");
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteTag(id);
    await setActionToast({ variant: "success", title: "Tag deleted" });
    revalidatePath("/dashboard/blog/tags");
    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");
  }
}

/* ─────────────────────────────────────────────
 * Comments (moderation)
 * ───────────────────────────────────────────── */

export async function deleteCommentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await deleteComment(id);
    await setActionToast({ variant: "success", title: "Comment deleted" });
    revalidatePath("/dashboard/blog/comments");
  }
}
