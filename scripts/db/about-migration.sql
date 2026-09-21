-- ─────────────────────────────────────────────
-- About section content (dashboard-managed, shown on the homepage section)
-- about_paragraphs: bio paragraphs (HTML-lite markup, see lib/about.ts)
-- core_values: the "Core Values" highlight card items
-- Safe to re-run.
-- Run with: mysql -u root -p < scripts/db/about-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

CREATE TABLE IF NOT EXISTS about_paragraphs (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  body       TEXT NOT NULL,
  emphasized TINYINT(1) NOT NULL DEFAULT 0, -- 1 = intro style (larger, brighter)
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_about_paragraphs_sort (sort_order)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS core_values (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  icon       VARCHAR(8) NOT NULL DEFAULT '✨',
  title      VARCHAR(60) NOT NULL,
  description VARCHAR(160) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_core_values_title (title),
  KEY idx_core_values_sort (sort_order)
) ENGINE = InnoDB;

-- Seed the content currently hardcoded in the section (idempotent).
INSERT INTO about_paragraphs (body, emphasized, sort_order) VALUES
  ('Hello! I''m **Akhilesh Prajapati**, a passionate Full Stack Software Developer with over ==6 years of professional experience== in designing, developing, and deploying scalable, secure, and high-performance web and mobile applications.', 1, 1),
  ('Throughout my career, I have worked on a wide range of projects — from enterprise business applications and e-commerce platforms to CRM systems, ERP solutions, management portals, and cloud-based applications.', 0, 2),
  ('I specialize in both frontend and backend development, building complete end-to-end solutions. On the frontend, I create responsive, user-friendly interfaces using ==React.js, Next.js, Vue.js, React Native,== and modern CSS. On the backend, I design scalable APIs, microservices, authentication systems, and real-time applications with ==Node.js, NestJS, PHP, Laravel,== and more.', 0, 3),
  ('Beyond writing code, I''m passionate about ==DevOps, automation, CI/CD pipelines, containerization with Docker & Kubernetes,== and maintaining high code quality standards through testing and code reviews.', 0, 4),
  ('I believe in clean code, software design principles, and continuous learning. I enjoy mentoring team members, sharing knowledge, and contributing to collaborative development environments that deliver long-term value.', 0, 5)
ON DUPLICATE KEY UPDATE body = VALUES(body);

INSERT INTO core_values (icon, title, description, sort_order) VALUES
  ('🎯', 'Clean Code', 'Maintainable, readable, and well-documented code', 1),
  ('🚀', 'Performance', 'Optimized applications for speed and scalability', 2),
  ('🔒', 'Security', 'Enterprise-grade security in every solution', 3),
  ('🤝', 'Collaboration', 'Agile teamwork and knowledge sharing', 4),
  ('📚', 'Continuous Learning', 'Always exploring emerging technologies', 5)
ON DUPLICATE KEY UPDATE icon = VALUES(icon), description = VALUES(description), sort_order = VALUES(sort_order);
