"use client";

import { useEffect, useRef } from "react";

/**
 * Post-article enhancer (client).
 *
 * Runs entirely on the already-sanitized article DOM:
 * 1. Highlights every <pre><code class="language-xxx"> with highlight.js
 *    (the code text is read via textContent, so entities are safe).
 * 2. Wraps each block in a figure with a language label + copy button.
 * 3. Converts http(s) article images to next/image-friendly styling
 *    (lazy loading) and gives figures a caption class hook.
 *
 * Everything is additive markup — content itself is never modified, so the
 * server-rendered HTML remains the SEO source of truth.
 */
export default function ArticleEnhancer({ contentHtml }: { contentHtml: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cleanups: Array<() => void> = [];

    // ── 1. Code blocks: highlight + copy button + language label ──
    import("highlight.js/lib/common").then((mod) => {
      const hljs = mod.default;
      root.querySelectorAll("pre > code").forEach((code) => {
        const pre = code.parentElement;
        if (!pre || pre.dataset.enhanced) return;
        pre.dataset.enhanced = "1";

        // Language from class="language-xxx" (editor convention).
        const match = /language-([\w+-]+)/.exec(code.className);
        const lang = match?.[1] ?? "";

        // Highlight (fallback: raw text stays readable).
        try {
          if (lang && hljs.getLanguage(lang)) {
            code.innerHTML = hljs.highlight(code.textContent ?? "", { language: lang }).value;
          } else {
            code.innerHTML = hljs.highlightAuto(code.textContent ?? "").value;
          }
        } catch {
          /* leave as plain text */
        }

        // Wrapper with header (label + copy).
        const wrapper = document.createElement("div");
        wrapper.className = "code-block-wrapper group/code relative my-6 overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117]";
        const header = document.createElement("div");
        header.className = "flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2";

        const label = document.createElement("span");
        label.className = "font-mono text-[11px] tracking-wide text-zinc-500 uppercase";
        label.textContent = lang || "code";

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className =
          "flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300";
        copyBtn.setAttribute("aria-label", "Copy code");
        copyBtn.innerHTML =
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span>Copy</span>';

        const copyHandler = async () => {
          try {
            await navigator.clipboard.writeText(code.textContent ?? "");
            const text = copyBtn.querySelector("span");
            if (text) {
              text.textContent = "Copied!";
              copyBtn.classList.add("text-emerald-400", "border-emerald-500/40");
              setTimeout(() => {
                text.textContent = "Copy";
                copyBtn.classList.remove("text-emerald-400", "border-emerald-500/40");
              }, 1600);
            }
          } catch {
            /* clipboard unavailable */
          }
        };
        copyBtn.addEventListener("click", copyHandler);
        cleanups.push(() => copyBtn.removeEventListener("click", copyHandler));

        header.append(label, copyBtn);
        pre.replaceWith(wrapper);
        wrapper.append(header, pre);
        pre.className = "overflow-x-auto p-4 text-sm leading-relaxed";
        code.className = `hljs ${code.className}`;
      });
    }).catch(() => {
      /* highlighter failed to load — plain code is still fully readable */
    });

    // ── 2. Images inside the article: rounded + lazy ──
    root.querySelectorAll("img").forEach((img) => {
      if (img.dataset.enhanced) return;
      img.dataset.enhanced = "1";
      img.loading = "lazy";
      img.className = "my-6 w-full rounded-xl border border-zinc-800";
    });

    // ── 3. Tables: scroll wrapper (responsive) ──
    root.querySelectorAll("table").forEach((table) => {
      if (table.dataset.enhanced) return;
      table.dataset.enhanced = "1";
      const wrap = document.createElement("div");
      wrap.className = "my-6 overflow-x-auto rounded-xl border border-zinc-800";
      table.replaceWith(wrap);
      wrap.append(table);
    });

    return () => cleanups.forEach((fn) => fn());
  }, [contentHtml]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: contentHtml }} />;
}
