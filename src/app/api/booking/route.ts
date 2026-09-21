import { NextRequest, NextResponse } from "next/server";
import { createBooking, getBookingConfig } from "@/lib/calendar";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/booking
 * Public (no auth): create a 20-min meeting on the owner's Google Calendar.
 * Body: { slotStartISO, email, description }
 */
export async function POST(request: NextRequest) {
  const config = await getBookingConfig();
  if (!config.calendarId) {
    return NextResponse.json(
      { error: "Booking is not available." },
      { status: 404 }
    );
  }

  let body: { slotStartISO?: unknown; email?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const slotStartISO = String(body.slotStartISO ?? "");
  const email = String(body.email ?? "").trim();
  const description = String(body.description ?? "").trim();

  if (!slotStartISO) {
    return NextResponse.json({ error: "Pick a time slot first." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }
  if (description.length < 5) {
    return NextResponse.json(
      { error: "Please describe the topic (at least 5 characters)." },
      { status: 400 }
    );
  }
  if (description.length > 1000) {
    return NextResponse.json(
      { error: "Description must be 1000 characters or fewer." },
      { status: 400 }
    );
  }

  const result = await createBooking({ slotStartISO, email, description }, config);
  if (!result.ok) {
    const status =
      result.code === "unavailable" ? 409 :
      result.code === "unconfigured" ? 503 :
      result.code === "failed" ? 502 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    success: true,
    start: result.start,
    end: result.end,
    label: result.label,
  });
}
