"use client";

import { useCallback, useEffect, useRef } from "react";
import { useToast } from "./toast";

/* ─────────────────────────────────────────────
 * Calendly globals — declared here so no extra
 * dependency or @types package is needed.
 * ───────────────────────────────────────────── */

interface CalendlyPrefill {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface CalendlyPopupOptions {
  url: string;
  prefill?: CalendlyPrefill;
}

interface CalendlyApi {
  initPopupWidget: (options: CalendlyPopupOptions) => void;
}

declare global {
  interface Window {
    Calendly?: CalendlyApi;
  }
}

/* ─────────────────────────────────────────────
 * Config
 * ───────────────────────────────────────────── */

const WIDGET_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
const WIDGET_CSS_HREF = "https://assets.calendly.com/assets/external/widget.css";
const EVENT_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ?? "https://calendly.com/akhileshpaitm/30min";

/*
 * Scoped styling fixes for Calendly's popup overlay. Injected once next to the
 * widget CSS. Fixes, without touching site CSS:
 *  - dim the backdrop properly (Calendly default is only 40% black, so the
 *    site shows through) and blur it for a cleaner modal look
 *  - raise the overlay above the site's fixed navbar (z-50) and toasts (9999)
 *  - center the popup perfectly and cap its size against the viewport
 *  - drop Calendly's rigid min-width:900px so mid-size screens don't scroll
 *  - animate the OPEN with self-running keyframes (the widget JS adds NO state
 *    class to the popup, so transitions keyed on a class never run; closing
 *    has no hook in the widget, so close stays instant)
 *  - fix the close button icon URL (Calendly ships a site-relative path that
 *    404s outside their domain)
 */
const WIDGET_CSS_PATCH = `
.calendly-overlay {
  z-index: 100000 !important;
  background-color: rgba(9, 9, 15, 0.72) !important;
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  animation: calendly-overlay-in 0.25s ease both;
}

.calendly-overlay .calendly-popup {
  top: 50%;
  left: 50%;
  width: min(1000px, 94vw);
  height: min(92vh, 760px);
  max-height: none !important;
  min-width: 0 !important;
  transform: translate(-50%, -50%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 32px 80px -12px rgba(0, 0, 0, 0.6);
  animation: calendly-popup-in 0.3s cubic-bezier(0.21, 1.02, 0.73, 1) both;
}

@keyframes calendly-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes calendly-popup-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) translateY(0);
  }
}
@media (max-width: 975px) {
  .calendly-overlay .calendly-popup {
    inset: 0;
    width: 100%;
    height: 100%;
    transform: none;
    border-radius: 0;
    animation-name: calendly-popup-in-mobile;
  }
  /* Fullscreen popup would put the white ✕ on a white page — give it a
     dark circular chip so it stays visible. */
  .calendly-overlay .calendly-popup-close {
    top: 14px !important;
    right: 14px !important;
    width: 36px;
    height: 36px;
    background-color: rgba(31, 31, 31, 0.55);
    background-size: 55% !important;
    background-position: center;
    border-radius: 999px;
  }
}

@keyframes calendly-popup-in-mobile {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.calendly-overlay .calendly-popup-close {
  z-index: 10;
  transition: transform 0.15s ease;
  /* Calendly ships this as a site-relative URL (/assets/external/…) that 404s
     outside their domain — point it at the real asset. */
  background-image: url("https://assets.calendly.com/assets/external/close-icon.svg");
}
.calendly-overlay .calendly-popup-close:hover {
  transform: scale(1.15);
}

@media (prefers-reduced-motion: reduce) {
  .calendly-overlay,
  .calendly-overlay .calendly-popup {
    animation: none !important;
  }
}
`;

/* ─────────────────────────────────────────────
 * Script loader (idempotent, shared across all
 * CalendlyButton instances)
 * ───────────────────────────────────────────── */

let scriptPromise: Promise<void> | null = null;

function loadCalendly(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Calendly can only load in the browser."));
  }

  // Already available (e.g. a previous mount/click loaded it)
  if (window.Calendly?.initPopupWidget) return Promise.resolve();

  // Load already in flight — reuse it
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    // Calendly's popup iframe is styled by this stylesheet.
    if (!document.querySelector(`link[href="${WIDGET_CSS_HREF}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = WIDGET_CSS_HREF;
      document.head.appendChild(css);
    }

    // Scoped fixes for the popup overlay (centering, z-index, backdrop).
    // Loaded AFTER Calendly's stylesheet so the overrides win.
    if (!document.getElementById("calendly-widget-css-patch")) {
      const patch = document.createElement("style");
      patch.id = "calendly-widget-css-patch";
      patch.textContent = WIDGET_CSS_PATCH;
      document.head.appendChild(patch);
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WIDGET_SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Calendly widget failed to load."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Allow a retry on the next click.
      script.remove();
      scriptPromise = null;
      reject(new Error("Calendly widget failed to load."));
    };
    document.body.appendChild(script);
  }).finally(() => {
    // Once settled, subsequent calls short-circuit on window.Calendly.
  });

  return scriptPromise;
}

/* ─────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────── */

export interface CalendlyButtonProps {
  /** Button label. Default: "Book a Meeting". */
  label?: string;
  /** Extra classes to append (layout/visibility helpers from the parent). */
  className?: string;
  /** Prefill (from a logged-in session). */
  prefill?: CalendlyPrefill;
  children?: React.ReactNode;
}

export default function CalendlyButton({
  label = "Book a Meeting",
  className = "",
  prefill,
  children,
}: CalendlyButtonProps) {
  const toast = useToast();
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;

  const handleClick = useCallback(async () => {
    // Compensate for the scrollbar gap BEFORE the widget locks body scroll,
    // so page content doesn't jump ~8px sideways when the modal opens.
    // (The widget's body-scroll-lock doesn't reserve the gap itself.)
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarGap > 0 && !document.body.dataset.calendlyPad) {
      document.body.dataset.calendlyPad = "1";
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }
    try {
      await loadCalendly();
      window.Calendly?.initPopupWidget({
        url: EVENT_URL,
        prefill: prefillRef.current,
      });
    } catch (err) {
      document.body.style.paddingRight = "";
      delete document.body.dataset.calendlyPad;
      const message =
        err instanceof Error ? err.message : "Please try again later.";
      toast.error({
        title: "Couldn't open the scheduler",
        description: message,
      });
    }
  }, [toast]);

  // Fire a success toast when a booking completes. The booking iframe notifies
  // the top window via postMessage({ event: "calendly.event_scheduled" })
  // (widget.js itself only ever sends calendly.prefill / calendly.page_height).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { event?: string } | string | null;
      if (
        typeof data === "object" &&
        data !== null &&
        data.event === "calendly.event_scheduled"
      ) {
        toast.success({
          title: "Meeting booked!",
          description: "Your meeting is confirmed — check your email for the invite.",
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [toast]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      aria-haspopup="dialog"
      aria-label={label}
    >
      {children ?? label}
    </button>
  );
}
