-- ─────────────────────────────────────────────
-- Email threading for contact messages and admin replies.
-- Stores the Message-ID of the visitor's original contact email and of each
-- reply email so replies can be sent with In-Reply-To/References headers.
-- Gmail/Outlook/Apple Mail then group the whole exchange into ONE thread
-- (Re: <subject>) instead of separate emails.
-- Safe to re-run (requires MariaDB or MySQL 8+ for ADD COLUMN IF NOT EXISTS;
-- on older MySQL run the two ALTERs manually once).
-- Run with: mysql -u root -p < scripts/db/email-threading-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS email_message_id VARCHAR(255) NULL AFTER status;

ALTER TABLE contact_replies
  ADD COLUMN IF NOT EXISTS email_message_id VARCHAR(255) NULL AFTER body;
