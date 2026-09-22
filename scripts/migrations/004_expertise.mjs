/**
 * 004 — expertise collection.
 *
 * Mirrors the old MySQL `expertise` table:
 *   id, title (unique), sort_order, created_at, updated_at.
 *
 * Seeds the items from the original section, preserving display order.
 */
export async function up(db) {
  await db.createCollection("expertise").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });

  await db
    .collection("expertise")
    .createIndex({ title: 1 }, { unique: true, name: "uq_expertise_title" });
  await db
    .collection("expertise")
    .createIndex({ id: 1 }, { unique: true, name: "uq_expertise_id" });
  await db
    .collection("expertise")
    .createIndex({ sort_order: 1 }, { name: "idx_expertise_sort" });

  const seeds = [
    ["Full Stack Web Application Development", 1],
    ["RESTful API & GraphQL Development", 2],
    ["Microservices Architecture", 3],
    ["Enterprise Application Development", 4],
    ["Responsive Web Design", 5],
    ["Mobile Application Development", 6],
    ["Authentication & Authorization", 7],
    ["Database Design & Query Optimization", 8],
    ["CI/CD Pipeline Implementation", 9],
    ["Docker & Kubernetes Deployment", 10],
    ["Cloud Storage Integration (Amazon S3)", 11],
    ["Third-Party API Integration", 12],
    ["Performance Optimization", 13],
    ["Code Quality & Testing", 14],
    ["Agile & Scrum Development", 15],
  ];

  let maxId = (await db.collection("expertise").findOne({}, { sort: { id: -1 } }))?.id ?? 0;
  let seq = (await db.collection("counters").findOne({ key: "expertise" }))?.seq ?? 0;
  const now = new Date();

  for (const [title, sort_order] of seeds) {
    const existing = await db.collection("expertise").findOne({ title });
    if (existing) continue;
    const id = ++maxId;
    await db.collection("expertise").insertOne({
      id,
      title,
      sort_order,
      created_at: now,
      updated_at: now,
    });
    seq = Math.max(seq, id);
  }

  if (seq > 0) {
    await db
      .collection("counters")
      .updateOne({ key: "expertise" }, { $set: { key: "expertise", seq } }, { upsert: true });
  }
}
