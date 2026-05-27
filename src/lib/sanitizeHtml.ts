import DOMPurify from "dompurify";

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "sub",
  "sup",
  "span",
  "div",
  "pre",
  "code",
]);

const BLOCKED_LINK_PREFIXES = ["javascript:", "data:", "vbscript:"];

function sanitizeHref(value: string | null): string | null {
  if (!value) return null;
  const href = value.trim();
  const lower = href.toLowerCase();
  if (BLOCKED_LINK_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return null;
  }
  return href;
}

/** Sanitize rich HTML for public display. */
export function sanitizeHtml(html: string): string {
  if (!html?.trim()) return "";

  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Node) => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        el.replaceWith(doc.createTextNode(el.textContent || ""));
        continue;
      }
      [...el.attributes].forEach((attr) => {
        if (tag === "a" && attr.name === "href") {
          const safe = sanitizeHref(attr.value);
          if (!safe) el.removeAttribute("href");
          else el.setAttribute("href", safe);
          return;
        }
        if (tag === "a" && (attr.name === "target" || attr.name === "rel")) {
          return;
        }
        el.removeAttribute(attr.name);
      });
      if (tag === "a") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
      walk(el);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

/** Sanitize rendered manuscript HTML (markdown + KaTeX). */
export function sanitizeManuscriptHtml(html: string): string {
  if (!html?.trim()) return "";

  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: [
        "span",
        "div",
        "pre",
        "code",
        "h1",
        "h5",
        "h6",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "hr",
      ],
      ADD_ATTR: ["target", "rel", "class", "style", "aria-hidden"],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input"],
    });
  }

  return sanitizeHtml(html);
}

/** Plain text from PDF/DOCX extraction → HTML for the editor. */
export function plainTextToHtml(text: string): string {
  if (!text?.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const escaped = block
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      return `<p>${escaped}</p>`;
    })
    .join("");
}
