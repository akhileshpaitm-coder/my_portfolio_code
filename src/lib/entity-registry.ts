import "server-only";
import { DataSource } from "typeorm";
import {
  User,
  Counter,
  Skill,
  Project,
  Expertise,
  AboutParagraph,
  CoreValue,
  SiteSetting,
  ContactMessage,
  ContactReply,
  BlogPost,
  BlogCategory,
  BlogTag,
  PostTag,
  Comment,
  PostReaction,
} from "./entities";
import { getNativeDb } from "./db";

/**
 * Entity registry — the ONE place that maps stable collection names to
 * entity classes.
 *
 * Why this exists: TypeORM resolves entity metadata by class reference and
 * falls back to matching the class function `.name`. Under Turbopack, server
 * actions and server components can each get their own copy of the entity
 * module, and a minified/renamed class copy arrives at
 * `getMongoRepository()` with an empty `.name` — producing
 * `EntityMetadataNotFoundError: No metadata for "" was found.`
 *
 * All data-access code calls `getEntity("projects")` etc. instead of
 * importing entity classes directly, so the class objects always come from
 * this single server-only module (which also survives dev hot reloads via
 * the same global-singleton trick as the DataSource).
 */

export type EntityCollectionName =
  | "users"
  | "counters"
  | "skills"
  | "projects"
  | "expertise"
  | "about_paragraphs"
  | "core_values"
  | "site_settings"
  | "contact_messages"
  | "contact_replies"
  | "posts"
  | "categories"
  | "tags"
  | "post_tags"
  | "comments"
  | "post_reactions";

interface EntityRegistry {
  entities: Array<new () => unknown>;
  byCollection: Record<EntityCollectionName, new () => unknown>;
}

declare global {
  var __entityRegistry: EntityRegistry | undefined;
}

function buildRegistry(): EntityRegistry {
  const byCollection = {
    users: User,
    counters: Counter,
    skills: Skill,
    projects: Project,
    expertise: Expertise,
    about_paragraphs: AboutParagraph,
    core_values: CoreValue,
    site_settings: SiteSetting,
    contact_messages: ContactMessage,
    contact_replies: ContactReply,
    posts: BlogPost,
    categories: BlogCategory,
    tags: BlogTag,
    post_tags: PostTag,
    comments: Comment,
    post_reactions: PostReaction,
  } as Record<EntityCollectionName, new () => unknown>;

  // Guard against bundlers renaming the classes: assert every entity keeps
  // a non-empty function name at startup so the TypeORM name fallback works.
  for (const [collection, ctor] of Object.entries(byCollection)) {
    if (typeof ctor !== "function" || !ctor.name) {
      throw new Error(
        `Entity class for "${collection}" lost its function name (bundler minification?). ` +
          `TypeORM metadata resolution would fail at runtime.`
      );
    }
  }

  return { entities: Object.values(byCollection), byCollection };
}

const registry: EntityRegistry =
  global.__entityRegistry ?? (global.__entityRegistry = buildRegistry());

/** The entity class registered for a collection (shared class object). */
export function getEntity(collection: EntityCollectionName): new () => unknown {
  const ctor = registry.byCollection[collection];
  if (!ctor) throw new Error(`No entity registered for "${collection}".`);
  return ctor;
}

/** The full entity list for DataSource registration. */
export function getEntities(): Array<new () => unknown> {
  return registry.entities;
}

/* Re-export the classes for typing convenience — but data access should use
 * getEntity() so the class object identity is always the shared one. */
export { User, Counter, Skill, Project, Expertise, AboutParagraph, CoreValue, SiteSetting, ContactMessage, ContactReply, BlogPost, BlogCategory, BlogTag, PostTag, Comment, PostReaction };

/* ─────────────────────────────────────────────
 * Shared DataSource (moved from db.ts)
 * ───────────────────────────────────────────── */
const resolveUri = () => process.env.MONGODB_URI ?? buildFallbackUri();

export const AppDataSource: DataSource =
  (global as { __typeormSource?: DataSource }).__typeormSource ??
  new DataSource({
    type: "mongodb",
    url: resolveUri(),
    database: process.env.DB_NAME ?? "portfolio_db",
    // TypeORM rebuilds the connection string and drops `ssl=true` from the
    // URL (it only understands `tls`), so managed Atlas endpoints must set
    // it explicitly or the server rejects the plaintext connection.
    tls: resolveUri().includes("mongodb.net"),
    entities: getEntities(),
    // Schema is managed by scripts/migrate.mjs — never auto-sync in prod.
    synchronize: false,
    logging: false,
  });

function buildFallbackUri(): string {
  const user = encodeURIComponent(process.env.DB_USER ?? "root");
  const password = encodeURIComponent(process.env.DB_PASSWORD ?? "");
  const host = process.env.DB_HOST ?? "127.0.0.1";
  const port = process.env.DB_PORT ?? "27017";
  return `mongodb://${user}:${password}@${host}:${port}`;
}

/** Lazily initialized DataSource — awaits connect() exactly once. */
export async function getDb(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}

/** Repository for a collection's entity, using the shared class object. */
export async function getRepo(collection: EntityCollectionName) {
  const ds = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ds.getMongoRepository(getEntity(collection) as any);
}

/** Auto-increment id via the counters collection (findAndModify upsert). */
export async function nextId(collection: string): Promise<number> {
  const db = await getNativeDb();
  const result = await db.collection("counters").findOneAndUpdate(
    { key: collection },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  if (!result) throw new Error(`Failed to allocate id for "${collection}".`);
  return result.seq;
}
