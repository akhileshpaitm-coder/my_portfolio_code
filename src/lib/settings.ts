import "server-only";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
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
  const [rows] = await pool.query<RowDataPacket[]>("SELECT `key`, `value` FROM site_settings");
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
    // Table missing (migration pending) — defaults only.
    raw = {};
  }
  return { ...SETTING_DEFAULTS, ...raw };
}

/** Persist a subset of settings in one round trip. */
export async function updateSettings(
  values: Partial<Record<SettingKey, string>>
): Promise<void> {
  const entries = Object.entries(values).filter(([k]) =>
    SETTING_KEYS.includes(k as SettingKey)
  );
  if (entries.length === 0) return;

  await pool.query<ResultSetHeader>(
    `INSERT INTO site_settings (\`key\`, \`value\`) VALUES ${entries
      .map(() => "(?, ?)")
      .join(", ")} ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
    entries.flatMap(([k, v]) => [k, v ?? ""])
  );
}
