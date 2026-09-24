"use client";

/**
 * Shared client-side poller for /api/messages/counts.
 *
 * One module-level timer feeds every consumer (sidebar badge, new-message
 * toast, inbox filter tabs) from a single request per tick — instead of each
 * component running its own interval against its own endpoint. This halves
 * the polling traffic on the messages page and keeps exactly one request in
 * flight even when triggers overlap (tab refocus + interval tick).
 *
 * Behavior preserved from the previous per-component pollers:
 *  - polls every 10s while at least one subscriber is mounted
 *  - pauses while the tab is hidden, catches up immediately on return
 *  - `cache: "no-store"`, shape-validated responses, network errors ignored
 */

const POLL_INTERVAL = 10_000;

export interface LiveMessageInfo {
  id: number;
  name: string;
  subject: string;
  created_at?: string;
}

export interface MessageCountsData {
  counts: { new: number; read: number; replied: number };
  allTotal: number;
  /** Unread ("new") messages — feeds the sidebar badge. */
  unread: number;
  /** Newest unread message — drives the "new message" toast. */
  latest: LiveMessageInfo | null;
}

type Listener = (data: MessageCountsData) => void;

const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | undefined;
let inFlight: Promise<MessageCountsData | null> | undefined;
let lastData: MessageCountsData | null = null;

function isValid(data: unknown): data is MessageCountsData {
  if (typeof data !== "object" || data === null) return false;
  const o = data as Record<string, unknown>;
  const c = o.counts as Record<string, unknown> | undefined;
  const latest = o.latest as Record<string, unknown> | null | undefined;
  return (
    typeof c?.new === "number" &&
    typeof c?.read === "number" &&
    typeof c?.replied === "number" &&
    typeof o.allTotal === "number" &&
    typeof o.unread === "number" &&
    (latest === null ||
      (typeof latest === "object" && typeof latest.id === "number"))
  );
}

function fetchCounts(): Promise<MessageCountsData | null> {
  // Dedupe: a visibility catch-up colliding with a tick shares one request.
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/messages/counts", { cache: "no-store" });
      if (!res.ok) return null;
      const data: unknown = await res.json();
      if (!isValid(data)) return null;
      lastData = data;
      for (const listener of listeners) listener(data);
      return data;
    } catch {
      // Network hiccup — subscribers keep their last known values.
      return null;
    } finally {
      inFlight = undefined;
    }
  })();
  return inFlight;
}

function start() {
  if (timer) return;
  timer = setInterval(() => void fetchCounts(), POLL_INTERVAL);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

function onVisibility() {
  if (document.visibilityState === "visible") {
    void fetchCounts(); // catch up immediately when the user returns
    start();
  } else {
    stop();
  }
}

/**
 * Subscribe to live message counts. Returns an unsubscribe function.
 * The poll runs while at least one subscriber is registered; late joiners
 * immediately receive the last fetched payload (if any).
 */
export function subscribeMessageCounts(listener: Listener): () => void {
  const first = listeners.size === 0;
  listeners.add(listener);
  if (first) {
    document.addEventListener("visibilitychange", onVisibility);
    start();
  }
  if (lastData) listener(lastData);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}
