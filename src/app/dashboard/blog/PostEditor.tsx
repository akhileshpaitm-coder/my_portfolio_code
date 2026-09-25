"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/app/components/toast";

/**
 * PostEditor — a professional rich-text/code editor for developer articles.
 *
 * Built on contentEditable + document.execCommand (still the only
 * widely-supported contentEditable command API) with a custom code-block
 * flow:
 *
 * - Toolbar: H1–H6, paragraphs, bold/italic/underline/strike, links,
 *   ordered/unordered lists, blockquotes, tables, inline code, code blocks,
 *   images (upload), undo/redo, clear formatting.
 * - Code blocks are <pre><code class="language-x"> with a language select;
 *   the highlight.js class list matches the public site's highlighter.
 * - Images upload to /api/admin/upload/blog and are inserted with an alt
 *   prompt + caption support (figure/figcaption).
 * - Preview mode renders the sanitized HTML in a .post-content container
 *   (same styles as the public article page).
 *
 * The form field `content` carries the HTML; sanitization happens
 * server-side in the action (sanitize-post.ts).
 */

const LANGUAGES = [
  "plaintext", "javascript", "typescript", "jsx", "tsx", "html", "css", "scss",
  "json", "bash", "shell", "php", "python", "java", "csharp", "cpp", "c",
  "sql", "go", "rust", "ruby", "kotlin", "swift", "yaml", "markdown", "dockerfile",
];

const TABLE_DEFAULT = {
  rows: 3,
  cols: 3,
};

type ViewMode = "write" | "preview";

export interface PostEditorProps {
  name?: string;
  initialContent?: string;
  /** Rendered inside the preview pane label. */
  onDirtyChange?: (dirty: boolean) => void;
}

