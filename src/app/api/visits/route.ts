import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractIp, getVisitStats, recordVisit } from "@/lib/visits";

/**
 * POST /api/visits — record a public page view (fire-and-forget from the
 * client tracker). Best effort: DB errors never surface to the visitor.
 * Body: { path: string } — anything else is ignored.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      path?: unknown;
    } | null;

    const path =
      typeof body?.path === "string" && body.path.startsWith("/")
        ? body.path
        : "/";

    // Ignore admin dashboard traffic — only public pages are counted.
    if (path.startsWith("/dashboard") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }

    await recordVisit({
      path,
      ip: extractIp(request.headers),
      userAgent: request.headers.get("user-agent") ?? "",
      referrer: request.headers.get("referer"),
    });
  } catch (err) {
    // Tracking must never break a page load.
    console.error("Visit tracking failed:", err);
  }
  return NextResponse.json({ ok: true });
}

/**
 * GET /api/visits — live stats snapshot for the dashboard panel.
 * Admin only; non-admins get zeros so the UI renders inert.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ total: 0, today: 0, todayUnique: 0 }, { status: 200 });
  }

  try {
    const stats = await getVisitStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("Visit stats fetch failed:", err);
    return NextResponse.json(
      { total: 0, today: 0, todayUnique: 0, error: "unavailable" },
      { status: 200 }
    );
  }
}
