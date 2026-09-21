"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createSkillAction,
  updateSkillAction,
  type SkillFormState,
} from "./actions";

export interface SkillFormValues {
  id?: number;
  category: string;
  name: string;
  sort_order: number;
}

export interface SkillFormProps {
  mode: "create" | "edit";
  values: SkillFormValues;
  /** Existing category+name pairs for duplicate checks. */
  existingNames: Array<{ category: string; name: string }>;
  /** Distinct categories for the suggestion list. */
  categories: string[];
}

const HEX_GRADIENTS = [
  ["#06b6d4", "#0891b2"],
  ["#8b5cf6", "#6d28d9"],
  ["#ec4899", "#db2777"],
  ["#f59e0b", "#d97706"],
  ["#10b981", "#059669"],
];

const inputBase =
  "w-full rounded-xl border bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:outline-none focus:ring-2";
const inputOk = "border-zinc-800 focus:border-cyan-500/50 focus:ring-cyan-500/20";
const inputErr = "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20";

type FieldErrors = { category?: string; name?: string; sort_order?: string };

function validateCategory(v: string): string | undefined {
  if (!v.trim()) return "Category is required.";
  if (v.trim().length > 60) return "Category must be 60 characters or fewer.";
  return undefined;
}

function validateName(v: string, category: string, existing: SkillFormProps["existingNames"]): string | undefined {
  if (!v.trim()) return "Skill name is required.";
  if (v.trim().length > 60) return "Skill name must be 60 characters or fewer.";
  const c = category.trim().toLowerCase();
  const n = v.trim().toLowerCase();
  if (c && existing.some((e) => e.category.toLowerCase() === c && e.name.toLowerCase() === n)) {
    return `"${v.trim()}" already exists in this category.`;
  }
  return undefined;
}

function validateSortOrder(v: string): string | undefined {
  if (!v.trim()) return undefined; // optional — server auto-assigns
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0)
    return "Sort order must be a whole number ≥ 0.";
  return undefined;
}

/** Submit button with pending state (matches ProjectForm styling). */
function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Skill"}
    </button>
  );
}

export default function SkillForm({ mode, values, existingNames, categories }: SkillFormProps) {
  const action = mode === "create" ? createSkillAction : updateSkillAction;
  const [state, formAction] = useActionState<SkillFormState | undefined, FormData>(
    action,
    undefined
  );

  const [category, setCategory] = useState(values.category);
  const [name, setName] = useState(values.name);
  const [errors, setErrors] = useState<FieldErrors>({});

  const cls = (field: keyof FieldErrors) =>
    `${inputBase} ${errors[field] ? inputErr : inputOk}`;

  const runValidation = (field: keyof FieldErrors, value: string) => {
    let msg: string | undefined;
    if (field === "category") msg = validateCategory(value);
    if (field === "name") msg = validateName(value, category, existingNames);
    if (field === "sort_order") msg = validateSortOrder(value);
    setErrors((prev) => ({ ...prev, [field]: msg }));
    return !msg;
  };

  const handleSubmit = (formData: FormData) => {
    const next: FieldErrors = {
      category: validateCategory(String(formData.get("category") ?? "")),
      name: validateName(String(formData.get("name") ?? ""), category, existingNames),
      sort_order: validateSortOrder(String(formData.get("sort_order") ?? "")),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
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

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Category
        </label>
        <input
          id="category"
          name="category"
          list="skill-categories"
          maxLength={60}
          value={category}
          placeholder="e.g. Frontend"
          autoComplete="off"
          onChange={(e) => {
            setCategory(e.target.value);
            // Category change may invalidate the name's uniqueness check
            if (errors.name) runValidation("name", name);
            if (errors.category) runValidation("category", e.target.value);
          }}
          onBlur={(e) => runValidation("category", e.target.value)}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? "category-error" : undefined}
          className={cls("category")}
        />
        <datalist id="skill-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <p className="mt-2 text-[11px] text-zinc-600">
          Skills are grouped into cards by category. Pick an existing one or
          type a new category name.
        </p>
        {errors.category && (
          <p id="category-error" className="mt-2 text-xs text-red-400">
            {errors.category}
          </p>
        )}
      </div>

      {/* Skill name */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Skill name
        </label>
        <input
          id="name"
          name="name"
          maxLength={60}
          value={name}
          placeholder="e.g. Next.js"
          autoComplete="off"
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) runValidation("name", e.target.value);
          }}
          onBlur={(e) => runValidation("name", e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={cls("name")}
        />
        {errors.name && (
          <p id="name-error" className="mt-2 text-xs text-red-400">
            {errors.name}
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
          Cards are ordered by the lowest sort order in each category.
        </p>
        {errors.sort_order && (
          <p id="sort-order-error" className="mt-2 text-xs text-red-400">
            {errors.sort_order}
          </p>
        )}
      </div>

      {/* Live preview chip */}
      {name.trim() && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-zinc-600">
            Preview:
          </span>
          <span className="tag-chip">{name.trim()}</span>
        </div>
      )}

      <SubmitButton isEdit={mode === "edit"} />
    </form>
  );
}

/** Gradient used by the public section for a category (index-based fallback). */
export function gradientForCategory(index: number): string {
  const [from, to] = HEX_GRADIENTS[index % HEX_GRADIENTS.length];
  return `${from} 0%, ${to} 100%`;
}
