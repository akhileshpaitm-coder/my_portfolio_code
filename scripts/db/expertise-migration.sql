-- ─────────────────────────────────────────────
-- Expertise list (dashboard-managed, shown on the homepage section)
-- Run with: mysql -u root -p < scripts/db/expertise-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

CREATE TABLE IF NOT EXISTS expertise (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title      VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_expertise_title (title),
  KEY idx_expertise_sort (sort_order)
) ENGINE = InnoDB;

-- Seed the items currently hardcoded in the section, preserving their
-- display order. ON DUPLICATE keeps re-runs idempotent.
INSERT INTO expertise (title, sort_order) VALUES
  ('Full Stack Web Application Development', 1),
  ('RESTful API & GraphQL Development', 2),
  ('Microservices Architecture', 3),
  ('Enterprise Application Development', 4),
  ('Responsive Web Design', 5),
  ('Mobile Application Development', 6),
  ('Authentication & Authorization', 7),
  ('Database Design & Query Optimization', 8),
  ('CI/CD Pipeline Implementation', 9),
  ('Docker & Kubernetes Deployment', 10),
  ('Cloud Storage Integration (Amazon S3)', 11),
  ('Third-Party API Integration', 12),
  ('Performance Optimization', 13),
  ('Code Quality & Testing', 14),
  ('Agile & Scrum Development', 15)
ON DUPLICATE KEY UPDATE title = VALUES(title);
