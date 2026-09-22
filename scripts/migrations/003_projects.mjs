/**
 * 003 — projects collection.
 *
 * Mirrors the old MySQL `projects` table:
 *   id, title (unique), description, icon, color, features (newline-sep),
 *   tech (newline-sep), demo_url, screenshot_url, video_url, video_path,
 *   sort_order, created_at, updated_at.
 *
 * Seeds the six projects shown on the site.
 */
export async function up(db) {
  await db.createCollection("projects").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });

  await db
    .collection("projects")
    .createIndex({ title: 1 }, { unique: true, name: "uq_projects_title" });
  await db
    .collection("projects")
    .createIndex({ id: 1 }, { unique: true, name: "uq_projects_id" });
  await db
    .collection("projects")
    .createIndex({ sort_order: 1 }, { name: "idx_projects_sort" });

  const seeds = [
    ["Enterprise CRM Platform",
     "A full-featured customer relationship management system with lead tracking, pipeline management, analytics dashboards, role-based access control, and automated email campaigns. Built for scalability serving 10,000+ concurrent users.",
     "🤝", "#06b6d4",
     "Lead Management\nPipeline Analytics\nEmail Campaigns\nRole-based Access",
     "React.js\nNode.js\nNestJS\nPostgreSQL\nTypeORM\nDocker\nRedis", 1],
    ["E-Commerce Marketplace",
     "A scalable multi-vendor e-commerce platform with real-time inventory tracking, payment gateway integration, order management, and a recommendation engine. Handles 50,000+ daily transactions with sub-200ms response times.",
     "🛒", "#8b5cf6",
     "Multi-vendor Support\nPayment Integration\nInventory Management\nOrder Tracking",
     "Next.js\nLaravel\nPHP\nMySQL\nKafka\nRedis\nJenkins", 2],
    ["ERP Management Portal",
     "A comprehensive enterprise resource planning solution with modules for finance, HR, inventory, procurement, and reporting. Features real-time data synchronization across departments with automated workflow approvals.",
     "🏢", "#ec4899",
     "Finance Module\nHR Management\nInventory Control\nWorkflow Automation",
     "Vue.js\nNestJS\nMongoDB\nGraphQL\nDocker\nKubernetes\nGitLab CI", 3],
    ["Cloud Analytics Dashboard",
     "A real-time business intelligence platform with interactive data visualizations, custom report builders, and predictive analytics. Leverages microservices architecture with event-driven data processing pipelines.",
     "📊", "#f59e0b",
     "Real-time Analytics\nCustom Reports\nPredictive Modeling\nData Export",
     "React.js\nPython\nGraphQL\nAWS S3\nDocker\nRedis\nNestJS", 4],
    ["Mobile Healthcare App",
     "A cross-platform mobile application for patient management, appointment scheduling, telemedicine consultations, and electronic health records. Built with React Native for iOS and Android with offline-first capabilities.",
     "🏥", "#10b981",
     "Appointment Scheduling\nTelemedicine\nHealth Records\nPush Notifications",
     "React Native\nFirebase\nNode.js\nMongoDB\nTypeScript\nWebSockets", 5],
    ["Real-Time Notification System",
     "An event-driven notification infrastructure supporting email, SMS, push notifications, and in-app alerts. Processes 1M+ events daily with Kafka-based message queuing and configurable delivery rules.",
     "🔔", "#06b6d4",
     "Multi-channel Delivery\nTemplate Engine\nDelivery Analytics\nRetry Logic",
     "Node.js\nNestJS\nKafka\nRedis\nMongoDB\nDocker\nWebSockets", 6],
  ];

  let maxId = (await db.collection("projects").findOne({}, { sort: { id: -1 } }))?.id ?? 0;
  let seq = (await db.collection("counters").findOne({ key: "projects" }))?.seq ?? 0;
  const now = new Date();

  for (const [title, description, icon, color, features, tech, sort_order] of seeds) {
    const existing = await db.collection("projects").findOne({ title });
    if (existing) continue;
    const id = ++maxId;
    await db.collection("projects").insertOne({
      id,
      title,
      description,
      icon,
      color,
      features,
      tech,
      demo_url: null,
      screenshot_url: null,
      video_url: null,
      video_path: null,
      sort_order,
      created_at: now,
      updated_at: now,
    });
    seq = Math.max(seq, id);
  }

  if (seq > 0) {
    await db
      .collection("counters")
      .updateOne({ key: "projects" }, { $set: { key: "projects", seq } }, { upsert: true });
  }
}
