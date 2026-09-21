-- ─────────────────────────────────────────────
-- Site settings (dashboard-managed homepage strings + footer socials)
-- Key/value store; lib/settings.ts defines defaults for any missing key,
-- so the site renders correctly even with an empty table.
-- Safe to re-run.
-- Run with: mysql -u root -p < scripts/db/site-settings-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

CREATE TABLE IF NOT EXISTS site_settings (
  `key`        VARCHAR(60) NOT NULL,
  `value`      TEXT NOT NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE = InnoDB;

-- Seed the current hardcoded values (idempotent — re-running never
-- overwrites edits made through the dashboard).
INSERT INTO site_settings (`key`, `value`) VALUES
  ('hero_badge',        '✦ 6+ Years of Experience'),
  ('hero_tagline',      'Full Stack Software Developer specializing in building scalable, secure, and high-performance web & mobile applications with modern technologies.'),
  ('hero_stat1_value',  '6+'),
  ('hero_stat1_label',  'Years Experience'),
  ('hero_stat2_value',  '50+'),
  ('hero_stat2_label',  'Projects Delivered'),
  ('hero_stat3_value',  '20+'),
  ('hero_stat3_label',  'Technologies'),
  ('contact_email',     'akhileshpaitm@gmail.com'),
  ('contact_location',  'India'),
  ('contact_availability', 'Open to opportunities'),
  ('contact_response_note', 'I typically respond within ==24 hours==. For urgent inquiries, feel free to reach out via email directly.'),
  ('footer_github_url', 'https://github.com/akhileshpaitm-coder'),
  ('footer_linkedin_url', 'https://www.linkedin.com/in/akhilesh-prajapati-9a8682193'),
  ('footer_blurb',      'Building scalable, secure, and high-performance web & mobile applications for 6+ years — from enterprise platforms and e-commerce to cloud solutions and real-time systems.')
ON DUPLICATE KEY UPDATE `key` = VALUES(`key`);
