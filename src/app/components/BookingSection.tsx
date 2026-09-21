"use client";

import { useEffect, useMemo, useState } from "react";

/* ── Types ──────────────────────────────────── */
interface Slot {
  start: string;
  end: string;
  label: string;
}

type Status = "idle" | "loading" | "submitting" | "success" | "error";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookingSection() {
  const today = useMemo(() => new Date(), []);

  /* Calendar month state */
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookable, setBookable] = useState<Set<string>>(new Set());

  /* Slots + form */
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [pickedSlot, setPickedSlot] = useState<Slot | null>(null);
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [serverMsg, setServerMsg] = useState("");

  /* Load the bookable date range once */
  useEffect(() => {
    fetch("/api/booking/slots")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())) )
      .then((data: { dates?: string[] }) =>
        setBookable(new Set(data.dates ?? []))
      )
      .catch(() => setBookable(new Set()));
  }, []);

  /* Load slots when a date is selected. State resets happen in the click
   * handler (selectDate) — not here — to avoid cascading renders. */
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    fetch(`/api/booking/slots?date=${selectedDate}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to load slots.");
        return data as { slots: Slot[] };
      })
      .then((data) => {
        if (!cancelled) setSlots(data.slots);
      })
      .catch((err: Error) => {
        if (!cancelled) setSlotsError(err.message);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  /** Select a date and reset slot-dependent state up front. */
  const selectDate = (iso: string) => {
    setPickedSlot(null);
    setSlotsError("");
    setSlotsLoading(true);
    setSelectedDate(iso);
  };

  /* Calendar grid for the viewed month */
  const grid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const lead = first.getDay();
    const cells: (Date | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    return cells;
  }, [viewYear, viewMonth]);

  const canPrev = useMemo(() => {
    const firstOfView = new Date(viewYear, viewMonth, 1);
    return firstOfView <= today;
  }, [viewYear, viewMonth, today]);
  const canNext = useMemo(() => {
    const last = new Date(viewYear, viewMonth + 1, 0);
    const maxDate = new Date(today.getTime() + 30 * 86400000);
    return last >= maxDate || viewMonth !== maxDate.getMonth() || viewYear !== maxDate.getFullYear();
  }, [viewYear, viewMonth, today]);

  const step = (dir: 1 | -1) => {
    const next = new Date(viewYear, viewMonth + dir, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  /* Submit */
  async function handleSubmit() {
    if (!pickedSlot) return;
    setStatus("submitting");
    setServerMsg("");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStartISO: pickedSlot.start,
          email,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed.");
      setStatus("success");
      setServerMsg(
        `Meeting booked for ${data.label}. Check your email for the invite.`
      );
    } catch (err) {
      setStatus("error");
      setServerMsg(err instanceof Error ? err.message : "Booking failed.");
      // Refresh slots — the picked one may be gone.
      if (selectedDate) {
        fetch(`/api/booking/slots?date=${selectedDate}`)
          .then((r) => r.json())
          .then((d) => setSlots(d.slots ?? []))
          .catch(() => {});
      }
      setPickedSlot(null);
    }
  }

  function reset() {
    setPickedSlot(null);
    setEmail("");
    setDescription("");
    setStatus("idle");
    setServerMsg("");
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition-all outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10";

  return (
    <section id="booking" className="relative px-4 py-28">
      <div className="absolute top-1/3 left-0 h-72 w-72 rounded-full bg-purple-500/5 blur-[100px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
            Meet
          </span>
          <div className="section-bar" />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
          Let&apos;s <span className="gradient-text">Talk</span>
        </h2>
        <p className="mb-12 max-w-2xl text-zinc-500">
          Book a free 20-minute intro call — pick a day, grab a slot, and
          you&apos;ll get a calendar invite by email. No account needed.
        </p>

        {status === "success" ? (
          <div className="glass mx-auto max-w-xl rounded-2xl p-10 text-center">
            <p className="text-4xl">📅</p>
            <h3 className="mt-4 text-xl font-semibold text-zinc-100">
              You&apos;re booked!
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-emerald-300">{serverMsg}</p>
            <button
              onClick={reset}
              className="mt-6 rounded-full border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              Book another slot
            </button>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            {/* ── Month calendar ── */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-100">
                  {MONTHS[viewMonth]} {viewYear}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => step(-1)}
                    disabled={!canPrev}
                    aria-label="Previous month"
                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => step(1)}
                    disabled={!canNext}
                    aria-label="Next month"
                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2 text-xs font-semibold text-zinc-600">
                    {d}
                  </div>
                ))}
                {grid.map((date, i) => {
                  if (!date) return <div key={`x${i}`} />;
                  const iso = toISODate(date);
                  const isBookable = bookable.has(iso);
                  const isPast = iso < toISODate(today);
                  const selectable = isBookable && !isPast;
                  const selected = selectedDate === iso;
                  return (
                    <button
                      key={iso}
                      disabled={!selectable}
                      onClick={() => selectDate(iso)}
                      aria-pressed={selected}
                      className={`aspect-square rounded-lg text-sm transition-colors ${
                        selected
                          ? "bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold text-white"
                          : selectable
                            ? "text-zinc-300 hover:bg-cyan-500/10 hover:text-cyan-300"
                            : "cursor-not-allowed text-zinc-700"
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* ── Form under the calendar (like the mockup) ── */}
              <div className="mt-6 space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  disabled={status === "submitting"}
                />
                <textarea
                  rows={4}
                  placeholder="Please provide topics for the discussion…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputCls} min-h-[100px] resize-y`}
                  disabled={status === "submitting"}
                />
                {status === "error" && serverMsg && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {serverMsg}
                  </div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={reset}
                    className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={status === "submitting" || !pickedSlot || !email || description.trim().length < 5}
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {status === "submitting" ? "Booking…" : "Submit"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Slots ── */}
            <div className="lg:border-l lg:border-zinc-800/60 lg:pl-12">
              <div className="mb-4 flex h-6 items-center gap-2 text-sm text-zinc-400">
                {selectedDate ? (
                  <>
                    <span className="text-zinc-100">
                      {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { weekday: "long", month: "long", day: "numeric" }
                      )}
                    </span>
                    {slotsLoading && (
                      <span className="text-xs text-zinc-500">loading…</span>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-500">
                    Pick an available day to see open slots
                  </span>
                )}
              </div>

              {!selectedDate && (
                <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
                  <span className="mb-3 block text-3xl">🕐</span>
                  Available times appear here after you select a day.
                </div>
              )}

              {selectedDate && slotsLoading && (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl border border-zinc-800/60 bg-zinc-900/40"
                    />
                  ))}
                </div>
              )}

              {selectedDate && !slotsLoading && slotsError && (
                <div className="glass rounded-2xl p-6 text-center text-sm text-red-300">
                  {slotsError}
                </div>
              )}

              {selectedDate && !slotsLoading && !slotsError && slots.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
                  No free slots on this day — try another date.
                </div>
              )}

              {selectedDate && !slotsLoading && slots.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {slots.map((slot) => {
                    const active = pickedSlot?.start === slot.start;
                    return (
                      <button
                        key={slot.start}
                        onClick={() => setPickedSlot(slot)}
                        aria-pressed={active}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                          active
                            ? "border-cyan-500/60 bg-gradient-to-r from-cyan-500/15 to-purple-600/15 text-cyan-200"
                            : "border-zinc-800 text-zinc-300 hover:border-cyan-500/40 hover:text-cyan-300"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {pickedSlot && (
                <p className="mt-4 text-xs text-cyan-300/80">
                  Selected: {pickedSlot.label} on{" "}
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