export default function PostEditor({
  name = "content",
  initialContent = "",
  onDirtyChange,
}: PostEditorProps) {
  const toast = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewMode>("write");
  const [html, setHtml] = useState(initialContent);
  const [uploading, setUploading] = useState(false);
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [activeLang, setActiveLang] = useState("javascript");
  const firstSync = useRef(true);

  /* Keep the hidden field in sync (uncontrolled editor + controlled hidden input). */
  const syncHidden = useCallback(() => {
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
    onDirtyChange?.(true);
  }, [onDirtyChange]);

  useEffect(() => {
    if (firstSync.current && editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      firstSync.current = false;
    }
  }, [initialContent]);

  /* ── execCommand helpers ── */

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncHidden();
  };

  const isActive = (command: string) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  /* ── Headings ── */
  const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6 | 0) => {
    exec("formatBlock", level === 0 ? "p" : `h${level}`);
  };

  /* ── Links ── */
  const insertLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      exec("createLink", safe);
    } else {
      exec("insertHTML", `<a href="${safe}">${safe}</a>`);
    }
    setShowLinkInput(false);
    setLinkUrl("");
  };

  /* ── Inline code ── */
  const insertInlineCode = () => {
    const selection = window.getSelection();
    const text = selection?.toString() ?? "";
    if (text) {
      // Wrap the selected text; execCommand("insertHTML") preserves it.
      const code = document.createElement("code");
      code.textContent = text;
      exec("insertHTML", code.outerHTML);
    } else {
      exec("insertHTML", "<code>code</code>&nbsp;");
    }
  };

  /* ── Code blocks ── */
  const insertCodeBlock = () => {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = `language-${activeLang}`;
    code.textContent = "// your code here";
    pre.appendChild(code);
    exec("insertHTML", pre.outerHTML + "<p><br></p>");
  };

  /* Wrap the current selection's block (or insert a fresh one) in a code block. */
  const codeBlockFromSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      insertCodeBlock();
      return;
    }
    const text = selection.toString();
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = `language-${activeLang}`;
    code.textContent = text;
    pre.appendChild(code);
    exec("insertHTML", pre.outerHTML + "<p><br></p>");
  };

  /* ── Tables ── */
  const insertTable = (rows: number, cols: number) => {
    const clamp = (n: number) => Math.max(1, Math.min(8, Math.floor(n)));
    const r = clamp(rows);
    const c = clamp(cols);
    const thead = `<thead><tr>${`<th>Heading</th>`.repeat(c)}</tr></thead>`;
    const tbody = `<tbody>${Array.from({ length: r - 1 }, () => `<tr>${"<td>Cell</td>".repeat(c)}</tr>`).join("")}</tbody>`;
    exec("insertHTML", `<table>${thead}${tbody}</table><p><br></p>`);
    setShowTableGrid(false);
  };

  /* ── Images ── */
  const uploadAndInsertImage = async (file: File) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      toast.error({ title: "Unsupported image type", description: "Use PNG, JPG, WebP or GIF." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error({ title: "Image too large", description: "Images must be 5 MB or smaller." });
      return;
    }

    setUploading(true);
    const loadingId = toast.loading({ title: "Uploading image…", description: file.name });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/blog", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed.");

      const alt = window.prompt("Alt text (accessibility + SEO):", file.name.replace(/\.[^.]+$/, ""));
      const altText = alt?.trim() || "";

      const figure = document.createElement("figure");
      const img = document.createElement("img");
      img.src = data.url;
      img.alt = altText;
      figure.appendChild(img);
      if (altText) {
        const caption = document.createElement("figcaption");
        caption.textContent = altText;
        figure.appendChild(caption);
      }
      exec("insertHTML", figure.outerHTML + "<p><br></p>");
      toast.resolve(loadingId, "success", { title: "Image inserted" });
    } catch (err) {
      toast.resolve(loadingId, "error", {
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  /* ── Toolbar button styling ── */
  const btn =
    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100";
  const btnActive = "bg-cyan-500/15 text-cyan-300";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
      {/* Mode tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-3 py-2">
        <div className="flex gap-1">
          {(["write", "preview"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                if (mode === "preview") syncHidden();
                setView(mode);
              }}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                view === mode
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        {view === "write" && (
          <span className="text-[11px] text-zinc-600">
            {uploading ? "Uploading…" : "Rich text + code"}
          </span>
        )}
      </div>

      {view === "write" ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800/70 bg-zinc-900/60 px-3 py-2">
            {/* Headings */}
            <select
              onChange={(e) => setHeading(Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
              defaultValue="0"
              aria-label="Heading level"
              className="mr-1 cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="0">Paragraph</option>
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
              <option value="4">H4</option>
              <option value="5">H5</option>
              <option value="6">H6</option>
            </select>

            <button type="button" aria-label="Bold" title="Bold (Ctrl+B)"
              onClick={() => exec("bold")}
              className={`${btn} font-bold ${isActive("bold") ? btnActive : ""}`}>B</button>
            <button type="button" aria-label="Italic" title="Italic (Ctrl+I)"
              onClick={() => exec("italic")}
              className={`${btn} italic ${isActive("italic") ? btnActive : ""}`}>I</button>
            <button type="button" aria-label="Underline" title="Underline (Ctrl+U)"
              onClick={() => exec("underline")}
              className={`${btn} underline ${isActive("underline") ? btnActive : ""}`}>U</button>
            <button type="button" aria-label="Strikethrough" title="Strikethrough"
              onClick={() => exec("strikeThrough")}
              className={`${btn} line-through ${isActive("strikeThrough") ? btnActive : ""}`}>S</button>

            <span className="mx-1 h-5 w-px bg-zinc-800" aria-hidden />

            {/* Link */}
            <button
              type="button"
              aria-label="Insert link"
              title="Insert link"
              onClick={() => setShowLinkInput((v) => !v)}
              className={btn}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </button>

            {/* Lists */}
            <button type="button" aria-label="Bullet list" title="Bullet list"
              onClick={() => exec("insertUnorderedList")} className={btn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>
            <button type="button" aria-label="Numbered list" title="Numbered list"
              onClick={() => exec("insertOrderedList")} className={btn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6h11M10 12h11M10 18h11M4 6h1v4m-1 0h2M4 12h2l-2 3h2" />
              </svg>
            </button>

            {/* Quote */}
            <button type="button" aria-label="Blockquote" title="Blockquote"
              onClick={() => exec("formatBlock", "blockquote")} className={btn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>

            {/* Table */}
            <div className="relative">
              <button
                type="button"
                aria-label="Insert table"
                title="Insert table"
                onClick={() => setShowTableGrid((v) => !v)}
                className={btn}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125" />
                </svg>
              </button>
              {showTableGrid && (
                <div className="animate-pop-in absolute top-full left-0 z-20 mt-1 rounded-xl border border-zinc-800 bg-zinc-900 p-3 shadow-xl">
                  <TableGrid onPick={(r, c) => insertTable(r, c)} />
                  <button
                    type="button"
                    onClick={() => insertTable(TABLE_DEFAULT.rows, TABLE_DEFAULT.cols)}
                    className="mt-2 w-full cursor-pointer rounded-lg border border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    3 × 3 default
                  </button>
                </div>
              )}
            </div>

            <span className="mx-1 h-5 w-px bg-zinc-800" aria-hidden />

            {/* Inline code */}
            <button
              type="button"
              aria-label="Inline code"
              title="Inline code"
              onClick={insertInlineCode}
              className={`${btn} font-mono text-xs`}>{"</>"}</button>

            {/* Code block with language picker */}
            <select
              value={activeLang}
              onChange={(e) => setActiveLang(e.target.value)}
              aria-label="Code block language"
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Insert code block"
              title="Insert code block (highlighted, with copy button on the blog)"
              onClick={codeBlockFromSelection}
              className={`${btn} font-mono text-[11px]`}>{"[ ]}"}</button>

            <span className="mx-1 h-5 w-px bg-zinc-800" aria-hidden />

            {/* Image upload */}
            <label
              className={`${btn} cursor-pointer ${uploading ? "pointer-events-none opacity-50" : ""}`}
              title="Insert image (uploads + alt caption)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void uploadAndInsertImage(file);
                }}
              />
            </label>

            {/* Undo / redo / clear */}
            <button type="button" aria-label="Undo" title="Undo" onClick={() => exec("undo")} className={btn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </button>
            <button type="button" aria-label="Redo" title="Redo" onClick={() => exec("redo")} className={btn}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Clear formatting"
              title="Clear formatting"
              onClick={() => exec("removeFormat")}
              className={`${btn} text-[10px] font-semibold`}>Tx</button>
          </div>

          {/* Link input */}
          {showLinkInput && (
            <div className="animate-fade-in flex items-center gap-2 border-b border-zinc-800/70 bg-zinc-900/80 px-3 py-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), insertLink())}
                placeholder="https://example.com — select text first to link it"
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={insertLink}
                className="cursor-pointer rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowLinkInput(false)}
                className="cursor-pointer rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400"
              >
                ✕
              </button>
            </div>
          )}

          {/* Editing surface */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Article content"
            spellCheck
            onInput={syncHidden}
            onBlur={syncHidden}
            className="post-content-editor min-h-[420px] max-h-[70vh] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-zinc-200 outline-none"
          />

          <input type="hidden" name={name} value={html} />
        </>
      ) : (
        /* ── Preview mode — same CSS as the public article page ── */
        <div
          className="post-content min-h-[420px] px-5 py-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

/* ── Table size picker ── */
function TableGrid({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const size = 6;
  return (
    <div>
      <p className="mb-2 text-center text-[11px] text-zinc-500">
        {hover.r > 0 && hover.c > 0 ? `${hover.r} × ${hover.c}` : "rows × cols"}
      </p>
      <div className="grid grid-cols-6 gap-1">
        {Array.from({ length: size * size }, (_, i) => {
          const r = Math.floor(i / size) + 1;
          const c = (i % size) + 1;
          const active = r <= hover.r && c <= hover.c;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => onPick(r, c)}
              aria-label={`${r} rows, ${c} columns`}
              className={`h-5 w-5 rounded border transition-colors ${
                active ? "border-cyan-500/60 bg-cyan-500/30" : "border-zinc-700 bg-zinc-800/50"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
