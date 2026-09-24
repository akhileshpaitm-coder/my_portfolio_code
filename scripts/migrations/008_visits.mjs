/**
 * 008 — visitor tracking: visit_stats + visit_days + visit_visitors.
 *
 * Lightweight, cookie-free visitor counting:
 * - visit_stats:    single-document running totals (total + last day rollover)
 * - visit_days:     one document per local calendar day (views + uniques)
 * - visit_visitors: hashed visitor id per day, for unique-visitor dedupe
 *                   (TTL index deletes each day's rows once the day passes)
 */
export async function up(db) {
  await db.createCollection("visit_stats").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.createCollection("visit_days").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.createCollection("visit_visitors").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.createCollection("visit_pages").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });

  await db
    .collection("visit_stats")
    .createIndex({ key: 1 }, { unique: true, name: "uq_visit_stats_key" });

  await db
    .collection("visit_days")
    .createIndex({ day: 1 }, { unique: true, name: "uq_visit_days_day" });

  await db
    .collection("visit_pages")
    .createIndex(
      { day: 1, path: 1 },
      { unique: true, name: "uq_visit_pages_day_path" }
    );

  await db
    .collection("visit_visitors")
    .createIndex(
      { day: 1, vid: 1 },
      { unique: true, name: "uq_visit_visitors_day_vid" }
    );
  // TTL cleanup: expire each day's visitor rows 48h after that day ends.
  // TTL indexes only work on Date fields, so we index expires_at.
  await db
    .collection("visit_visitors")
    .createIndex(
      { expires_at: 1 },
      { name: "ttl_visit_visitors_expires", expireAfterSeconds: 0 }
    );
}
