/**
 * 001 — users collection + auto-increment counters.
 *
 * Mirrors the old MySQL `users` table:
 *   id INT PK AUTO_INCREMENT, name, email (unique), password_hash,
 *   role('admin'|'user' default 'user'), created_at, updated_at.
 *
 * Seeds the admin account (bcrypt hash of "admin123" — change after login).
 */
export async function up(db) {
  await db.createCollection("users").catch((e) => {
    // NamespaceExists is fine — collection already present.
    if (e.codeName !== "NamespaceExists") throw e;
  });

  await db
    .collection("users")
    .createIndex({ email: 1 }, { unique: true, name: "uq_users_email" });
  await db
    .collection("users")
    .createIndex({ id: 1 }, { unique: true, name: "uq_users_id" });

  // Counters back the numeric auto-increment ids (see src/lib/db.ts nextId()).
  await db
    .collection("counters")
    .createIndex({ key: 1 }, { unique: true, name: "uq_counters_key" });

  // Seed admin user: admin@akhileshprajapati.com / admin123
  const admin = await db.collection("users").findOne({
    email: "admin@akhileshprajapati.com",
  });
  if (!admin) {
    // bcrypt hash of "admin123", cost 10 — change the password after first login.
    const hash = "$2b$10$MgQyoWf6BPpYbUJgV3ueoOXLo0wCuEtlD93n26c4lV0Rcqrlo.cXy";
    await db.collection("users").insertOne({
      id: 1,
      name: "Akhilesh Prajapati",
      email: "admin@akhileshprajapati.com",
      password_hash: hash,
      role: "admin",
      created_at: new Date(),
      updated_at: new Date(),
    });
    await db
      .collection("counters")
      .updateOne({ key: "users" }, { $set: { key: "users", seq: 1 } }, { upsert: true });
  }
}
