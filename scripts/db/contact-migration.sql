-- ─────────────────────────────────────────────
-- Contact messages (dashboard-managed history for /contact submissions)
-- Run with: mysql -u root -p < scripts/db/contact-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

CREATE TABLE IF NOT EXISTS contact_messages (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(120) NOT NULL,
  email        VARCHAR(190) NOT NULL,
  subject      VARCHAR(200) NOT NULL,
  message      TEXT NOT NULL,
  status       ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  reply_subject VARCHAR(200) NULL,  -- subject of the admin's reply email
  reply_body   TEXT NULL,           -- body of the admin's reply email
  replied_at   TIMESTAMP NULL DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_status (status),
  KEY idx_messages_created (created_at)
) ENGINE = InnoDB;
