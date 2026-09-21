-- ─────────────────────────────────────────────
-- Threaded reply history for contact messages.
-- Each reply is stored as its own row so no reply is ever overwritten.
-- Existing single-reply data (reply_subject / reply_body / replied_at) is
-- copied into the new table. Safe to re-run.
-- Run with: mysql -u root -p < scripts/db/contact-replies-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

CREATE TABLE IF NOT EXISTS contact_replies (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  message_id INT UNSIGNED NOT NULL,
  subject    VARCHAR(200) NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_replies_message (message_id),
  CONSTRAINT fk_replies_message
    FOREIGN KEY (message_id) REFERENCES contact_messages (id)
    ON DELETE CASCADE
) ENGINE = InnoDB;

-- Copy any legacy single-reply history (skip messages already migrated,
-- so re-running this file never duplicates rows).
INSERT INTO contact_replies (message_id, subject, body, created_at)
SELECT id, reply_subject, reply_body, COALESCE(replied_at, created_at)
FROM contact_messages
WHERE reply_body IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_replies cr WHERE cr.message_id = contact_messages.id
  );
