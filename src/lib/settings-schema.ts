/**
 * Client-safe settings schema — pure constants and types, NO db imports and
 * NO "server-only". Both the admin form (client) and the server library
 * (lib/settings.ts) import from here.
 */
export const SETTING_DEFAULTS = {
  hero_badge: "✦ 6+ Years of Experience",
  hero_tagline:
    "Full Stack Software Developer specializing in building scalable, secure, and high-performance web & mobile applications with modern technologies.",
  hero_stat1_value: "6+",
  hero_stat1_label: "Years Experience",
  hero_stat2_value: "50+",
  hero_stat2_label: "Projects Delivered",
  hero_stat3_value: "20+",
  hero_stat3_label: "Technologies",
  contact_email: "akhileshpaitm@gmail.com",
  contact_location: "India",
  contact_availability: "Open to opportunities",
  contact_response_note:
    "I typically respond within ==24 hours==. For urgent inquiries, feel free to reach out via email directly.",
  footer_github_url: "https://github.com/akhileshpaitm-coder",
  footer_linkedin_url: "https://www.linkedin.com/in/akhilesh-prajapati-9a8682193",
  footer_blurb:
    "Building scalable, secure, and high-performance web & mobile applications for 6+ years — from enterprise platforms and e-commerce to cloud solutions and real-time systems.",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SiteSettings = Record<SettingKey, string>;

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

/** Metadata for the admin form. */
export const SETTING_FIELDS: Array<{
  key: SettingKey;
  label: string;
  group: "Hero" | "Contact" | "Footer";
  multiline?: boolean;
  type?: "text" | "url" | "email";
}> = [
  { key: "hero_badge", label: "Badge text", group: "Hero" },
  { key: "hero_tagline", label: "Tagline", group: "Hero", multiline: true },
  { key: "hero_stat1_value", label: "Stat 1 — value", group: "Hero" },
  { key: "hero_stat1_label", label: "Stat 1 — label", group: "Hero" },
  { key: "hero_stat2_value", label: "Stat 2 — value", group: "Hero" },
  { key: "hero_stat2_label", label: "Stat 2 — label", group: "Hero" },
  { key: "hero_stat3_value", label: "Stat 3 — value", group: "Hero" },
  { key: "hero_stat3_label", label: "Stat 3 — label", group: "Hero" },
  { key: "contact_email", label: "Email", group: "Contact", type: "email" },
  { key: "contact_location", label: "Location", group: "Contact" },
  { key: "contact_availability", label: "Availability", group: "Contact" },
  { key: "contact_response_note", label: "Response note", group: "Contact", multiline: true },
  { key: "footer_github_url", label: "GitHub URL", group: "Footer", type: "url" },
  { key: "footer_linkedin_url", label: "LinkedIn URL", group: "Footer", type: "url" },
  { key: "footer_blurb", label: "Footer blurb", group: "Footer", multiline: true },
];
