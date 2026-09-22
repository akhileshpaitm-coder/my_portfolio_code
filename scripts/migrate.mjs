#!/usr/bin/env node
/**
 * Migration runner — applies scripts/migrations/*.mjs in order, once each.
 *
 * - Tracks applied files in the `_migrations` collection (name + applied_at),
 *   so "pending" is automatic; re-running only executes new scripts.
 * - Loads .env.local (dev) / .env (production) for MONGODB_URI / DB_NAME.
 * - Each migration module exports async up(db) / down(db) and is written to
 *   be idempotent so re-runs are safe even on a partially migrated database.
 *
 * Usage:
 *   node scripts/migrate.mjs            # apply pending migrations
 *   node scripts/migrate.mjs --status   # show applied/pending, change nothing
 *   node scripts/migrate.mjs --force    # run even outside production guard
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MongoClient } from "mongodb";

const ROOT = path.resolve(import.meta.dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "scripts", "migrations");
const TRACKING_COLLECTION = "_migrations";

const args = new Set(process.argv.slice(2));
const STATUS_ONLY = args.has("--status");

// ── Env loading (no dotenv dependency) ────────────────────────
async function loadEnvFile(file) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
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
}

// .env.local wins in dev; .env covers most production setups.
await loadEnvFile(path.join(ROOT, ".env"));
await loadEnvFile(path.join(ROOT, ".env.local"));

// ── Config ────────────────────────────────────────────────────
const uri =
  process.env.MONGODB_URI ??
  `mongodb://127.0.0.1:27017`;
const database = process.env.DB_NAME ?? "portfolio_db";

if (!process.env.MONGODB_URI && process.env.NODE_ENV === "production" && !args.has("--force")) {
  console.error(
    "Refusing to run in production without MONGODB_URI set (use --force to override)."
  );
  process.exit(1);
}

// ── Discover migration files ──────────────────────────────────
const files = (await readdir(MIGRATIONS_DIR))
  .filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
  .sort((a, b) => a.localeCompare(b));

// ── Connect ───────────────────────────────────────────────────
const client = new MongoClient(uri, { appName: "portfolio-migrations" });
await client.connect();
const db = client.db(database);

// Tracking collection with a unique index on name.
await db
  .collection(TRACKING_COLLECTION)
  .createIndex({ name: 1 }, { unique: true });

const appliedDocs = await db
  .collection(TRACKING_COLLECTION)
  .find({}, { projection: { _id: 0, name: 1 } })
  .toArray();
const applied = new Set(appliedDocs.map((d) => d.name));

const pending = files.filter((f) => !applied.has(f));

// ── Status mode ───────────────────────────────────────────────
if (STATUS_ONLY) {
  console.log(`Database: ${database} @ ${uri.replace(/:\/\/[^@]*@/, "://***@")}\n`);
  for (const f of files) {
    console.log(`${applied.has(f) ? "✔ applied " : "○ pending "} ${f}`);
  }
  if (pending.length === 0) console.log("\nNothing to migrate — up to date.");
  else console.log(`\n${pending.length} pending. Run without --status to apply.`);
  await client.close();
  process.exit(0);
}

// ── Apply ─────────────────────────────────────────────────────
if (pending.length === 0) {
  console.log(`Nothing to migrate — ${files.length} file(s) already applied.`);
  await client.close();
  process.exit(0);
}

console.log(`Applying ${pending.length} migration(s) to ${database}:`);
for (const file of pending) {
  const mod = await import(pathToFileURL(path.join(MIGRATIONS_DIR, file)).href);
  if (typeof mod.up !== "function") {
    console.error(`\n${file} does not export up(db) — skipped.`);
    process.exit(1);
  }
  process.stdout.write(`  ▸ ${file} … `);
  try {
    await mod.up(db);
    await db
      .collection(TRACKING_COLLECTION)
      .updateOne({ name: file }, { $set: { name: file, applied_at: new Date() } }, { upsert: true });
    console.log("done");
  } catch (err) {
    console.log("FAILED");
    console.error(`\nError in ${file}:`);
    console.error(err.message);
    console.error(
      "\nStopped. Fix the issue, then re-run — completed migrations are skipped."
    );
    await client.close();
    process.exit(1);
  }
}

console.log("\nAll migrations applied successfully. 🎉");
await client.close();
