import "server-only";
import type { Filter, Document } from "mongodb";
import { getNativeDb, getRepo, nextId } from "@/lib/db";
import { sanitizePostHtml, deriveExcerpt } from "@/lib/sanitize-post";
import type {
  BlogPostSummary,
  BlogPostFull,
  PostListOptions,
  PostListResult,
  PostStatus,
} from "@/lib/blog-types";

/* ─────────────────────────────────────────────
 * Stored document shapes
 * ───────────────────────────────────────────── */

interface PostStored extends Document {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  author_id: number;
  category_id: number | null;
  status: PostStatus;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface TagStored extends Document {
  id: number;
  name: string;
  slug: string;
}

interface CategoryStored extends Document {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

interface PostTagStored extends Document {
  post_id: number;
  tag_id: number;
}

interface CommentDoc extends Document {
  post_id: number;
}

interface ReactionDoc extends Document {
  post_id: number;
  reaction_type: "like" | "dislike";
}

const POST_PROJECTION = {
  projection: {
    _id: 0,
    id: 1,
    title: 1,
    slug: 1,
    excerpt: 1,
    content: 1,
    featured_image: 1,
    author_id: 1,
    category_id: 1,
    status: 1,
    published_at: 1,
    created_at: 1,
    updated_at: 1,
  },
};

/* ─────────────────────────────────────────────
 * Slugs
 * ───────────────────────────────────────────── */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Find a free slug by appending -2, -3, … when taken. */
export async function uniquePostSlug(
  desired: string,
  excludeId?: number
): Promise<string> {
  const base = slugify(desired) || "post";
  const db = await getNativeDb();
  const query: Filter<PostStored> =
    excludeId !== undefined ? { id: { $ne: excludeId } } : {};

  // Only look at slugs sharing the base (or base-N) prefix — cheap even for
  // many posts, and correct because we only ever append numeric suffixes.
  const existing = new Set(
    (
      await db
        .collection<PostStored>("posts")
        .find({ ...query, slug: new RegExp(`^${base}(-\\d+)?$`, "i") }, { projection: { _id: 0, slug: 1 } })
        .toArray()
    ).map((r) => r.slug.toLowerCase())
  );
  if (!existing.has(base.toLowerCase())) return base;

  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!existing.has(candidate.toLowerCase())) return candidate;
  }
}

/* ─────────────────────────────────────────────
 * Counts + enrichment helpers
 * ───────────────────────────────────────────── */

