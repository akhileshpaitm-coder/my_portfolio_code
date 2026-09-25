/**
 * 006 — site_settings key/value collection.
 *
 * Mirrors the old MySQL `site_settings` table (`key` was the PK; here it is
 * a unique indexed field). lib/settings.ts defines defaults for any missing
 * key, so the site renders correctly even with an empty collection.
 */
export async function up(db) {
  await db.createCollection("site_settings").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });

  await db
    .collection("site_settings")
    .createIndex({ key: 1 }, { unique: true, name: "uq_site_settings_key" });

  const seeds = [
    ["hero_badge", "✦ 6+ Years of Experience"],
    ["hero_tagline", "Full Stack Software Developer specializing in building scalable, secure, and high-performance web & mobile applications with modern technologies."],
    ["hero_stat1_value", "6+"],
    ["hero_stat1_label", "Years Experience"],
    ["hero_stat2_value", "50+"],
    ["hero_stat2_label", "Projects Delivered"],
    ["hero_stat3_value", "20+"],
    ["hero_stat3_label", "Technologies"],
    ["contact_email", "akhileshpaitm@gmail.com"],
    ["contact_location", "India"],
    ["contact_availability", "Open to opportunities"],
    ["contact_response_note", "I typically respond within ==24 hours==. For urgent inquiries, feel free to reach out via email directly."],
    ["footer_github_url", "https://github.com/akhileshpaitm-coder"],
    ["footer_linkedin_url", "https://www.linkedin.com/in/akhilesh-prajapati-9a8682193"],
    ["footer_blurb", "Building scalable, secure, and high-performance web & mobile applications for 6+ years — from enterprise platforms and e-commerce to cloud solutions and real-time systems."],
  ];

  for (const [key, value] of seeds) {
    // Seeds never overwrite dashboard edits — insert only when missing.
    await db
      .collection("site_settings")
      .updateOne(
        { key },
        { $setOnInsert: { key, value, updated_at: new Date() } },
        { upsert: true }
      );
  }
}
