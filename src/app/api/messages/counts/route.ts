import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getContactStatusCounts,
  getLatestUnreadMessage,
} from "@/lib/contact";

/**
 * GET /api/messages/counts
 * Per-status contact message counts, for live-polling the inbox filter tabs.
 * Also returns `unread` (the sidebar badge value — same data as
 * countUnreadMessages, since "unread" === status "new") and `latest` (newest
 * unread message, for the "new message" toast) so a single poller can feed
 * the badge, the toast, and the tabs without hitting two endpoints.
 * Admin only — non-admins get zeroed data so the UI renders inert.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({
      counts: { new: 0, read: 0, replied: 0 },
      allTotal: 0,
      unread: 0,
      latest: null,
    });
  }

  // A missing table (migration pending) shouldn't 500 the poll.
  try {
    const { counts, allTotal } = await getContactStatusCounts();
    // Best effort — the tab counts alone are enough if this fails.
    let latest: Awaited<ReturnType<typeof getLatestUnreadMessage>> = null;
    try {
      latest = await getLatestUnreadMessage();
    } catch {
      latest = null;
    }
    return NextResponse.json(
      { counts, allTotal, unread: counts.new, latest },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Message counts fetch failed:", err);
    return NextResponse.json({
      counts: { new: 0, read: 0, replied: 0 },
      allTotal: 0,
      unread: 0,
      latest: null,
    });
  }
}
