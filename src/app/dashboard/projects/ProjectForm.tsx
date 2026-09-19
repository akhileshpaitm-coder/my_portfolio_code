"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "./actions";

export interface ProjectFormValues {
  id?: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string; // newline-joined
  tech: string; // newline-joined
  sort_order: number;
  demo_url?: string;
  screenshot_url?: string;
  video_url?: string;
  video_path?: string;
}

/** Existing project titles (excluding the one being edited) for duplicate checks. */
export interface ProjectFormProps {
  mode: "create" | "edit";
  values: ProjectFormValues;
  existingTitles?: string[];
}

const COLOR_PRESETS = ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
const ICON_PRESETS = ["📦", "🤝", "🛒", "🏢", "📊", "🏥", "🔔", "💡", "🚀", "🎯", "🧩", "📱"];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/* ─────────────────────────────────────────────
 * Validation rules (shared by blur + submit)
 * ───────────────────────────────────────────── */
type FieldErrors = {
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: string;
  features?: string;
  tech?: string;
  demo_url?: string;
  screenshot_url?: string;
  video_url?: string;
};

function validateTitle(v: string): string | undefined {
  if (!v.trim()) return "Title is required.";
  if (v.trim().length < 3) return "Title must be at least 3 characters.";
  if (v.trim().length > 180) return "Title must be 180 characters or fewer.";
  return undefined;
}

/** Case-insensitive duplicate-title check against titles already in the DB. */
function validateTitleUnique(v: string, existingTitles: string[]): string | undefined {
  const t = v.trim().toLowerCase();
  if (!t) return undefined; // "required" is reported by validateTitle
  if (existingTitles.some((e) => e.trim().toLowerCase() === t)) {
    return "A project with this title already exists. Please choose a different title.";
  }
  return undefined;
}

function validateDescription(v: string): string | undefined {
  if (!v.trim()) return "Description is required.";
  if (v.trim().length < 10) return "Description must be at least 10 characters.";
  return undefined;
}

function validateIcon(v: string): string | undefined {
  if (!v.trim()) return "Pick an icon (emoji) for the project.";
  // reject multi-character strings that are not a single emoji/grapheme
  if (Array.from(v.trim()).length > 2) return "Use a single emoji character.";
  return undefined;
}

function validateColor(v: string): string | undefined {
  if (!v.trim()) return "Accent color is required.";
  if (!HEX_RE.test(v.trim())) return "Use a hex color like #06b6d4.";
  return undefined;
}

function validateSortOrder(v: string): string | undefined {
  if (!v.trim()) return undefined; // optional — server auto-assigns
  const n = Number(v);
  if (!Number.isFinite(n)) return "Sort order must be a number.";
  if (!Number.isInteger(n)) return "Sort order must be a whole number.";
  if (n < 0) return "Sort order cannot be negative.";
  return undefined;
}

/* Optional textarea (features/tech) — validate line length only */
function validateLines(v: string, label: string): string | undefined {
  const lines = v.split("\n").map((s) => s.trim()).filter(Boolean);
  const tooLong = lines.find((l) => l.length > 60);
  if (tooLong) return `Each ${label} entry must be 60 characters or fewer ("${tooLong.slice(0, 24)}…").`;
  return undefined;
}

/* Optional media fields — blank OR a valid http(s) URL / local upload path */
const MEDIA_URL_RE = /^https?:\/\/\S+$/i;
const UPLOAD_PATH_RE = /^\/uploads\/\S+/;

function validateMediaUrl(v: string, label: string): string | undefined {
  if (!v.trim()) return undefined; // optional
  if (!MEDIA_URL_RE.test(v.trim()) && !UPLOAD_PATH_RE.test(v.trim())) {
    return `${label} must be a valid http(s) URL or an uploaded file.`;
  }
  return undefined;
}

const FIELD_ORDER = [
  "title", "description", "icon", "color", "sort_order", "features", "tech",
  "demo_url", "screenshot_url", "video_url",
] as const;

/* ─────────────────────────────────────────────
 * Field error styles
 * ───────────────────────────────────────────── */
const inputBase =
  "w-full rounded-xl border bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:outline-none focus:ring-2";
const inputOk = "border-zinc-800 focus:border-cyan-500/50 focus:ring-cyan-500/20";
const inputErr = "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="animate-fade-in mt-2 flex items-center gap-1.5 text-xs text-red-400">
      <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a.9.9 0 00-.9.9v3.2a.9.9 0 001.8 0V6.9A.9.9 0 0010 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      {msg}
    </p>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Project"}
    </button>
  );
}

