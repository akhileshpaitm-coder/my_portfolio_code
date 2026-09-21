import "server-only";
import { google } from "googleapis";
import { getSiteSettings, type SiteSettings } from "@/lib/settings";

const CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar"];
const BOOKING_TITLE = "Portfolio meeting";

/* ─────────────────────────────────────────────
 * Timezone-safe time helpers (no external date lib needed)
 * ───────────────────────────────────────────── */

/** Offset of `timeZone` from UTC at the given instant, in minutes. */
function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return (asUTC - date.getTime()) / 60000;
}

/** "YYYY-MM-DD" + "HH:MM" in `timeZone` → absolute UTC Date. */
function zonedTimeToUtc(dateISO: string, hhmm: string, timeZone: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offset1 = tzOffsetMinutes(new Date(guess), timeZone);
  const candidate = new Date(guess - offset1 * 60000);
  // DST safety: re-check the offset at the refined instant.
  const offset2 = tzOffsetMinutes(candidate, timeZone);
  return offset2 === offset1
    ? candidate
    : new Date(guess - offset2 * 60000);
}

/** Absolute Date → "YYYY-MM-DD" in `timeZone`. */
function dateInTz(date: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(date);
}

/** "HH:MM" → minutes since midnight. */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes since midnight → "HH:MM". */
function minutesToHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────
 * Configuration
 * ───────────────────────────────────────────── */

export interface BookingConfig {
  windowStart: string; // "08:00" in booking timezone
  windowEnd: string;   // "10:00"
  slotMinutes: number; // 20
  timeZone: string;    // "Asia/Kolkata"
  calendarId: string;  // "" ⇒ booking disabled
  /** Which local dates are bookable (window in booking-timezone days). */
  minDaysAhead: number;
  maxDaysAhead: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getBookingConfig(): Promise<BookingConfig> {
  const s = await getSiteSettings();
  const slotMinutes = Math.max(
    5,
    Math.min(120, Number(s.booking_slot_minutes) || 20)
  );
  return {
    windowStart: /^\d{2}:\d{2}$/.test(s.booking_window_start)
      ? s.booking_window_start
      : "08:00",
    windowEnd: /^\d{2}:\d{2}$/.test(s.booking_window_end)
      ? s.booking_window_end
      : "10:00",
    slotMinutes,
    timeZone: s.booking_timezone || "UTC",
    calendarId: s.booking_calendar_id.trim(),
    minDaysAhead: 0, // today is bookable if the window hasn't passed
    maxDaysAhead: 30,
  };
}

/** Booking section is shown only when a calendar is configured. */
export function isBookingEnabled(s: SiteSettings): boolean {
  return s.booking_calendar_id.trim().length > 0;
}

/* ─────────────────────────────────────────────
 * Slot computation + availability
 * ───────────────────────────────────────────── */

/** Candidate slots (UTC instants) for a booking-timezone date. */
export function computeSlots(
  dateISO: string,
  config: BookingConfig
): Array<{ start: Date; end: Date }> {
  const startMin = hhmmToMinutes(config.windowStart);
  const endMin = hhmmToMinutes(config.windowEnd);
  const slots: Array<{ start: Date; end: Date }> = [];
  if (endMin <= startMin) return slots;

  for (let m = startMin; m + config.slotMinutes <= endMin; m += config.slotMinutes) {
    slots.push({
      start: zonedTimeToUtc(dateISO, minutesToHHMM(m), config.timeZone),
      end: zonedTimeToUtc(dateISO, minutesToHHMM(m + config.slotMinutes), config.timeZone),
    });
  }
  return slots;
}

/** Bookable booking-timezone dates as ISO strings. */
export function bookableDates(config: BookingConfig): string[] {
  const todayISO = dateInTz(new Date(), config.timeZone);
  const [y, m, d] = todayISO.split("-").map(Number);
  const todayUTC = Date.UTC(y, m - 1, d);
  const out: string[] = [];
  for (let i = config.minDaysAhead; i <= config.maxDaysAhead; i++) {
    out.push(new Date(todayUTC + i * DAY_MS).toISOString().slice(0, 10));
  }
  return out;
}

/** Google auth (service account) — null when not configured. */
function getCalendarClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) return null;
  const auth = new google.auth.JWT({ email, key, scopes: CALENDAR_SCOPES });
  return google.calendar({ version: "v3", auth });
}

