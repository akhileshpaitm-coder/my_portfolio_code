"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/app/components/toast";
import {
  createParagraphAction,
  updateParagraphAction,
  createValueAction,
  updateValueAction,
  type AboutFormState,
} from "./actions";

const inputBase =
  "w-full rounded-xl border bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:outline-none focus:ring-2";
const inputOk = "border-zinc-800 focus:border-cyan-500/50 focus:ring-cyan-500/20";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

function StateAlert({ state }: { state: AboutFormState | undefined }) {
  const toast = useToast();
  const seenRef = useRef<AboutFormState | undefined>(undefined);

  useEffect(() => {
    if (state?.error && state !== seenRef.current) {
      seenRef.current = state;
      toast.error({ title: "Could not save", description: state.error });
    }
  }, [state, toast]);

  if (!state?.error) return null;
  return (
    <div
      role="alert"
      className="animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {state.error}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Paragraph form
 * ───────────────────────────────────────────── */

export interface ParagraphFormValues {
  id?: number;
  body: string;
  emphasized: boolean;
  sort_order: number;
}

/** Segment the markup for the live preview chips. */
function previewSegments(body: string): Array<{ text: string; kind: "plain" | "bold" | "cyan" }> {
  const out: Array<{ text: string; kind: "plain" | "bold" | "cyan" }> = [];
  const re = /\*\*([^*]+)\*\*|==([^=]+)==|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) out.push({ text: body.slice(last, m.index), kind: "plain" });
    if (m[1] !== undefined) out.push({ text: m[1], kind: "bold" });
    else if (m[2] !== undefined) out.push({ text: m[2], kind: "cyan" });
    else if (m[3] !== undefined) out.push({ text: m[3], kind: "bold" });
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push({ text: body.slice(last), kind: "plain" });
  return out.filter((s) => s.text.length > 0);
}

export function ParagraphForm({
  mode,
  values,
}: {
  mode: "create" | "edit";
  values: ParagraphFormValues;
}) {
  const action =
    mode === "create" ? createParagraphAction : updateParagraphAction;
  const [state, formAction] = useActionState<AboutFormState | undefined, FormData>(
    action,
    undefined
  );
  const [body, setBody] = useState(values.body);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {values.id !== undefined && (
        <input type="hidden" name="id" value={values.id} />
      )}

      <StateAlert state={state} />

      <div>
        <label
          htmlFor="body"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Paragraph text
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a paragraph… use **bold**, ==cyan==, *white* for highlights"
          className={`${inputBase} ${inputOk} resize-y min-h-[120px]`}
        />
        <p className="mt-2 text-[11px] text-zinc-600">
          Inline markup: <code className="text-zinc-400">**bold**</code>,{" "}
          <code className="text-cyan-400">==cyan==</code>,{" "}
          <code className="text-zinc-200">*white*</code>. HTML is not allowed.
        </p>
      </div>

      {/* Live preview */}
      {body.trim() && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-zinc-600">
            Preview
          </p>
          <p className="leading-relaxed text-zinc-400">
            {previewSegments(body).map((seg, i) =>
              seg.kind === "cyan" ? (
                <span key={i} className="text-cyan-300">{seg.text}</span>
              ) : seg.kind === "bold" ? (
                <span key={i} className="font-semibold text-zinc-100">{seg.text}</span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor="emphasized"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Intro style
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              id="emphasized"
              name="emphasized"
              type="checkbox"
              defaultChecked={values.emphasized}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-cyan-500"
            />
            Larger intro paragraph
          </label>
        </div>

        <div className="max-w-[180px]">
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
            className={`${inputBase} ${inputOk}`}
          />
        </div>
      </div>

      <SubmitButton>
        {mode === "create" ? "Add Paragraph" : "Save Changes"}
      </SubmitButton>
    </form>
  );
}

/* ─────────────────────────────────────────────
 * Core value form
 * ───────────────────────────────────────────── */

export interface ValueFormValues {
  id?: number;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
}

export function ValueForm({
  mode,
  values,
}: {
  mode: "create" | "edit";
  values: ValueFormValues;
}) {
  const action = mode === "create" ? createValueAction : updateValueAction;
  const [state, formAction] = useActionState<AboutFormState | undefined, FormData>(
    action,
    undefined
  );
  const [icon, setIcon] = useState(values.icon);
  const [title, setTitle] = useState(values.title);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {values.id !== undefined && (
        <input type="hidden" name="id" value={values.id} />
      )}

      <StateAlert state={state} />

      <div className="grid gap-5 sm:grid-cols-[110px_1fr]">
        <div>
          <label
            htmlFor="icon"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Icon
          </label>
          <input
            id="icon"
            name="icon"
            maxLength={8}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🎯"
            className={`${inputBase} text-center text-xl ${inputOk}`}
          />
        </div>
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
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Clean Code"
            className={`${inputBase} ${inputOk}`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={160}
          defaultValue={values.description}
          placeholder="Short one-line description"
          className={`${inputBase} ${inputOk} resize-y`}
        />
      </div>

      {/* Live preview */}
      {(icon.trim() || title.trim()) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-zinc-600">
            Preview
          </p>
          <div className="flex items-start gap-3">
            <span className="text-xl">{icon || "✨"}</span>
            <div>
              <div className="text-sm font-medium text-zinc-200">
                {title || "Title"}
              </div>
              <div className="text-xs text-zinc-500">
                {values.description || "Description"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[180px]">
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
          className={`${inputBase} ${inputOk}`}
        />
      </div>

      <SubmitButton>
        {mode === "create" ? "Add Value" : "Save Changes"}
      </SubmitButton>
    </form>
  );
}