export default function ProjectForm({ mode, values, existingTitles = [] }: ProjectFormProps) {
  const action = mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction] = useActionState<ProjectFormState | undefined, FormData>(
    action,
    undefined
  );

  const [icon, setIcon] = useState(values.icon);
  const [color, setColor] = useState(values.color);
  const [screenshot, setScreenshot] = useState(values.screenshot_url ?? "");
  const [videoUrl, setVideoUrl] = useState(values.video_url ?? "");
  const [videoPath, setVideoPath] = useState(values.video_path ?? "");
  const [uploading, setUploading] = useState<"screenshot" | "video" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showSummary, setShowSummary] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const FIELD_LABELS: Record<keyof FieldErrors, string> = {
    title: "Title",
    description: "Description",
    icon: "Icon",
    color: "Accent color",
    sort_order: "Sort order",
    features: "Features",
    tech: "Tech stack",
    demo_url: "Demo URL",
    screenshot_url: "Screenshot",
    video_url: "Video URL",
  };

  const runValidation = (field: keyof FieldErrors, value: string) => {
    let msg: string | undefined;
    switch (field) {
      case "title":
        msg = validateTitle(value) ?? validateTitleUnique(value, existingTitles);
        break;
      case "description": msg = validateDescription(value); break;
      case "icon": msg = validateIcon(value); break;
      case "color": msg = validateColor(value); break;
      case "sort_order": msg = validateSortOrder(value); break;
      case "demo_url": msg = validateMediaUrl(value, "Demo URL"); break;
      case "screenshot_url": msg = validateMediaUrl(value, "Screenshot"); break;
      case "video_url": msg = validateMediaUrl(value, "Video URL"); break;
    }
    setErrors((prev) => ({ ...prev, [field]: msg }));
    return !msg;
  };

  const blur = (field: keyof FieldErrors, value: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    runValidation(field, value);
  };

  /** Upload a screenshot/video to /api/admin/upload (admin-only route). */
  const uploadFile = async (kind: "screenshot" | "video", file: File) => {
    setUploadError(null);
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data: { url?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed. Please try again.");
      if (kind === "screenshot") {
        setScreenshot(data.url);
        setTouched((t) => ({ ...t, screenshot_url: true }));
        runValidation("screenshot_url", data.url);
      } else {
        setVideoPath(data.url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = (formData: FormData) => {
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "");
    const sortOrder = String(formData.get("sort_order") ?? "");
    const demoUrl = String(formData.get("demo_url") ?? "");

    const next: FieldErrors = {
      title: validateTitle(title) ?? validateTitleUnique(title, existingTitles),
      description: validateDescription(description),
      icon: validateIcon(icon),
      color: validateColor(color),
      sort_order: validateSortOrder(sortOrder),
      demo_url: validateMediaUrl(demoUrl, "Demo URL"),
      screenshot_url: validateMediaUrl(screenshot, "Screenshot"),
      video_url: validateMediaUrl(videoUrl, "Video URL"),
    };

    // Optional textareas
    const featErr = validateLines(String(formData.get("features") ?? ""), "feature");
    const techErr = validateLines(String(formData.get("tech") ?? ""), "tech");

    setErrors({ ...next, ...(featErr && { features: featErr }), ...(techErr && { tech: techErr }) });
    setTouched((t) => ({
      ...t,
      title: true, description: true, icon: true, color: true, sort_order: true,
      demo_url: true, screenshot_url: true, video_url: true,
    }));

    const hasError =
      Object.values(next).some(Boolean) || Boolean(featErr) || Boolean(techErr);

    if (hasError) {
      // Show which fields are empty/invalid and jump to the first problem field
      setShowSummary(true);
      const firstBad = FIELD_ORDER.find((f) =>
        f === "features" ? featErr : f === "tech" ? techErr : next[f]
      );
      if (firstBad) {
        formRef.current
          ?.querySelector<HTMLElement>(`#${firstBad.replace("_", "-")}`)
          ?.focus();
      }
      return;
    }

    setShowSummary(false);
    formAction(formData);
  };

  const cls = (field: keyof FieldErrors) =>
    `${inputBase} ${errors[field] ? inputErr : inputOk}`;

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5" noValidate>
      {values.id !== undefined && <input type="hidden" name="id" value={values.id} />}

      {state?.error && (
        <div
          role="alert"
          className="animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {state.error}
        </div>
      )}

      {/* Validation summary — names every empty/invalid field */}
      {showSummary && (
        <div
          role="alert"
          className="animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <p className="font-semibold">Please fix the highlighted fields:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs">
            {FIELD_ORDER
              .filter((f) => errors[f])
              .map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    onClick={() =>
                      formRef.current
                        ?.querySelector<HTMLElement>(`#${f.replace("_", "-")}`)
                        ?.focus()
                    }
                    className="cursor-pointer text-left underline-offset-2 hover:underline"
                  >
                    {FIELD_LABELS[f]}: {errors[f]}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Title
        </label>
        <input
          id="title"
          name="title"
          maxLength={180}
          defaultValue={values.title}
          placeholder="e.g. Enterprise CRM Platform"
          autoComplete="off"
          onChange={(e) => touched.title && runValidation("title", e.target.value)}
          onBlur={(e) => blur("title", e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={cls("title")}
        />
        <FieldError id="title-error" msg={errors.title} />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={values.description}
          placeholder="What does this project do?"
          onChange={(e) => touched.description && runValidation("description", e.target.value)}
          onBlur={(e) => blur("description", e.target.value)}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          className={`${cls("description")} resize-y`}
        />
        <FieldError id="description-error" msg={errors.description} />
      </div>

      {/* Icon + Color row */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="icon" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Icon (emoji)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="icon"
              name="icon"
              value={icon}
              onChange={(e) => {
                setIcon(e.target.value);
                if (touched.icon) runValidation("icon", e.target.value);
              }}
              onBlur={() => blur("icon", icon)}
              maxLength={8}
              aria-invalid={!!errors.icon}
              aria-describedby={errors.icon ? "icon-error" : undefined}
              className={`${cls("icon")} w-20 text-center text-lg`}
            />
            <div className="flex flex-wrap gap-1">
              {ICON_PRESETS.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => {
                    setIcon(emo);
                    runValidation("icon", emo);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-base transition-all hover:scale-110 ${
                    icon === emo ? "bg-cyan-500/20 ring-1 ring-cyan-500/50" : "hover:bg-zinc-800/60"
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>
          <FieldError id="icon-error" msg={errors.icon} />
        </div>

        <div>
          <label htmlFor="color" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Accent color
          </label>
          <div className="flex items-center gap-2">
            <input
              id="color"
              name="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (touched.color) runValidation("color", e.target.value);
              }}
              onBlur={() => blur("color", color)}
              maxLength={7}
              aria-invalid={!!errors.color}
              aria-describedby={errors.color ? "color-error" : undefined}
              className={`${cls("color")} w-24 font-mono`}
            />
            <div className="flex gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    runValidation("color", c);
                  }}
                  aria-label={`Use color ${c}`}
                  className={`h-8 w-8 rounded-lg transition-transform hover:scale-110 ${
                    color.toLowerCase() === c.toLowerCase() ? "ring-2 ring-white/70" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <FieldError id="color-error" msg={errors.color} />
        </div>
      </div>

      {/* Features + Tech */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="features" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Features{" "}
            <span className="normal-case text-zinc-600">(one per line)</span>
          </label>
          <textarea
            id="features"
            name="features"
            rows={5}
            defaultValue={values.features}
            placeholder={"Lead Management\nPipeline Analytics"}
            aria-invalid={!!errors.features}
            aria-describedby={errors.features ? "features-error" : undefined}
            onBlur={(e) => {
              const msg = validateLines(e.target.value, "feature");
              setErrors((prev) => ({ ...prev, features: msg }));
            }}
            className={`${inputBase} ${errors.features ? inputErr : inputOk} resize-y`}
          />
          <FieldError id="features-error" msg={errors.features} />
        </div>
        <div>
          <label htmlFor="tech" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Tech stack{" "}
            <span className="normal-case text-zinc-600">(one per line)</span>
          </label>
          <textarea
            id="tech"
            name="tech"
            rows={5}
            defaultValue={values.tech}
            placeholder={"React.js\nNode.js\nMySQL"}
            aria-invalid={!!errors.tech}
            aria-describedby={errors.tech ? "tech-error" : undefined}
            onBlur={(e) => {
              const msg = validateLines(e.target.value, "tech");
              setErrors((prev) => ({ ...prev, tech: msg }));
            }}
            className={`${inputBase} ${errors.tech ? inputErr : inputOk} resize-y`}
          />
          <FieldError id="tech-error" msg={errors.tech} />
        </div>
      </div>

      {/* Sort order */}
      <div className="max-w-[200px]">
        <label htmlFor="sort_order" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Sort order
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={values.sort_order}
          onChange={(e) => touched.sort_order && runValidation("sort_order", e.target.value)}
          onBlur={(e) => blur("sort_order", e.target.value)}
          aria-invalid={!!errors.sort_order}
          aria-describedby={errors.sort_order ? "sort-order-error" : undefined}
          className={cls("sort_order")}
        />
        <FieldError id="sort-order-error" msg={errors.sort_order} />
      </div>

      {/* Hidden carry-through inputs for media resolved in React state */}
      <input type="hidden" name="screenshot_url" value={screenshot} />
      <input type="hidden" name="video_path" value={videoPath} />

      {/* ── Optional: Application demo media ── */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Application demo <span className="normal-case text-zinc-600">(all optional)</span>
          </p>
          {uploadError && (
            <p role="alert" className="text-xs text-red-400">{uploadError}</p>
          )}
        </div>

        <div className="space-y-5">
          {/* Demo URL */}
          <div>
            <label htmlFor="demo_url" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Demo URL <span className="normal-case text-zinc-600">(live app link)</span>
            </label>
            <input
              id="demo_url"
              name="demo_url"
              type="url"
              defaultValue={values.demo_url ?? ""}
              placeholder="https://your-app.example.com"
              onChange={(e) => touched.demo_url && runValidation("demo_url", e.target.value)}
              onBlur={(e) => blur("demo_url", e.target.value)}
              aria-invalid={!!errors.demo_url}
              aria-describedby={errors.demo_url ? "demo-url-error" : undefined}
              className={cls("demo_url")}
            />
            <FieldError id="demo-url-error" msg={errors.demo_url} />
          </div>

          {/* Screenshot: upload or URL */}
          <div>
            <label htmlFor="screenshot_url" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Demo screenshot <span className="normal-case text-zinc-600">(upload or paste a URL)</span>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              {/* Thumbnail preview */}
              <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-600">
                {screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={screenshot}
                    alt="Screenshot preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  "No screenshot"
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className={`cursor-pointer rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 ${
                      uploading === "screenshot" ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {uploading === "screenshot" ? "Uploading…" : "⬆ Upload image"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = ""; // allow re-selecting the same file
                        if (file) uploadFile("screenshot", file);
                      }}
                    />
                  </label>
                  {screenshot && (
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshot("");
                        runValidation("screenshot_url", "");
                      }}
                      className="cursor-pointer rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  id="screenshot_url"
                  value={screenshot}
                  onChange={(e) => {
                    setScreenshot(e.target.value);
                    if (touched.screenshot_url) runValidation("screenshot_url", e.target.value);
                  }}
                  onBlur={() => blur("screenshot_url", screenshot)}
                  placeholder="/uploads/projects/shots/… or https://…"
                  aria-invalid={!!errors.screenshot_url}
                  aria-describedby={errors.screenshot_url ? "screenshot-error" : undefined}
                  className={`${cls("screenshot_url")} font-mono text-xs`}
                />
                <p className="text-[11px] text-zinc-600">PNG, JPG, WebP or GIF · up to 5 MB.</p>
                <FieldError id="screenshot-error" msg={errors.screenshot_url} />
              </div>
            </div>
          </div>

          {/* Video: upload or URL */}
          <div>
            <label htmlFor="video_url" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Demo video <span className="normal-case text-zinc-600">(upload or paste a URL)</span>
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`cursor-pointer rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 ${
                    uploading === "video" ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  {uploading === "video" ? "Uploading…" : "⬆ Upload video"}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) uploadFile("video", file);
                    }}
                  />
                </label>
                {videoPath && (
                  <>
                    <span className="max-w-[240px] truncate rounded-lg bg-zinc-800/60 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
                      {videoPath}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVideoPath("")}
                      className="cursor-pointer rounded-lg border border-zinc-800 px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
              <input
                id="video_url"
                name="video_url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (touched.video_url) runValidation("video_url", e.target.value);
                }}
                onBlur={() => blur("video_url", videoUrl)}
                placeholder="https://youtube.com/watch?v=… or https://…"
                aria-invalid={!!errors.video_url}
                aria-describedby={errors.video_url ? "video-url-error" : undefined}
                className={cls("video_url")}
              />
              <p className="text-[11px] text-zinc-600">MP4, WebM or MOV · up to 100 MB — or link a YouTube/Vimeo URL.</p>
              <FieldError id="video-url-error" msg={errors.video_url} />
            </div>
          </div>
        </div>
      </div>

      <SubmitButton isEdit={mode === "edit"} />
    </form>
  );
}
