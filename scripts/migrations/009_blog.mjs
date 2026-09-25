/**
 * 009 — Blog system collections.
 *
 * Mirrors the suggested relational schema, Mongo-style:
 * - posts (id, title, slug unique, excerpt, content HTML, featured_image,
 *   author_id -> users.id, category_id -> categories.id, status
 *   draft|published, published_at, created_at, updated_at)
 * - categories (id, name unique, slug unique, created_at, updated_at)
 * - tags (id, name unique, slug unique, created_at, updated_at)
 * - post_tags (post_id, tag_id) — unique per pair
 * - comments (id, post_id, user_id, parent_id nullable, content,
 *   created_at, updated_at)
 * - post_reactions (id, post_id, user_id, reaction_type like|dislike,
 *   created_at) — unique per (post_id, user_id)
 *
 * Ids reuse the shared numeric auto-increment (counters collection), exactly
 * like users/projects/skills. No new users table — author_id/user_id
 * reference the existing users collection.
 */
export async function up(db) {
  // ── categories ────────────────────────────────
  await db.createCollection("categories").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.collection("categories").createIndex({ id: 1 }, { unique: true, name: "uq_categories_id" });
  await db.collection("categories").createIndex({ name: 1 }, { unique: true, name: "uq_categories_name" });
  await db.collection("categories").createIndex({ slug: 1 }, { unique: true, name: "uq_categories_slug" });

  // ── tags ──────────────────────────────────────
  await db.createCollection("tags").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.collection("tags").createIndex({ id: 1 }, { unique: true, name: "uq_tags_id" });
  await db.collection("tags").createIndex({ name: 1 }, { unique: true, name: "uq_tags_name" });
  await db.collection("tags").createIndex({ slug: 1 }, { unique: true, name: "uq_tags_slug" });

  // ── posts ─────────────────────────────────────
  await db.createCollection("posts").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.collection("posts").createIndex({ id: 1 }, { unique: true, name: "uq_posts_id" });
  await db.collection("posts").createIndex({ slug: 1 }, { unique: true, name: "uq_posts_slug" });
  await db.collection("posts").createIndex({ status: 1, published_at: -1 }, { name: "idx_posts_status_published" });
  await db.collection("posts").createIndex({ category_id: 1 }, { name: "idx_posts_category" });
  await db.collection("posts").createIndex({ author_id: 1 }, { name: "idx_posts_author" });

  // ── post_tags ─────────────────────────────────
  await db.createCollection("post_tags").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.collection("post_tags").createIndex({ post_id: 1, tag_id: 1 }, { unique: true, name: "uq_post_tags_pair" });
  await db.collection("post_tags").createIndex({ tag_id: 1 }, { name: "idx_post_tags_tag" });

  // ── comments ──────────────────────────────────
  await db.createCollection("comments").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.collection("comments").createIndex({ id: 1 }, { unique: true, name: "uq_comments_id" });
  await db.collection("comments").createIndex({ post_id: 1, created_at: 1 }, { name: "idx_comments_post_created" });
  await db.collection("comments").createIndex({ user_id: 1 }, { name: "idx_comments_user" });

  // ── post_reactions ────────────────────────────
  await db.createCollection("post_reactions").catch((e) => {
    if (e.codeName !== "NamespaceExists") throw e;
  });
  await db.collection("post_reactions").createIndex({ post_id: 1, user_id: 1 }, { unique: true, name: "uq_post_reactions_pair" });
  await db.collection("post_reactions").createIndex({ post_id: 1, reaction_type: 1 }, { name: "idx_post_reactions_type" });
  await db.collection("post_reactions").createIndex({ id: 1 }, { unique: true, name: "uq_post_reactions_id" });

  // ── Counters seed — start blog ids past the highest existing id ──
  for (const key of ["posts", "categories", "tags", "comments", "post_reactions"]) {
    const maxDoc = await db.collection(key).findOne({}, { sort: { id: -1 }, projection: { id: 1 } });
    const maxId = Number(maxDoc?.id) || 0;
    const counter = await db.collection("counters").findOne({ key });
    const seq = Number(counter?.seq) || 0;
    if (maxId > seq) {
      await db.collection("counters").updateOne({ key }, { $set: { key, seq: maxId } }, { upsert: true });
    }
  }
}