/** per-post aggregation counts for a set of post ids. */
async function getCountMaps(
  query: Filter<PostStored>
): Promise<{
  likes: Map<number, number>;
  dislikes: Map<number, number>;
  comments: Map<number, number>;
}> {
  const db = await getNativeDb();

  const ids = (
    await db.collection<PostStored>("posts").find(query, { projection: { _id: 0, id: 1 } }).toArray()
  ).map((r) => r.id);

  const likes = new Map<number, number>();
  const dislikes = new Map<number, number>();
  const comments = new Map<number, number>();
  if (ids.length === 0) return { likes, dislikes, comments };

  const [reactionRows, commentRows] = await Promise.all([
    db
      .collection<ReactionDoc>("post_reactions")
      .aggregate<{ _id: { post_id: number; reaction_type: string }; n: number }>([
        { $match: { post_id: { $in: ids } } },
        { $group: { _id: { post_id: "$post_id", reaction_type: "$reaction_type" }, n: { $sum: 1 } } },
      ])
      .toArray(),
    db
      .collection<CommentDoc>("comments")
      .aggregate<{ _id: number; n: number }>([
        { $match: { post_id: { $in: ids } } },
        { $group: { _id: "$post_id", n: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  for (const row of reactionRows) {
    const map = row._id.reaction_type === "like" ? likes : dislikes;
    map.set(row._id.post_id, Number(row.n));
  }
  for (const row of commentRows) {
    comments.set(row._id, Number(row.n));
  }
  return { likes, dislikes, comments };
}

/** name maps for authors / categories / tags (batched, never throws). */
async function getReferenceMaps(
  authorIds: number[],
  categoryIds: number[],
  tagIds: number[]
): Promise<{
  authors: Map<number, string>;
  categories: Map<number, string>;
  tags: Map<number, { id: number; name: string; slug: string }>;
}> {
  const db = await getNativeDb();
  const [authorRows, categoryRows, tagRows] = await Promise.all([
    authorIds.length
      ? db
          .collection("users")
          .find({ id: { $in: authorIds } }, { projection: { _id: 0, id: 1, name: 1 } })
          .toArray()
      : Promise.resolve([] as Document[]),
    categoryIds.length
      ? db
          .collection<CategoryStored>("categories")
          .find({ id: { $in: categoryIds } }, { projection: { _id: 0, id: 1, name: 1 } })
          .toArray()
      : Promise.resolve([] as Document[]),
    tagIds.length
      ? db
          .collection<TagStored>("tags")
          .find({ id: { $in: tagIds } }, { projection: { _id: 0, id: 1, name: 1, slug: 1 } })
          .toArray()
      : Promise.resolve([] as Document[]),
  ]);

  return {
    authors: new Map(authorRows.map((r) => [Number(r.id), String(r.name)])),
    categories: new Map(categoryRows.map((r) => [Number(r.id), String(r.name)])),
    tags: new Map(tagRows.map((r) => [Number(r.id), { id: Number(r.id), name: String(r.name), slug: String(r.slug) }])),
  };
}

/** The summary list avoids pulling full content (explicit inclusion — Mongo
 * projections cannot mix inclusion and exclusion in one spec). */
const SUMMARY_PROJECTION = {
  projection: {
    _id: 0,
    id: 1,
    title: 1,
    slug: 1,
    excerpt: 1,
    featured_image: 1,
    author_id: 1,
    category_id: 1,
    status: 1,
    published_at: 1,
    created_at: 1,
    updated_at: 1,
  },
};

async function buildSummaries(rows: PostStored[]): Promise<BlogPostSummary[]> {
  if (rows.length === 0) return [];

  const postIds = rows.map((r) => r.id);

  const tagLinks = await db_postTags(postIds);
  const [counts, refs] = await Promise.all([
    getCountMaps({ id: { $in: postIds } }),
    getReferenceMaps(
      [...new Set(rows.map((r) => r.author_id))],
      [...new Set(rows.map((r) => r.category_id).filter((v): v is number => v != null))],
      [...new Set(tagLinks.map((t: PostTagStored) => t.tag_id))]
    ),
  ]);

  const tagsByPost = new Map<number, Array<{ id: number; name: string; slug: string }>>();
  for (const link of tagLinks) {
    const tag = refs.tags.get(link.tag_id);
    if (!tag) continue; // tag deleted — skip
    const list = tagsByPost.get(link.post_id) ?? [];
    list.push(tag);
    tagsByPost.set(link.post_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    featured_image: row.featured_image ?? null,
    author_id: row.author_id,
    author_name: refs.authors.get(row.author_id) ?? "Unknown",
    category_id: row.category_id ?? null,
    category_name: row.category_id != null ? refs.categories.get(row.category_id) ?? null : null,
    category_slug: null, // filled by the caller when a category list is available
    tags: tagsByPost.get(row.id) ?? [],
    status: row.status,
    published_at: row.published_at ? new Date(row.published_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    like_count: counts.likes.get(row.id) ?? 0,
    dislike_count: counts.dislikes.get(row.id) ?? 0,
    comment_count: counts.comments.get(row.id) ?? 0,
  }));
}

async function db_postTags(postIds: number[]): Promise<PostTagStored[]> {
  if (postIds.length === 0) return [];
  const db = await getNativeDb();
  return db
    .collection<PostTagStored>("post_tags")
    .find({ post_id: { $in: postIds } }, { projection: { _id: 0, post_id: 1, tag_id: 1 } })
    .toArray();
}

/* ─────────────────────────────────────────────
 * Listing
 * ───────────────────────────────────────────── */

/** Published, newest-first (public blog). */
export async function getPosts(options: PostListOptions = {}): Promise<PostListResult> {
  const db = await getNativeDb();
  const status: PostStatus | "all" = options.status ?? "published";
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(options.pageSize ?? 9)));

  const query: Filter<PostStored> = {};
  if (status !== "all") query.status = status;
  if (options.categoryId != null) query.category_id = options.categoryId;
  if (options.search?.trim()) {
    const rx = new RegExp(options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: rx }, { excerpt: rx }, { content: rx }];
  }

  // Tag filter narrows via post_tags.
  let idFilter: number[] | null = null;
  if (options.tagSlug) {
    const tag = await db.collection<TagStored>("tags").findOne({ slug: options.tagSlug }, { projection: { _id: 0, id: 1 } });
    if (!tag) {
      return { posts: [], total: 0, page, pageSize, totalPages: 1 };
    }
    const links = await db
      .collection<PostTagStored>("post_tags")
      .find({ tag_id: tag.id }, { projection: { _id: 0, post_id: 1 } })
      .toArray();
    idFilter = links.map((l) => l.post_id);
    query.id = { $in: idFilter };
  }

  const total = await db.collection<PostStored>("posts").countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(totalPages, page);

  const rows = await db
    .collection<PostStored>("posts")
    .find(query, SUMMARY_PROJECTION)
    .sort({ published_at: -1, id: -1 })
    .skip((clampedPage - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return {
    posts: await buildSummaries(rows),
    total,
    page: clampedPage,
    pageSize,
    totalPages,
  };
}

/** Full post by slug. Drafts only resolve when explicitly allowed. */
export async function getPostBySlug(slug: string, opts?: { allowDrafts?: boolean }): Promise<BlogPostFull | null> {
  const db = await getNativeDb();
  const query: Filter<PostStored> = { slug };
  if (!opts?.allowDrafts) query.status = "published";
  const row = await db.collection<PostStored>("posts").findOne(query, POST_PROJECTION);
  if (!row) return null;
  const summary = (await buildSummaries([row]))[0];
  return summary ? { ...summary, content: row.content } : null;
}

export async function getPostById(id: number): Promise<BlogPostFull | null> {
  const db = await getNativeDb();
  const row = await db.collection<PostStored>("posts").findOne({ id }, POST_PROJECTION);
  if (!row) return null;
  const summary = (await buildSummaries([row]))[0];
  return summary ? { ...summary, content: row.content } : null;
}

/** Related posts: same category first, then latest others (max n). */
export async function getRelatedPosts(post: BlogPostSummary, limit = 3): Promise<BlogPostSummary[]> {
  const db = await getNativeDb();
  const query: Filter<PostStored> = { status: "published", id: { $ne: post.id } };
  if (post.category_id != null) query.category_id = post.category_id;
  let rows = await db
    .collection<PostStored>("posts")
    .find(query, SUMMARY_PROJECTION)
    .sort({ published_at: -1 })
    .limit(limit)
    .toArray();

  if (rows.length < limit) {
    const exclude = new Set(rows.map((r) => r.id));
    const fill = await db
      .collection<PostStored>("posts")
      .find(
        { status: "published", id: { $nin: [...exclude, post.id] } },
        SUMMARY_PROJECTION
      )
      .sort({ published_at: -1 })
      .limit(limit - rows.length)
      .toArray();
    rows = [...rows, ...fill];
  }
  return buildSummaries(rows);
}

/* ─────────────────────────────────────────────
 * Mutations (admin)
 * ───────────────────────────────────────────── */

export interface PostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  /** Raw editor HTML — sanitized here before persisting. */
  content: string;
  featured_image: string | null;
  category_id: number | null;
  tagIds: number[];
  status: PostStatus;
}

export async function createPost(input: PostInput, authorId: number): Promise<number> {
  const repo = await getRepo("posts");
  const db = await getNativeDb();
  const id = await nextId("posts");
  const slug = await uniquePostSlug(input.slug?.trim() || input.title);
  const now = new Date();
  const content = sanitizePostHtml(input.content);
  const published = input.status === "published" ? now : null;

  await repo.insertOne({
    id,
    title: input.title,
    slug,
    excerpt: input.excerpt?.trim() || deriveExcerpt(content),
    content,
    featured_image: input.featured_image,
    author_id: authorId,
    category_id: input.category_id,
    status: input.status,
    published_at: published,
    created_at: now,
    updated_at: now,
  });

  if (input.tagIds.length) {
    await replacePostTags(id, input.tagIds, db);
  }
  return id;
}

export async function updatePost(id: number, input: PostInput): Promise<boolean> {
  const repo = await getRepo("posts");
  const db = await getNativeDb();

  const existing = await db.collection<PostStored>("posts").findOne({ id }, { projection: { _id: 1, status: 1, published_at: 1 } });
  if (!existing) return false;

  const slug = await uniquePostSlug(input.slug?.trim() || input.title, id);
  const content = sanitizePostHtml(input.content);
  const wasPublished = existing.status === "published";
  const nowPublished = input.status === "published";

  const result = await repo.updateMany(
    { id },
    {
      $set: {
        title: input.title,
        slug,
        excerpt: input.excerpt?.trim() || deriveExcerpt(content),
        content,
        featured_image: input.featured_image,
        category_id: input.category_id,
        status: input.status,
        // First publish stamps published_at; re-publishing a draft keeps it.
        published_at: !wasPublished && nowPublished ? new Date() : existing.published_at ?? null,
        updated_at: new Date(),
      },
    }
  );

  if ((result.modifiedCount ?? 0) > 0) {
    await replacePostTags(id, input.tagIds, db);
  }
  return (result.modifiedCount ?? 0) > 0;
}

/** Sync the post_tags join to exactly tagIds (validated by the caller). */
export async function replacePostTags(
  postId: number,
  tagIds: number[],
  db?: Awaited<ReturnType<typeof getNativeDb>>
): Promise<void> {
  const native = db ?? (await getNativeDb());
  await native.collection("post_tags").deleteMany({ post_id: postId });
  if (tagIds.length === 0) return;
  await native
    .collection("post_tags")
    .insertMany(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
}

export async function setPostStatus(id: number, status: PostStatus): Promise<boolean> {
  const repo = await getRepo("posts");
  const $set: Record<string, unknown> = { status, updated_at: new Date() };
  if (status === "published") {
    // Stamp published_at only on first publish.
    const db = await getNativeDb();
    const row = await db.collection<PostStored>("posts").findOne({ id }, { projection: { _id: 0, published_at: 1 } });
    if (row && !row.published_at) $set.published_at = new Date();
  }
  const result = await repo.updateMany({ id }, { $set });
  return (result.modifiedCount ?? 0) > 0;
}

export async function deletePost(id: number): Promise<boolean> {
  const db = await getNativeDb();
  // Cascade: tags, comments, reactions die with the post.
  await db.collection("post_tags").deleteMany({ post_id: id });
  await db.collection("comments").deleteMany({ post_id: id });
  await db.collection("post_reactions").deleteMany({ post_id: id });
  const repo = await getRepo("posts");
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}

/** True when a different post already uses this exact slug. */
export async function slugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const db = await getNativeDb();
  const query: Filter<PostStored> = { slug: slug.toLowerCase() };
  if (excludeId !== undefined) query.id = { $ne: excludeId };
  return (await db.collection<PostStored>("posts").countDocuments(query)) > 0;
}

/* ─────────────────────────────────────────────
 * Stats / sitemap
 * ───────────────────────────────────────────── */

export async function getBlogStats(): Promise<{
  published: number;
  drafts: number;
  comments: number;
  reactions: number;
}> {
  const db = await getNativeDb();
  const [published, drafts, comments, reactions] = await Promise.all([
    db.collection("posts").countDocuments({ status: "published" }),
    db.collection("posts").countDocuments({ status: "draft" }),
    db.collection("comments").countDocuments({}),
    db.collection("post_reactions").countDocuments({}),
  ]);
  return { published, drafts, comments, reactions };
}

/** All published post slugs + timestamps (sitemap). */
export async function getPublishedSlugsWithDates(): Promise<Array<{ slug: string; updated_at: Date }>> {
  const db = await getNativeDb();
  const rows = await db
    .collection<PostStored>("posts")
    .find({ status: "published" }, { projection: { _id: 0, slug: 1, updated_at: 1 } })
    .toArray();
  return rows.map((r) => ({ slug: r.slug, updated_at: new Date(r.updated_at) }));
}
