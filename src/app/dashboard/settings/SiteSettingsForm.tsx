"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateSiteSettingsAction,
  type SiteSettingsFormState,
} from "./actions";
import { SETTING_FIELDS, type SiteSettings } from "@/lib/settings-schema";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

const GROUPS: Array<{ id: "Hero" | "Contact" | "Footer" | "Booking"; title: string; hint: string }> = [
  { id: "Hero", title: "Hero section", hint: "The top landing area of the homepage" },
  { id: "Contact", title: "Contact info", hint: "Info cards beside the contact form" },
  { id: "Footer", title: "Footer", hint: "Social links and brand blurb at page bottom" },
  {
    id: "Booking",
    title: "Meeting booking",
    hint:
      "Visitor scheduler backed by your Google Calendar. Leave the Calendar ID empty to hide the booking section. Requires GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY env vars and the calendar shared with the service account.",
  },
];

/** Fields where ==cyan== inline markup is supported. */
const MARKUP_FIELDS = new Set(["contact_response_note"]);

export default function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useActionState<SiteSettingsFormState | undefined, FormData>(
    updateSiteSettingsAction,
    undefined
  );

  const inputCls =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div
          role="alert"
          className="animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {state.error}
        </div>
      )}
      {state?.success && (
        <div
          role="status"
          className="animate-fade-in flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <span>✓</span> Settings saved — the homepage is updated.
        </div>
      )}

      {GROUPS.map((group) => (
        <fieldset key={group.id} className="rounded-2xl border border-zinc-800/60 p-5">
          <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            {group.title}
          </legend>
          <p className="mb-4 text-[11px] text-zinc-600">{group.hint}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {SETTING_FIELDS.filter((f) => f.group === group.id).map((field) => (
              <div
                key={field.key}
                className={field.multiline ? "sm:col-span-2" : undefined}
              >
                <label
                  htmlFor={field.key}
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  {field.label}
                  {MARKUP_FIELDS.has(field.key) && (
                    <span className="ml-2 normal-case text-[10px] text-zinc-600">
                      supports ==cyan== highlights
                    </span>
                  )}
                </label>
                {field.multiline ? (
                  <textarea
                    id={field.key}
                    name={field.key}
                    rows={3}
                    maxLength={500}
                    defaultValue={settings[field.key]}
                    className={`${inputCls} resize-y`}
                  />
                ) : (
                  <input
                    id={field.key}
                    name={field.key}
                    type={field.type === "url" ? "url" : field.type === "email" ? "email" : "text"}
                    maxLength={500}
                    defaultValue={settings[field.key]}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
