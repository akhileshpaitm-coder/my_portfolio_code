/**
 * 005 — about content: about_paragraphs + core_values.
 *
 * Mirrors the old MySQL tables:
 *   about_paragraphs: id, body, emphasized (0/1), sort_order, timestamps
 *   core_values:      id, icon, title (unique), description, sort_order, timestamps
 *
 * Seeds the content from the original section.
 */
export async function up(db) {
  await db.createCollection("about_paragraphs").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.createCollection("core_values").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });

  await db
    .collection("about_paragraphs")
    .createIndex({ id: 1 }, { unique: true, name: "uq_about_paragraphs_id" });
  await db
    .collection("about_paragraphs")
    .createIndex({ sort_order: 1 }, { name: "idx_about_paragraphs_sort" });

  await db
    .collection("core_values")
    .createIndex({ title: 1 }, { unique: true, name: "uq_core_values_title" });
  await db
    .collection("core_values")
    .createIndex({ id: 1 }, { unique: true, name: "uq_core_values_id" });
  await db
    .collection("core_values")
    .createIndex({ sort_order: 1 }, { name: "idx_core_values_sort" });

  const now = new Date();

  // ── Paragraphs ──
  const paragraphSeeds = [
    ["Hello! I'm **Akhilesh Prajapati**, a passionate Full Stack Software Developer with over ==6 years of professional experience== in designing, developing, and deploying scalable, secure, and high-performance web and mobile applications.", 1, 1],
    ["Throughout my career, I have worked on a wide range of projects — from enterprise business applications and e-commerce platforms to CRM systems, ERP solutions, management portals, and cloud-based applications.", 0, 2],
    ["I specialize in both frontend and backend development, building complete end-to-end solutions. On the frontend, I create responsive, user-friendly interfaces using ==React.js, Next.js, Vue.js, React Native,== and modern CSS. On the backend, I design scalable APIs, microservices, authentication systems, and real-time applications with ==Node.js, NestJS, PHP, Laravel,== and more.", 0, 3],
    ["Beyond writing code, I'm passionate about ==DevOps, automation, CI/CD pipelines, containerization with Docker & Kubernetes,== and maintaining high code quality standards through testing and code reviews.", 0, 4],
    ["I believe in clean code, software design principles, and continuous learning. I enjoy mentoring team members, sharing knowledge, and contributing to collaborative development environments that deliver long-term value.", 0, 5],
  ];

  let pMaxId =
    (await db.collection("about_paragraphs").findOne({}, { sort: { id: -1 } }))?.id ?? 0;
  let pSeq = (await db.collection("counters").findOne({ key: "about_paragraphs" }))?.seq ?? 0;

  for (const [body, emphasized, sort_order] of paragraphSeeds) {
    const existing = await db.collection("about_paragraphs").findOne({ body });
    if (existing) continue;
    const id = ++pMaxId;
    await db.collection("about_paragraphs").insertOne({
      id,
      body,
      emphasized: emphasized === 1,
      sort_order,
      created_at: now,
      updated_at: now,
    });
    pSeq = Math.max(pSeq, id);
  }
  if (pSeq > 0) {
    await db
      .collection("counters")
      .updateOne(
        { key: "about_paragraphs" },
        { $set: { key: "about_paragraphs", seq: pSeq } },
        { upsert: true }
      );
  }

  // ── Core values ──
  const valueSeeds = [
    ["🎯", "Clean Code", "Maintainable, readable, and well-documented code", 1],
    ["🚀", "Performance", "Optimized applications for speed and scalability", 2],
    ["🔒", "Security", "Enterprise-grade security in every solution", 3],
    ["🤝", "Collaboration", "Agile teamwork and knowledge sharing", 4],
    ["📚", "Continuous Learning", "Always exploring emerging technologies", 5],
  ];

  let vMaxId =
    (await db.collection("core_values").findOne({}, { sort: { id: -1 } }))?.id ?? 0;
  let vSeq = (await db.collection("counters").findOne({ key: "core_values" }))?.seq ?? 0;

  for (const [icon, title, description, sort_order] of valueSeeds) {
    const existing = await db.collection("core_values").findOne({ title });
    if (existing) continue;
    const id = ++vMaxId;
    await db.collection("core_values").insertOne({
      id,
      icon,
      title,
      description,
      sort_order,
      created_at: now,
      updated_at: now,
    });
    vSeq = Math.max(vSeq, id);
  }
  if (vSeq > 0) {
    await db
      .collection("counters")
      .updateOne(
        { key: "core_values" },
        { $set: { key: "core_values", seq: vSeq } },
        { upsert: true }
      );
  }
}
