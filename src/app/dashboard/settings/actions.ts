"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateSettings } from "@/lib/settings";
import {
  SETTING_FIELDS,
  SETTING_KEYS,
  type SettingKey,
} from "@/lib/settings-schema";

export interface SiteSettingsFormState {
  error?: string;
  success?: boolean;
}

/** Only admins may edit site settings. */
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function updateSiteSettingsAction(
  _prev: SiteSettingsFormState | undefined,
  formData: FormData
): Promise<SiteSettingsFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You are not authorized to edit site settings." };
  }

  const values: Partial<Record<SettingKey, string>> = {};

  for (const field of SETTING_FIELDS) {
    const raw = String(formData.get(field.key) ?? "").trim();
    if (!raw) return { error: `${field.label} is required.` };
    if (raw.length > 500) {
      return { error: `${field.label} must be 500 characters or fewer.` };
    }
    if (field.type === "url" && !/^https?:\/\/\S+\.\S+/.test(raw)) {
      return { error: `${field.label} must be a valid http(s) URL.` };
    }
    if (field.key === "contact_email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      return { error: "Email must be a valid email address." };
    }
    values[field.key] = raw;
  }

  // Guard against tampered form posts carrying unexpected keys.
  const allowed = new Set<string>(SETTING_KEYS);
  for (const [k] of Object.entries(values)) {
    if (!allowed.has(k)) return { error: "Invalid setting key." };
  }

  try {
    await updateSettings(values);
  } catch (err) {
    console.error("Failed to save site settings:", err);
    return { error: "Failed to save settings. Check the database and try again." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/settings");
  return { success: true };
}
