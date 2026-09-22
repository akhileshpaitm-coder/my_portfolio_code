import "server-only";
import { getDb } from "@/lib/db";
import { SiteSetting } from "@/lib/entities";
import {
  SETTING_DEFAULTS,
  SETTING_KEYS,
  type SettingKey,
  type SiteSettings,
} from "./settings-schema";

export { SETTING_DEFAULTS, SETTING_KEYS, SETTING_FIELDS } from "./settings-schema";
export type { SettingKey, SiteSettings } from "./settings-schema";

/** All settings in the DB (unrecognized keys ignored). */
async function getRawSettings(): Promise<Partial<Record<SettingKey, string>>> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(SiteSetting);
  const rows = await repo.find({});
  const out: Partial<Record<SettingKey, string>> = {};
  for (const row of rows) {
    const k = row.key as SettingKey;
    if (SETTING_KEYS.includes(k)) out[k] = String(row.value ?? "");
  }
  return out;
}

/** Full settings map — DB values overlaid on the hardcoded defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  let raw: Partial<Record<SettingKey, string>>;
  try {
    raw = await getRawSettings();
  } catch {
    // Collection missing (migration pending) — defaults only.
    raw = {};
  }
  return { ...SETTING_DEFAULTS, ...raw };
}

/** Persist a subset of settings with one upsert per changed key. */
export async function updateSettings(
  values: Partial<Record<SettingKey, string>>
): Promise<void> {
  const entries = Object.entries(values).filter(([k]) =>
    SETTING_KEYS.includes(k as SettingKey)
  );
  if (entries.length === 0) return;

  const ds = await getDb();
  const repo = ds.getMongoRepository(SiteSetting);
  await Promise.all(
    entries.map(([k, v]) =>
      repo.updateMany(
        { key: k },
        { $set: { key: k, value: v ?? "", updated_at: new Date() } },
        { upsert: true }
      )
    )
  );
}
