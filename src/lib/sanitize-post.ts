import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes editor-generated rich-text HTML before it is stored or served.
 *
 * The content comes from the admin's own editor (authenticated admins only),
 * but this stays a hard boundary: it strips script/iframe/event handlers
 * while preserving everything the editor produces — headings, lists,
 * tables, blockquotes, links, images, inline code and code blocks.
 *
 * <pre> blocks keep their raw text (the client-side highlighter escapes it);
 * <code> keeps class="language-xxx" for the syntax highlighter.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // basics
    "p", "br", "hr", "span", "div",
    // headings
    "h1", "h2", "h3", "h4", "h5", "h6",
    // inline styles
    "b", "strong", "i", "em", "u", "s", "del", "sub", "sup", "mark",
    // links + media
    "a", "img", "figure", "figcaption",
    // lists
    "ul", "ol", "li",
    // blocks
    "blockquote", "pre", "code",
    // tables
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"],
    span: ["class"],
    div: ["class"],
    p: ["class"],
    th: ["colspan", "rowspan", "style"],
    td: ["colspan", "rowspan", "style"],
    table: ["style"],
    "*": ["style"],
  },
  allowedSchemes: ["http", "https", "mailto", "data"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  allowProtocolRelative: false,
  selfClosing: ["br", "hr", "img", "col"],
  transformTags: {
    // Never let target=_blank through without rel=noopener.
    a: (tagName, attribs) => {
      const attrs = { ...attribs };
      if (attrs.target === "_blank" && !attrs.rel) {
        attrs.rel = "noopener noreferrer";
      }
      return { tagName, attribs: attrs };
    },
  },
};

export function sanitizePostHtml(dirty: string): string {
  return sanitizeHtml(dirty, SANITIZE_OPTIONS);
}

/** Extract plain text from HTML (for excerpts / search snippets). */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Derive an excerpt from content when the admin didn't write one. */
export function deriveExcerpt(html: string, maxLen = 220): string {
  const text = htmlToText(html);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}
