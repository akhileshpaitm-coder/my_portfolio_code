/**
 * 002 — skills collection.
 *
 * Mirrors the old MySQL `skills` table:
 *   id, category, name (unique per category), sort_order, created_at, updated_at.
 *
 * Seeds the skills shown on the site. sort_order follows the original scheme:
 * category index * 100 + position, so cards keep the original visual order.
 */
export async function up(db) {
  await db.createCollection("skills").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });

  await db
    .collection("skills")
    .createIndex(
      { category: 1, name: 1 },
      { unique: true, name: "uq_skills_category_name" }
    );
  await db
    .collection("skills")
    .createIndex({ id: 1 }, { unique: true, name: "uq_skills_id" });
  await db
    .collection("skills")
    .createIndex({ sort_order: 1 }, { name: "idx_skills_sort" });

  const seeds = [
    ["Backend", "Node.js", 101], ["Backend", "NestJS", 102], ["Backend", "PHP", 103],
    ["Backend", "Laravel", 104], ["Backend", "Python", 105], ["Backend", "GraphQL", 106],
    ["Backend", "Kafka", 107], ["Backend", "TypeORM", 108], ["Backend", "Prisma", 109],

    ["Frontend", "React.js", 201], ["Frontend", "Next.js", 202], ["Frontend", "Vue.js", 203],
    ["Frontend", "React Native", 204], ["Frontend", "JavaScript (ES6+)", 205],
    ["Frontend", "TypeScript", 206], ["Frontend", "jQuery", 207], ["Frontend", "HTML5", 208],
    ["Frontend", "CSS3", 209], ["Frontend", "Tailwind CSS", 210],

    ["Databases", "MySQL", 301], ["Databases", "MongoDB", 302],
    ["Databases", "PostgreSQL", 303], ["Databases", "Firebase", 304],

    ["DevOps & Cloud", "Docker", 401], ["DevOps & Cloud", "Kubernetes", 402],
    ["DevOps & Cloud", "Jenkins", 403], ["DevOps & Cloud", "SonarQube", 404],
    ["DevOps & Cloud", "Git", 405], ["DevOps & Cloud", "GitLab", 406],
    ["DevOps & Cloud", "Amazon S3", 407],

    ["Tools & Collaboration", "Slack", 501], ["Tools & Collaboration", "REST APIs", 502],
    ["Tools & Collaboration", "Third-party API Integrations", 503],
    ["Tools & Collaboration", "CI/CD Pipelines", 504],
    ["Tools & Collaboration", "Agile Development", 505],
  ];

  let maxId = (await db.collection("skills").findOne({}, { sort: { id: -1 } }))?.id ?? 0;
  let seq = (await db.collection("counters").findOne({ key: "skills" }))?.seq ?? 0;
  const now = new Date();

  for (const [category, name, sort_order] of seeds) {
    const existing = await db.collection("skills").findOne({ category, name });
    if (existing) continue;
    const id = ++maxId;
    await db.collection("skills").insertOne({
      id,
      category,
      name,
      sort_order,
      created_at: now,
      updated_at: now,
    });
    seq = Math.max(seq, id);
  }

  if (seq > 0) {
    await db
      .collection("counters")
      .updateOne({ key: "skills" }, { $set: { key: "skills", seq } }, { upsert: true });
  }
}
