import "server-only";
import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

/**
 * Shared MySQL connection pool.
 * Uses a global singleton in dev to survive hot reloads.
 * Env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */
const pool: mysql.Pool =
  global.__mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "portfolio_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    timezone: "Z",
    dateStrings: true,
  });

if (process.env.NODE_ENV !== "production") {
  global.__mysqlPool = pool;
}

export default pool;

export interface DbUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "user";
}

/** Look up a user by email (password hash included — for auth only). */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()]
  );
  return (rows[0] as DbUser) ?? null;
}

/** Look up a user by id (safe fields only — for session enrichment). */
export async function getUserById(id: number): Promise<Omit<DbUser, "password_hash"> | null> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return (rows[0] as Omit<DbUser, "password_hash">) ?? null;
}
