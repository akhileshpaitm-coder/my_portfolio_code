import { NextRequest, NextResponse } from "next/server";
import {
  bookableDates,
  getAvailableSlots,
  getBookingConfig,
} from "@/lib/calendar";

/**
 * GET /api/booking/slots?date=YYYY-MM-DD
 * Public (no auth): visitors pick a day, get the free 20-min slots.
 * Omitting `date` returns the bookable date range instead.
 */
export async function GET(request: NextRequest) {
  const config = await getBookingConfig();
  if (!config.calendarId) {
    return NextResponse.json({ error: "Booking is not available." }, { status: 404 });
  }

  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ dates: bookableDates(config) });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }

  const allowed = bookableDates(config);
  if (!allowed.includes(date)) {
    return NextResponse.json(
      { error: "Date is outside the booking window." },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(date, config);
    return NextResponse.json(
      { date, slots },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load availability. Please try again." },
      { status: 502 }
    );
  }
}
