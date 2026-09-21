import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getContactStatusCounts } from "@/lib/contact";

/**
 * GET /api/messages/counts
 * Per-status contact message counts, for live-polling the inbox filter tabs.
 * Admin only — non-admins get zeroed counts so the tabs render inert.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({
      counts: { new: 0, read: 0, replied: 0 },
      allTotal: 0,
    });
  }

  // A missing table (migration pending) shouldn't 500 the poll.
  try {
    const { counts, allTotal } = await getContactStatusCounts();
    return NextResponse.json(
      { counts, allTotal },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Message counts fetch failed:", err);
    return NextResponse.json({
      counts: { new: 0, read: 0, replied: 0 },
      allTotal: 0,
    });
  }
}
