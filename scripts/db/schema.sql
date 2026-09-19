-- ─────────────────────────────────────────────
-- Portfolio Dashboard — MySQL schema
-- Run with: mysql -u root -p < scripts/db/schema.sql
-- ─────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS portfolio_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE portfolio_db;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB;

-- Seed admin user: admin@akhileshprajapati.com / admin123
-- (bcrypt hash of "admin123", cost 10 — change the password after first login)
INSERT INTO users (name, email, password_hash, role)
VALUES ('Akhilesh Prajapati', 'admin@akhileshprajapati.com', '$2b$10$MgQyoWf6BPpYbUJgV3ueoOXLo0wCuEtlD93n26c4lV0Rcqrlo.cXy', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name);
