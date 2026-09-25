"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/app/components/toast";
import PostEditor from "./PostEditor";
import { createPostAction, updatePostAction, type PostFormState } from "./actions";
import type { BlogCategory, BlogTag } from "@/lib/blog-types";

export interface PostFormValues {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category_id: number | null;
  tagIds: number[];
  status: "draft" | "published";
}

/**
 * Create/edit post form. Two submit buttons (Save draft / Publish) set the
 * hidden `status` field before submitting, so one form covers both flows.
 */
export default function PostForm({
  mode,
  values,
  categories,
  tags,
}: {
  mode: "create" | "edit";
  values: PostFormValues;
  categories: Array<Pick<BlogCategory, "id" | "name">>;
  tags: Array<Pick<BlogTag, "id" | "name">>;
}) {
  const toast = useToast();
  const action = mode === "create" ? createPostAction : updatePostAction;
  const [state, formAction] = useActionState<PostFormState | undefined, FormData>(
    action,
    undefined
  );
  const [featuredImage, setFeaturedImage] = useState(values.featured_image);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>(values.tagIds);
  const [status, setStatus] = useState<"draft" | "published">(values.status);
  const formRef = useRef<HTMLFormElement>(null);

  // Server-side errors → toast.
  const seenState = useRef<PostFormState | undefined>(undefined);
  useEffect(() => {
    if (state?.error && state !== seenState.current) {
      seenState.current = state;
      toast.error({ title: "Could not save the post", description: state.error });
    }
  }, [state, toast]);

  const uploadFeatured = async (file: File) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      toast.error({ title: "Unsupported image type", description: "Use PNG, JPG, WebP or GIF." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error({ title: "Image too large", description: "Images must be 5 MB or smaller." });
      return;
    }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/blog", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
      setFeaturedImage(data.url);
      toast.success({ title: "Featured image uploaded" });
    } catch (err) {
      toast.error({
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleTag = (id: number) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const submitWithStatus = (next: "draft" | "published") => {
    setStatus(next);
    // Let React flush the hidden input value before the action reads it.
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {values.id !== undefined && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="featured_image" value={featuredImage} />
      <input type="hidden" name="tag_ids" value={selectedTags.join(",")} />

      {state?.error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column: title + content */}
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Title
            </label>
            <input
              id="title"
              name="title"
              maxLength={180}
              defaultValue={values.title}
              placeholder="e.g. Building a Realtime Dashboard with Next.js and WebSockets"
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-base font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Excerpt <span className="normal-case text-zinc-600">(optional — auto-generated if empty)</span>
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              maxLength={300}
              defaultValue={values.excerpt}
              placeholder="One or two sentences shown on cards and in search results."
              className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Content
            </label>
            <PostEditor name="content" initialContent={values.content} />
          </div>
        </div>

        {/* Sidebar: meta, image, category, tags, publish */}
        <div className="space-y-5">
          {/* Featured image */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Featured image
            </p>
            <div className="mb-3 flex h-36 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
              {featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredImage}
                  alt="Featured image preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-3xl">🖼️</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`cursor-pointer rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 ${
                  uploadingImage ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {uploadingImage ? "Uploading…" : "⬆ Upload"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void uploadFeatured(file);
                  }}
                />
              </label>
              {featuredImage && (
                <button
                  type="button"
                  onClick={() => setFeaturedImage("")}
                  className="cursor-pointer rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">PNG, JPG, WebP or GIF · up to 5 MB.</p>
          </div>

          {/* Category */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
            <label htmlFor="category_id" className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Category
            </label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={values.category_id ?? ""}
              className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Tags
            </p>
            {tags.length === 0 ? (
              <p className="text-xs text-zinc-600">
                No tags yet — create some under Blog → Tags.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      aria-pressed={active}
                      className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                        active
                          ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/50"
                          : "bg-zinc-900/60 text-zinc-500 ring-1 ring-zinc-800 hover:text-zinc-300 hover:ring-zinc-600"
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Slug (SEO) */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
            <label htmlFor="slug" className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Slug <span className="normal-case text-zinc-600">(SEO)</span>
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={values.slug}
              placeholder="auto-generated from the title"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
            />
            <p className="mt-2 text-[11px] text-zinc-600">
              Leave empty to auto-generate a unique slug from the title.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800/60 pt-5">
        <PostFormSubmitButtons
          mode={mode}
          isPublishing={status === "published"}
          onPickStatus={submitWithStatus}
        />
        <p className="text-[11px] text-zinc-600">
          Content is sanitized server-side before publishing.
        </p>
      </div>
    </form>
  );
}

/**
 * Submit buttons (stable top-level component so useFormStatus tracks the
 * enclosing form). Picking a button first sets the hidden `status` field,
 * then submits the form.
 */
function PostFormSubmitButtons({
  mode,
  isPublishing,
  onPickStatus,
}: {
  mode: "create" | "edit";
  isPublishing: boolean;
  onPickStatus: (status: "draft" | "published") => void;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => onPickStatus("draft")}
        className="cursor-pointer rounded-full border border-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && !isPublishing ? "Saving…" : "Save draft"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => onPickStatus("published")}
        className="cursor-pointer rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending && isPublishing
          ? "Publishing…"
          : mode === "create"
            ? "Publish"
            : "Save & publish"}
      </button>
      {pending && (
        <span className="flex items-center gap-2 text-xs text-zinc-500">
          <svg className="h-3.5 w-3.5 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Saving — don&apos;t close this page
        </span>
      )}
    </div>
  );
}
