-- ─────────────────────────────────────────────
-- Projects table (dashboard-managed, shown on /projects)
-- Run with: mysql -u root -p < scripts/db/projects-migration.sql
-- ─────────────────────────────────────────────

USE portfolio_db;

CREATE TABLE IF NOT EXISTS projects (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  icon        VARCHAR(16) NOT NULL DEFAULT '📦',
  color       VARCHAR(9)  NOT NULL DEFAULT '#06b6d4',
  features    TEXT NULL,  -- one feature per line
  tech        TEXT NULL,  -- one tech per line
  demo_url      VARCHAR(500) NULL,  -- optional live demo link
  screenshot_url VARCHAR(500) NULL, -- optional screenshot (path under /uploads or full URL)
  video_url     VARCHAR(500) NULL,  -- optional video link (YouTube etc.)
  video_path    VARCHAR(255) NULL,  -- optional uploaded video (path under /uploads)
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_title (title),
  KEY idx_projects_sort (sort_order)
) ENGINE = InnoDB;

-- Seed the six projects currently shown on the site.
-- features/tech are newline-separated.
INSERT INTO projects (title, description, icon, color, features, tech, sort_order) VALUES
('Enterprise CRM Platform',
 'A full-featured customer relationship management system with lead tracking, pipeline management, analytics dashboards, role-based access control, and automated email campaigns. Built for scalability serving 10,000+ concurrent users.',
 '🤝', '#06b6d4',
 'Lead Management\nPipeline Analytics\nEmail Campaigns\nRole-based Access',
 'React.js\nNode.js\nNestJS\nPostgreSQL\nTypeORM\nDocker\nRedis', 1),
('E-Commerce Marketplace',
 'A scalable multi-vendor e-commerce platform with real-time inventory tracking, payment gateway integration, order management, and a recommendation engine. Handles 50,000+ daily transactions with sub-200ms response times.',
 '🛒', '#8b5cf6',
 'Multi-vendor Support\nPayment Integration\nInventory Management\nOrder Tracking',
 'Next.js\nLaravel\nPHP\nMySQL\nKafka\nRedis\nJenkins', 2),
('ERP Management Portal',
 'A comprehensive enterprise resource planning solution with modules for finance, HR, inventory, procurement, and reporting. Features real-time data synchronization across departments with automated workflow approvals.',
 '🏢', '#ec4899',
 'Finance Module\nHR Management\nInventory Control\nWorkflow Automation',
 'Vue.js\nNestJS\nMongoDB\nGraphQL\nDocker\nKubernetes\nGitLab CI', 3),
('Cloud Analytics Dashboard',
 'A real-time business intelligence platform with interactive data visualizations, custom report builders, and predictive analytics. Leverages microservices architecture with event-driven data processing pipelines.',
 '📊', '#f59e0b',
 'Real-time Analytics\nCustom Reports\nPredictive Modeling\nData Export',
 'React.js\nPython\nGraphQL\nAWS S3\nDocker\nRedis\nNestJS', 4),
('Mobile Healthcare App',
 'A cross-platform mobile application for patient management, appointment scheduling, telemedicine consultations, and electronic health records. Built with React Native for iOS and Android with offline-first capabilities.',
 '🏥', '#10b981',
 'Appointment Scheduling\nTelemedicine\nHealth Records\nPush Notifications',
 'React Native\nFirebase\nNode.js\nMongoDB\nTypeScript\nWebSockets', 5),
('Real-Time Notification System',
 'An event-driven notification infrastructure supporting email, SMS, push notifications, and in-app alerts. Processes 1M+ events daily with Kafka-based message queuing and configurable delivery rules.',
 '🔔', '#06b6d4',
 'Multi-channel Delivery\nTemplate Engine\nDelivery Analytics\nRetry Logic',
 'Node.js\nNestJS\nKafka\nRedis\nMongoDB\nDocker\nWebSockets', 6)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ─────────────────────────────────────────────
-- Optional: enforce unique titles on an EXISTING projects table.
-- This fails if duplicate titles already exist — dedupe first, e.g.:
--   UPDATE projects p JOIN projects q
--     ON p.title = q.title AND p.id > q.id
--   SET q.title = CONCAT(q.title, ' (', q.id, ')');
-- Then run:
-- ALTER TABLE projects ADD UNIQUE KEY uq_projects_title (title);
-- ─────────────────────────────────────────────
