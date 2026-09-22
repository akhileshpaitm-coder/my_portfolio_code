import "server-only";
import type { DataSource } from "typeorm";
import { MongoClient, type Db } from "mongodb";
import { getRepo } from "./entity-registry";

/**
 * Server-only DB access layer.
 *
 * The shared TypeORM DataSource lives in entity-registry.ts alongside the
 * entity classes it registers, so the class objects used by
 * getMongoRepository() always come from the same server-only module the
 * DataSource was built with (fixes EntityMetadataNotFoundError when bundlers
 * duplicate or minify entity classes).
 */

declare global {
  var __mongoClient: MongoClient | undefined;
}

export {
  AppDataSource,
  getDb,
  getRepo,
  nextId,
} from "./entity-registry";
export type { EntityCollectionName } from "./entity-registry";
export type { DataSource };

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
  const repo = await getRepo("users");
  const user = (await repo.findOneBy({
    email: email.trim().toLowerCase(),
  })) as {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: "admin" | "user";
  } | null;
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
  const repo = await getRepo("users");
  const user = (await repo.findOneBy({ id })) as {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
  } | null;
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/**
 * Raw native MongoDB driver handle (typed Db) — for the many places where an
 * aggregation or projection query is clearer than entity repository calls.
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

function buildFallbackUri(): string {
  const user = encodeURIComponent(process.env.DB_USER ?? "root");
  const password = encodeURIComponent(process.env.DB_PASSWORD ?? "");
  const host = process.env.DB_HOST ?? "127.0.0.1";
  const port = process.env.DB_PORT ?? "27017";
  return `mongodb://${user}:${password}@${host}:${port}`;
}
