import "server-only";
import { DataSource } from "typeorm";
import { MongoClient, type Db } from "mongodb";
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
} from "./entities";

declare global {
  // eslint-disable-next-line no-var
  var __typeormSource: DataSource | undefined;
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined;
}

/**
 * Shared TypeORM DataSource (MongoDB driver).
 * Uses a global singleton in dev to survive hot reloads.
 *
 * Env vars: MONGODB_URI (full connection string) or the DB_* parts,
 * plus DB_NAME for the database.
 */
const resolveUri = () =>
  process.env.MONGODB_URI ?? buildFallbackUri();

export const AppDataSource: DataSource =
  global.__typeormSource ??
  new DataSource({
    type: "mongodb",
    url: resolveUri(),
    database: process.env.DB_NAME ?? "portfolio_db",
    // TypeORM rebuilds the connection string and drops `ssl=true` from the
    // URL (it only understands `tls`), so managed Atlas endpoints must set
    // it explicitly or the server rejects the plaintext connection.
    tls: resolveUri().includes("mongodb.net"),
    entities: [
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
    ],
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

/**
 * Raw native MongoDB driver handle (typed Db) — for the few places where an
 * aggregation or findOneAndUpdate is clearer than entity repository calls.
 */
export async function getNativeDb(): Promise<Db> {
  const client =
    global.__mongoClient ??
    new MongoClient(process.env.MONGODB_URI ?? buildFallbackUri(), {
      appName: "portfolio",
    });
  if (process.env.NODE_ENV !== "production") {
    global.__mongoClient = client;
  }
  // connect() is idempotent — safe to call on an already-connected client.
  await client.connect();
  return client.db(process.env.DB_NAME ?? "portfolio_db");
}

if (process.env.NODE_ENV !== "production") {
  global.__typeormSource = AppDataSource;
}

/* ─────────────────────────────────────────────
 * Auto-increment helper (replaces MySQL AUTO_INCREMENT)
 * ───────────────────────────────────────────── */

/**
 * Atomically reserve the next numeric id for a collection via a findAndModify
 * upsert on the `counters` collection. Safe under concurrency.
 */
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

/* ─────────────────────────────────────────────
 * User lookups (used by NextAuth credentials)
 * ───────────────────────────────────────────── */

export interface DbUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "user";
}

/** Look up a user by email (password hash included — for auth only). */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(User);
  const user = await repo.findOneBy({
    email: email.trim().toLowerCase(),
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password_hash: user.password_hash,
    role: user.role,
  };
}

/** Look up a user by id (safe fields only — for session enrichment). */
export async function getUserById(
  id: number
): Promise<Omit<DbUser, "password_hash"> | null> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(User);
  const user = await repo.findOneBy({ id });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
