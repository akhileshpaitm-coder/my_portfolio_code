import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { countUnreadMessages, getLatestUnreadMessage } from "@/lib/contact";

/**
 * GET /api/messages/unread-count
 * Current unread contact message count, for live-polling the sidebar badge
 * and detecting new arrivals for the toast. Admin only — non-admins get 0
 * so the badge hides cleanly.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ unread: 0 });
  }

  // A missing table (migration pending) shouldn't 500 the poll.
  try {
    const [unread, latest] = await Promise.all([
      countUnreadMessages(),
      getLatestUnreadMessage(),
    ]);
    return NextResponse.json(
      { unread, latest },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Unread count fetch failed:", err);
    return NextResponse.json({ unread: 0, latest: null });
  }
}