/**
 * Which candidate slots for `dateISO` are free (no Google events overlap).
 * Falls back to "all free" if credentials are missing so the UI stays usable
 * in dev; booking POST will still fail loudly without credentials.
 */
export async function getAvailableSlots(
  dateISO: string,
  config: BookingConfig
): Promise<Array<{ start: string; end: string; label: string }>> {
  const slots = computeSlots(dateISO, config);
  if (slots.length === 0) return [];

  // Filter out slots that already started (today) or are in the past.
  const now = Date.now();
  const future = slots.filter((s) => s.end.getTime() > now);
  if (future.length === 0) return [];

  const calendar = getCalendarClient();
  const toLabel = (s: Date) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: config.timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(s);

  if (!calendar) {
    return future.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      label: toLabel(s.start),
    }));
  }

  // Query the whole window once and mark overlaps as busy.
  const windowStart = future[0].start;
  const windowEnd = future[future.length - 1].end;
  const busy: Array<{ start: Date; end: Date }> = [];
  try {
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: windowStart.toISOString(),
        timeMax: windowEnd.toISOString(),
        items: [{ id: config.calendarId }],
      },
    });
    const calBusy =
      res.data.calendars?.[config.calendarId]?.busy ?? [];
    for (const b of calBusy) {
      if (b.start && b.end) busy.push({ start: new Date(b.start), end: new Date(b.end) });
    }
  } catch (err) {
    console.error("Freebusy query failed:", err);
    throw new Error("Could not check calendar availability.");
  }

  return future
    .filter(
      (s) => !busy.some((b) => b.start < s.end && s.start < b.end)
    )
    .map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      label: toLabel(s.start),
    }));
}

/* ─────────────────────────────────────────────
 * Booking creation
 * ───────────────────────────────────────────── */

export interface BookingInput {
  slotStartISO: string;
  email: string;
  description: string;
}

export type BookingResult =
  | { ok: true; start: string; end: string; label: string }
  | { ok: false; error: string; code: "invalid" | "unavailable" | "unconfigured" | "failed" };

export async function createBooking(
  input: BookingInput,
  config: BookingConfig
): Promise<BookingResult> {
  const calendar = getCalendarClient();
  if (!calendar || !config.calendarId) {
    return {
      ok: false,
      error: "Booking is not configured yet. Please use the contact form.",
      code: "unconfigured",
    };
  }

  const slotStart = new Date(input.slotStartISO);
  if (Number.isNaN(slotStart.getTime())) {
    return { ok: false, error: "Invalid time slot.", code: "invalid" };
  }

  // Must match a real candidate slot for that date (prevents arbitrary events).
  const dateISO = dateInTz(slotStart, config.timeZone);
  const candidates = computeSlots(dateISO, config);
  const slot = candidates.find(
    (s) => s.start.getTime() === slotStart.getTime()
  );
  if (!slot) {
    return { ok: false, error: "Invalid time slot.", code: "invalid" };
  }
  if (slot.end.getTime() <= Date.now()) {
    return { ok: false, error: "That time slot has passed.", code: "invalid" };
  }

  // Re-check availability right before insert (avoid double-booking).
  const available = await getAvailableSlots(dateISO, config);
  if (!available.some((a) => a.start === slot.start.toISOString())) {
    return {
      ok: false,
      error: "That slot was just taken. Please pick another time.",
      code: "unavailable",
    };
  }

  try {
    await calendar.events.insert({
      calendarId: config.calendarId,
      requestBody: {
        summary: BOOKING_TITLE,
        description: `${input.description}\n\n— Booked by ${input.email} via portfolio website`,
        start: {
          dateTime: slot.start.toISOString(),
          timeZone: config.timeZone,
        },
        end: {
          dateTime: slot.end.toISOString(),
          timeZone: config.timeZone,
        },
        attendees: [{ email: input.email }],
      },
      // Let Google send the invite email to the visitor.
      sendUpdates: "all",
    });
  } catch (err) {
    console.error("Failed to create calendar event:", err);
    return {
      ok: false,
      error: "Could not create the meeting. Please try again shortly.",
      code: "failed",
    };
  }

  return {
    ok: true,
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    label: new Intl.DateTimeFormat("en-US", {
      timeZone: config.timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(slot.start),
  };
}
