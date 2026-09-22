"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/app/components/toast";
import {
  createExpertiseAction,
  updateExpertiseAction,
  type ExpertiseFormState,
} from "./actions";

export interface ExpertiseFormValues {
  id?: number;
  title: string;
  sort_order: number;
}

export interface ExpertiseFormProps {
  mode: "create" | "edit";
  values: ExpertiseFormValues;
  /** Existing titles for duplicate checks. */
  existingTitles: string[];
}

const inputBase =
  "w-full rounded-xl border bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:outline-none focus:ring-2";
const inputOk = "border-zinc-800 focus:border-cyan-500/50 focus:ring-cyan-500/20";
const inputErr = "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20";

type FieldErrors = { title?: string; sort_order?: string };

function validateTitle(
  v: string,
  existing: ExpertiseFormProps["existingTitles"]
): string | undefined {
  if (!v.trim()) return "Title is required.";
  if (v.trim().length > 120) return "Title must be 120 characters or fewer.";
  const t = v.trim().toLowerCase();
  if (existing.some((e) => e.trim().toLowerCase() === t)) {
    return `"${v.trim()}" already exists.`;
  }
  return undefined;
}

function validateSortOrder(v: string): string | undefined {
  if (!v.trim()) return undefined; // optional — server auto-assigns on create
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0)
    return "Sort order must be a whole number ≥ 0.";
  return undefined;
}

/** Submit button with pending state (matches SkillForm styling). */
function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Expertise"}
    </button>
  );
}

export default function ExpertiseForm({
  mode,
  values,
  existingTitles,
}: ExpertiseFormProps) {
  const toast = useToast();
  const action = mode === "create" ? createExpertiseAction : updateExpertiseAction;
  const [state, formAction] = useActionState<ExpertiseFormState | undefined, FormData>(
    action,
    undefined
  );

  // Server-side error (duplicate, unauthorized, DB failure) → toast.
  const seenStateRef = useRef<ExpertiseFormState | undefined>(undefined);
  useEffect(() => {
    if (state?.error && state !== seenStateRef.current) {
      seenStateRef.current = state;
      toast.error({ title: "Could not save expertise", description: state.error });
    }
  }, [state, toast]);

  const [title, setTitle] = useState(values.title);
  const [errors, setErrors] = useState<FieldErrors>({});

  const cls = (field: keyof FieldErrors) =>
    `${inputBase} ${errors[field] ? inputErr : inputOk}`;

  const runValidation = (field: keyof FieldErrors, value: string) => {
    const msg =
      field === "title" ? validateTitle(value, existingTitles) : validateSortOrder(value);
    setErrors((prev) => ({ ...prev, [field]: msg }));
    return !msg;
  };

  const handleSubmit = (formData: FormData) => {
    const next: FieldErrors = {
      title: validateTitle(String(formData.get("title") ?? ""), existingTitles),
      sort_order: validateSortOrder(String(formData.get("sort_order") ?? "")),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      toast.warning({ title: "Check the form", description: "Please fix the highlighted fields before saving." });
      return;
    }
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-5" noValidate>
      {values.id !== undefined && (
        <input type="hidden" name="id" value={values.id} />
      )}

      {state?.error && (
        <div
          role="alert"
          className="animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          maxLength={120}
          value={title}
          placeholder="e.g. Microservices Architecture"
          autoComplete="off"
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) runValidation("title", e.target.value);
          }}
          onBlur={(e) => runValidation("title", e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={cls("title")}
        />
        {errors.title && (
          <p id="title-error" className="mt-2 text-xs text-red-400">
            {errors.title}
          </p>
        )}
      </div>

      {/* Sort order */}
      <div className="max-w-[200px]">
        <label
          htmlFor="sort_order"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Sort order{" "}
          <span className="normal-case text-zinc-600">(optional)</span>
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={values.sort_order || ""}
          placeholder="auto"
          onChange={(e) => {
            if (errors.sort_order) runValidation("sort_order", e.target.value);
          }}
          onBlur={(e) => runValidation("sort_order", e.target.value)}
          aria-invalid={!!errors.sort_order}
          aria-describedby={errors.sort_order ? "sort-order-error" : undefined}
          className={cls("sort_order")}
        />
        <p className="mt-2 text-[11px] text-zinc-600">
          Lower numbers appear first. Leave empty to append at the end.
        </p>
        {errors.sort_order && (
          <p id="sort-order-error" className="mt-2 text-xs text-red-400">
            {errors.sort_order}
          </p>
        )}
      </div>

      <SubmitButton isEdit={mode === "edit"} />
    </form>
  );
}
