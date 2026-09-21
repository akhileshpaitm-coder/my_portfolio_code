#!/usr/bin/env node
/**
 * Migration runner — applies scripts/db/*.sql in order, once each.
 *
 * - Tracks applied files in `schema_migrations` (name + applied_at), so
 *   "pending" is automatic; re-running only executes new scripts.
 * - Loads .env.local (dev) / .env (production) for DB_* credentials.
 * - Each file runs as-is; files are written to be idempotent so the very
 *   first run is safe even on a database already migrated manually.
 * - Supports schema.sql first, then alphabetical migrations.
 *
 * Usage:
 *   node scripts/migrate.mjs            # apply pending migrations
 *   node scripts/migrate.mjs --status   # show applied/pending, change nothing
 *   node scripts/migrate.mjs --force    # run even outside production guard
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const ROOT = path.resolve(import.meta.dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "scripts", "db");
const TRACKING_TABLE = "schema_migrations";

/** Base schema must run before anything that references its tables. */
const BASE_SCHEMA = "schema.sql";

const args = new Set(process.argv.slice(2));
const STATUS_ONLY = args.has("--status");

// ── Env loading (no dotenv dependency) ────────────────────────
function loadEnvFile(file) {
  const text = readFile(file, "utf8")
    .then((t) => {
      for (const line of t.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m || process.env[m[1]] !== undefined) continue;
        let v = m[2];
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    })
    .catch(() => {});
}

// .env.local wins in dev; .env covers most production setups.
await loadEnvFile(path.join(ROOT, ".env"));
await loadEnvFile(path.join(ROOT, ".env.local"));

// ── Config ────────────────────────────────────────────────────
const config = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "portfolio_db",
  multipleStatements: true, // needed to run whole .sql files
};

if (!process.env.DB_NAME && process.env.NODE_ENV === "production" && !args.has("--force")) {
  console.error(
    "Refusing to run in production without DB_NAME set (use --force to override)."
  );
  process.exit(1);
}

// ── Discover migration files ──────────────────────────────────
const files = (await readdir(MIGRATIONS_DIR)).filter(
  (f) => f.endsWith(".sql") && !f.startsWith("_")
);
// schema.sql first, then everything else alphabetically.
files.sort((a, b) => {
  if (a === BASE_SCHEMA) return -1;
  if (b === BASE_SCHEMA) return 1;
  return a.localeCompare(b);
});

// ── Connect ───────────────────────────────────────────────────
const connection = await mysql.createConnection(config);
await connection.query(
  `CREATE TABLE IF NOT EXISTS \`${config.database}\`.${TRACKING_TABLE} (
     name       VARCHAR(255) NOT NULL,
     applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (name)
   ) ENGINE = InnoDB`
);

const [appliedRows] = await connection.query(
  `SELECT name FROM ${TRACKING_TABLE}`
);
const applied = new Set(appliedRows.map((r) => r.name));

const pending = files.filter((f) => !applied.has(f));

// ── Status mode ───────────────────────────────────────────────
if (STATUS_ONLY) {
  console.log(`Database: ${config.database}@${config.host}:${config.port}\n`);
  for (const f of files) {
    console.log(`${applied.has(f) ? "✔ applied " : "○ pending "} ${f}`);
  }
  if (pending.length === 0) console.log("\nNothing to migrate — up to date.");
  else console.log(`\n${pending.length} pending. Run without --status to apply.`);
  await connection.end();
  process.exit(0);
}

// ── Apply ─────────────────────────────────────────────────────
if (pending.length === 0) {
  console.log(`Nothing to migrate — ${files.length} file(s) already applied.`);
  await connection.end();
  process.exit(0);
}

console.log(`Applying ${pending.length} migration(s) to ${config.database}:`);
for (const file of pending) {
  const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
  process.stdout.write(`  ▸ ${file} … `);
  try {
    await connection.query(sql);
    await connection.query(
      `INSERT IGNORE INTO ${TRACKING_TABLE} (name) VALUES (?)`,
      [file]
    );
    console.log("done");
  } catch (err) {
    console.log("FAILED");
    console.error(`\nError in ${file}:`);
    console.error(err.message);
    console.error(
      "\nStopped. Fix the issue, then re-run — completed migrations are skipped."
    );
    process.exit(1);
  }
}

console.log("\nAll migrations applied successfully. 🎉");
await connection.end();
