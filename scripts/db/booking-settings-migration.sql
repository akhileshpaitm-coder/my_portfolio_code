-- ─────────────────────────────────────────────
-- Meeting booking settings (dashboard-managed via Site Settings)
-- Adds booking_* keys to site_settings. Defaults produce the example in
-- the request: one 2-hour window (08:00–10:00), 20-minute slots.
-- Safe to re-run (seeds never overwrite dashboard edits).
-- Run with: mysql -u root -p < scripts/db/booking-settings-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

INSERT INTO site_settings (`key`, `value`) VALUES
  ('booking_window_start', '08:00'),
  ('booking_window_end',   '10:00'),
  ('booking_slot_minutes', '20'),
  ('booking_timezone',     'Asia/Kolkata'),
  ('booking_calendar_id',  '')
ON DUPLICATE KEY UPDATE `key` = VALUES(`key`);
