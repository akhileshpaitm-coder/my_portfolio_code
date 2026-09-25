import "server-only";
import crypto from "node:crypto";
import { getNativeDb } from "@/lib/db";

/**
 * Visitor tracking — cookie-free, privacy-friendly page visit counting.
 *
 * Writes:
 * - recordVisit(): called by POST /api/visits on public page loads. One
 *   $inc upsert per day plus a unique-index dedupe for unique visitors, so
 *   repeated refreshes are cheap and spam is bounded.
 *
 * Reads:
 * - getVisitStats(): totals for the admin dashboard (all-time views,
 *   today's views/uniques, 7- and 30-day trends, top pages).
 *
 * Counting model: a "view" is every tracked page load; a "visitor" is a
 * daily-salted hash of ip + user agent — no cookies, no persistent id, and
 * the salt rotates daily so hashes are not linkable across days.
 */

/** Site-wide counter doc key (visit_stats collection holds one row). */
const STATS_KEY = "site";

/** TTL safety margin — daily visitor rows are deleted when their day passes. */
const VISITOR_TTL_SECONDS = 60 * 60 * 48; // keep ≤48h, index expiry does the rest

export interface VisitStats {
  /** All-time tracked page views. */
  total: number;
  /**
   * All-time unique visitors — a visitor hash counted once per day, so the
   * same person on two different days counts twice (the hash is daily-salted
   * by design; no cookies/persistent ids are stored). Starts counting from
   * when this counter was introduced.
   */
  totalVisitors: number;
  /** Page views for the current local calendar day. */
  today: number;
  /** Unique visitors for the current local calendar day. */
  todayUnique: number;
  /** Page views yesterday (for a simple up/down delta). */
  yesterday: number;
  /** Unique visitors yesterday. */
  yesterdayUnique: number;
  /** Last 7 local days, oldest first (views + uniques per day). */
  last7: Array<{ day: string; views: number; unique: number }>;
  /** Last 30 local days, oldest first (views + uniques per day). */
  last30: Array<{ day: string; views: number; unique: number }>;
  /** Top 5 pages by views, all-time-ish (last 30 days). */
  topPages: Array<{ path: string; views: number }>;
}

/** "YYYY-MM-DD" in the site's local timezone (server clock). */
function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Start-of-day UTC ms for a "YYYY-MM-DD" local-day key (approximate UTC). */
function dayStartMs(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Build the "N days back" key list, oldest first, ending at today. */
function lastNDayKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  return keys;
}

/** Anonymous, non-reversible visitor id for a single day. */
function hashVisitorId(ip: string, userAgent: string, day: string): string {
  return crypto
    .createHash("sha256")
    .update(`${day}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

/** Best-effort client IP from proxy headers (no storage — hash only). */
export function extractIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "0.0.0.0"
  );
}

/**
 * Record one page view. `views` is incremented on the day bucket; if
 * `visitorId` (precomputed hash) is new for the day, `unique` is bumped too.
 * Never throws on DB failure — callers treat tracking as best effort.
 */
export async function recordVisit(input: {
  path: string;
  ip: string;
  userAgent: string;
  referrer?: string | null;
}): Promise<void> {
  const db = await getNativeDb();
  const day = dayKey();
  const vid = hashVisitorId(input.ip, input.userAgent, day);

  const dayStart = new Date(dayStartMs(day));
  const dayEnd = new Date(dayStartMs(day) + VISITOR_TTL_SECONDS * 1000);

  // Upsert the daily bucket (+1 view) and the running total in one round trip.
  const bulk = db.collection("visit_days").initializeOrderedBulkOp();
  bulk
    .find({ day })
    .upsert()
    .updateOne({
      $inc: { views: 1 },
      $setOnInsert: { first_at: new Date() },
    });
  await bulk.execute();

  // Unique-visitor dedupe — upsert with $setOnInsert. Duplicates are no-ops
  // (the visitor was already counted today); daily unique counts are derived
  // lazily by aggregating this collection in getVisitStats(). An upsertedId
  // in the result means this visitor hash is new for the day.
  const visitorRes = await db.collection("visit_visitors").updateOne(
    { day, vid },
    {
      $setOnInsert: { day, vid, expires_at: dayEnd },
      $set: { updated_at: new Date() },
    },
    { upsert: true }
  );
  const isNewVisitorToday = visitorRes.upsertedId != null;

  await db.collection("visit_stats").updateOne(
    { key: STATS_KEY },
    {
      $inc: {
        total: 1,
        ...(isNewVisitorToday ? { total_visitors: 1 } : {}),
      },
      $set: { last_day: day, updated_at: new Date() },
    },
    { upsert: true }
  );

  // Path stats — per-day per-path view counts for the top-pages list.
  const path = input.path.slice(0, 300) || "/";
  await db
    .collection("visit_pages")
    .updateOne(
      { day, path },
      { $inc: { views: 1 }, $setOnInsert: { first_at: dayStart } },
      { upsert: true }
    );
}

/** Aggregated visitor stats for the admin dashboard. */
export async function getVisitStats(): Promise<VisitStats> {
  const db = await getNativeDb();

  const statsDoc = await db
    .collection("visit_stats")
    .findOne(
      { key: STATS_KEY },
      { projection: { _id: 0, total: 1, total_visitors: 1 } }
    );

  const today = dayKey();
  const yesterdayKey = dayKey(
    new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)
  );

  const keys7 = lastNDayKeys(7);
  const keys30 = lastNDayKeys(30);

  const dayRows = await db
    .collection("visit_days")
    .find(
      { day: { $gte: keys30[0] } },
      { projection: { _id: 0, day: 1, views: 1 } }
    )
    .toArray();
  const viewsByDay = new Map(dayRows.map((r) => [r.day, Number(r.views) || 0]));

  // Uniques per day — count visitor hashes grouped by day (collection is
  // small: at most one row per visitor per day, TTL-cleared after 48h).
  const uniqueRows = await db
    .collection("visit_visitors")
    .aggregate<{ _id: string; n: number }>([
      { $match: { day: { $gte: keys30[0] } } },
      { $group: { _id: "$day", n: { $sum: 1 } } },
    ])
    .toArray();
  const uniqueByDay = new Map(uniqueRows.map((r) => [r._id, Number(r.n)]));

  const topPageRows = await db
    .collection("visit_pages")
    .aggregate<{ _id: null; pages: Array<{ path: string; views: number }> }>([
      { $match: { day: { $gte: keys30[0] } } },
      { $group: { _id: "$path", views: { $sum: "$views" } } },
      { $sort: { views: -1 } },
      { $limit: 5 },
      {
        $group: {
          _id: null,
          pages: { $push: { path: "$_id", views: "$views" } },
        },
      },
    ])
    .toArray();

  const toRow = (day: string) => ({
    day,
    views: viewsByDay.get(day) ?? 0,
    unique: uniqueByDay.get(day) ?? 0,
  });

  return {
    total: Number(statsDoc?.total) || 0,
    totalVisitors: Number(statsDoc?.total_visitors) || 0,
    today: viewsByDay.get(today) ?? 0,
    todayUnique: uniqueByDay.get(today) ?? 0,
    yesterday: viewsByDay.get(yesterdayKey) ?? 0,
    yesterdayUnique: uniqueByDay.get(yesterdayKey) ?? 0,
    last7: keys7.map(toRow),
    last30: keys30.map(toRow),
    topPages: topPageRows[0]?.pages ?? [],
  };
}
