-- ─────────────────────────────────────────────
-- Skills table (dashboard-managed, shown on /skills and the homepage section)
-- Run with: mysql -u root -p < scripts/db/skills-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

CREATE TABLE IF NOT EXISTS skills (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category   VARCHAR(60) NOT NULL,   -- e.g. Backend, Frontend, DevOps & Cloud
  name       VARCHAR(60) NOT NULL,   -- e.g. Node.js
  sort_order INT NOT NULL DEFAULT 0, -- cards order by min(sort_order) per category
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_category_name (category, name),
  KEY idx_skills_sort (sort_order)
) ENGINE = InnoDB;

-- Seed the skills currently shown on the site.
-- sort_order: category index * 100 + position, so cards keep the
-- original visual order (Backend → Frontend → Databases → DevOps → Tools).
INSERT INTO skills (category, name, sort_order) VALUES
  ('Backend', 'Node.js', 101), ('Backend', 'NestJS', 102), ('Backend', 'PHP', 103),
  ('Backend', 'Laravel', 104), ('Backend', 'Python', 105), ('Backend', 'GraphQL', 106),
  ('Backend', 'Kafka', 107), ('Backend', 'TypeORM', 108), ('Backend', 'Prisma', 109),

  ('Frontend', 'React.js', 201), ('Frontend', 'Next.js', 202), ('Frontend', 'Vue.js', 203),
  ('Frontend', 'React Native', 204), ('Frontend', 'JavaScript (ES6+)', 205),
  ('Frontend', 'TypeScript', 206), ('Frontend', 'jQuery', 207), ('Frontend', 'HTML5', 208),
  ('Frontend', 'CSS3', 209), ('Frontend', 'Tailwind CSS', 210),

  ('Databases', 'MySQL', 301), ('Databases', 'MongoDB', 302),
  ('Databases', 'PostgreSQL', 303), ('Databases', 'Firebase', 304),

  ('DevOps & Cloud', 'Docker', 401), ('DevOps & Cloud', 'Kubernetes', 402),
  ('DevOps & Cloud', 'Jenkins', 403), ('DevOps & Cloud', 'SonarQube', 404),
  ('DevOps & Cloud', 'Git', 405), ('DevOps & Cloud', 'GitLab', 406),
  ('DevOps & Cloud', 'Amazon S3', 407),

  ('Tools & Collaboration', 'Slack', 501), ('Tools & Collaboration', 'REST APIs', 502),
  ('Tools & Collaboration', 'Third-party API Integrations', 503),
  ('Tools & Collaboration', 'CI/CD Pipelines', 504),
  ('Tools & Collaboration', 'Agile Development', 505)
ON DUPLICATE KEY UPDATE name = VALUES(name);
