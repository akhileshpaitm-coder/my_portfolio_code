"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/projects";

/**
 * Modern 3D flip project card.
 *
 * - Desktop (hover-capable): flips on hover, unflips on mouse leave.
 * - Touch: tap toggles the flip.
 * - Keyboard: card is focusable (hover devices), Enter/Space toggles,
 *   Escape closes, and tabbing into the back links keeps it flipped.
 * - Back face holds the full description, features, tech tags and links.
 */
export default function ProjectFlipCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const [hoverable, setHoverable] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Detect hover capability once (pointer:fine + can hover) — touch devices
  // fall back to tap-to-toggle.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverable(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Click outside closes a flipped (tap-toggled) card.
  useEffect(() => {
    if (!flipped || hoverable) return;
    const onPointerDown = (e: PointerEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setFlipped(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [flipped, hoverable]);

  const color = project.color || "#06b6d4";
  const key = `${project.id}-${project.title}`;

  return (
    <div
      ref={cardRef}
      className="group h-[420px] [perspective:1200px]"
      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
      onMouseEnter={hoverable ? () => setFlipped(true) : undefined}
      onMouseLeave={hoverable ? () => setFlipped(false) : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`${project.title} — ${flipped ? "hide" : "show"} details`}
        onClick={() => {
          if (!hoverable) setFlipped((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((v) => !v);
          }
          if (e.key === "Escape") setFlipped(false);
        }}
        className="relative h-full w-full cursor-pointer outline-none [transform-style:preserve-3d] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.4,0.1,0.2,1)] focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-2xl"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* ── Front face ── */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 [backface-visibility:hidden]">
          {/* Ambient color glow */}
          <div
            className="absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-20 blur-[80px] transition-opacity duration-500 group-hover:opacity-40"
            style={{ background: color }}
          />
          {/* Screenshot banner */}
          {project.screenshot_url && (
            <div className="relative h-40 w-full overflow-hidden border-b border-zinc-800/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.screenshot_url}
                alt={`${project.title} screenshot`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent" />
            </div>
          )}

          <div className="relative flex h-full flex-col p-6">
            {/* Icon + flip hint */}
            <div className="mb-4 flex items-start justify-between">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                style={{
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  boxShadow: `0 4px 20px ${color}20`,
                }}
              >
                {project.icon}
              </div>
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider opacity-70 transition-opacity group-hover:opacity-100"
                style={{ color, background: `${color}12` }}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Flip
              </span>
            </div>

            {/* Title */}
            <h3 className="mb-2 line-clamp-2 break-words text-lg font-semibold text-zinc-100">
              {project.title}
            </h3>

            {/* Short description */}
            <p className="line-clamp-3 break-words text-sm leading-relaxed text-zinc-400">
              {project.description}
            </p>

            {/* Tech tags pinned at bottom */}
            {project.tech.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                {project.tech.slice(0, 4).map((t, ti) => (
                  <span
                    key={`${key}-t-${ti}`}
                    className="max-w-full truncate break-words rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ color, background: `${color}12` }}
                  >
                    {t}
                  </span>
                ))}
                {project.tech.length > 4 && (
                  <span className="rounded-full bg-zinc-800/60 px-2.5 py-0.5 text-[11px] text-zinc-500">
                    +{project.tech.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1 opacity-70"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }}
          />
        </div>

        {/* ── Back face ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            borderColor: `${color}30`,
            background: `linear-gradient(145deg, ${color}14, rgba(24,24,27,0.95) 45%, rgba(10,10,15,0.98))`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }}
          />

          <div className="flex h-full flex-col p-6">
            <h3 className="mb-1 line-clamp-2 break-words text-lg font-semibold text-zinc-100">
              {project.title}
            </h3>
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color }}
            >
              {project.features.length > 0 ? "Key features" : "Details"}
            </p>

            {/* Full description */}
            <p className="mb-4 line-clamp-4 break-words text-xs leading-relaxed text-zinc-400">
              {project.description}
            </p>

            {/* Features list */}
            {project.features.length > 0 && (
              <ul className="mb-4 space-y-1.5">
                {project.features.slice(0, 4).map((f, fi) => (
                  <li
                    key={`${key}-f-${fi}`}
                    className="flex items-start gap-2 text-xs text-zinc-300"
                  >
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0"
                      style={{ color }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="min-w-0 break-words">{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* All tech tags */}
            {project.tech.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {project.tech.map((t, ti) => (
                  <span
                    key={`${key}-b-${ti}`}
                    className="max-w-full truncate break-words rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ color, background: `${color}14` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Links pinned at bottom */}
            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-zinc-800/60 pt-3">
              {project.demo_url ? (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:brightness-125"
                  style={{ color }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Live Demo
                </a>
              ) : (
                <span className="text-xs text-zinc-600">Demo coming soon</span>
              )}
              {(project.video_url || project.video_path) && (
                <a
                  href={project.video_url || project.video_path!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  Watch video
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
