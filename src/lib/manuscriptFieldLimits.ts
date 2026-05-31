/** GRE manuscript field word limits (mirrors backend manuscript_limits.py). */

export const MANUSCRIPT_FIELD_WORD_LIMITS = {
  title: 40,
  abstract: 200,
  introduction: 300,
  methods: 300,
  findings: 300,
  conclusion: 200,
  funder: 100,
  keywords: 30,
} as const;

export const REFERENCE_ITEM_LIMIT = 5;

/** Composer group for findings + conclusion (no separate Discussion section). */
export const MANUSCRIPT_FINDINGS_GROUP_TITLE = "Findings & Conclusion";

export type ManuscriptLimitedField = keyof typeof MANUSCRIPT_FIELD_WORD_LIMITS;

export function stripHtmlToText(html: string): string {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function countWords(value: string): number {
  const text = stripHtmlToText(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** Remove trailing ellipsis / continuation dots from summarized GRE fields. */
export function stripContinuationMarkers(value: string): string {
  let text = (value || "").trimEnd();
  if (!text) return "";
  text = text.replace(/(?:…|\.{3,})\s*$/u, "");
  return text.replace(/[ .,;:]+$/u, "").trimEnd();
}

export function truncateToWordLimit(text: string, maxWords: number): string {
  if (maxWords <= 0) return "";
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return stripContinuationMarkers(text.trim());
  return stripContinuationMarkers(words.slice(0, maxWords).join(" "));
}

export function truncateHtmlToWordLimit(html: string, maxWords: number): string {
  const plain = stripHtmlToText(html);
  const truncated = truncateToWordLimit(plain, maxWords);
  if (truncated === plain) return html;
  const escaped = truncated
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped}</p>`;
}

export function formatWordLimitHint(field: ManuscriptLimitedField): string {
  return `Max ${MANUSCRIPT_FIELD_WORD_LIMITS[field]} words`;
}

function splitReferenceItems(text: string): string[] {
  const raw = (text || "").trim();
  if (!raw) return [];

  const items: string[] = [];
  for (const line of raw.split("\n")) {
    const stripped = line.trim();
    if (!stripped) continue;
    const cleaned = stripped.replace(/^\s*(?:\d+[\.\)]|[-*+])\s+/, "").trim();
    if (cleaned) items.push(cleaned);
  }
  if (items.length > 1) return items;

  if (items.length === 1 && /\d+[\.\)]\s+/.test(items[0])) {
    const parts = items[0].split(/(?=\s*\d+[\.\)]\s+)/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.map((p) => p.replace(/^\s*(?:\d+[\.\)]|[-*+])\s+/, "").trim()).filter(Boolean);
    }
  }

  const inlineParts = raw.split(/(?=\s*\d+[\.\)]\s+)/).map((p) => p.trim()).filter(Boolean);
  if (inlineParts.length > 1) {
    return inlineParts.map((p) => p.replace(/^\s*(?:\d+[\.\)]|[-*+])\s+/, "").trim()).filter(Boolean);
  }

  if (items.length > 0) return items;
  return raw
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

/** Trim funder text for the form; name extraction runs on the backend via LLM. */
export function normalizeFunderField(value: string): string {
  return stripContinuationMarkers(value.replace(/\s+/g, " ").trim());
}

/** Up to five key references, always including this paper when a title is set. */
export function limitReferences(
  text: string,
  paperTitle = "",
  maxItems: number = REFERENCE_ITEM_LIMIT
): string {
  const items = splitReferenceItems(stripHtmlToText(text));
  const title = paperTitle.trim();
  if (items.length === 0) {
    return title ? `1. ${title} (this paper)` : "";
  }

  const thisPaper = title ? `${title} (this paper)` : "";
  const normalizedTitle = title.replace(/\s+/g, " ").toLowerCase();

  const external: string[] = [];
  let hasSelf = false;
  for (const item of items) {
    const itemLower = item.replace(/\s+/g, " ").toLowerCase();
    if (normalizedTitle && itemLower.includes(normalizedTitle)) {
      hasSelf = true;
      continue;
    }
    if (/\(this paper\)/i.test(item)) {
      hasSelf = true;
      continue;
    }
    external.push(item);
  }

  const selected: string[] = [];
  const externalCap = Math.max(0, maxItems - (thisPaper || hasSelf ? 1 : 0));
  for (const item of external) {
    if (selected.length >= externalCap) break;
    selected.push(item);
  }

  if (thisPaper && !hasSelf) {
    selected.push(thisPaper);
  } else if (hasSelf) {
    for (const item of items) {
      const itemLower = item.replace(/\s+/g, " ").toLowerCase();
      if (normalizedTitle && itemLower.includes(normalizedTitle)) {
        selected.push(item);
        break;
      }
    }
  }

  const capped = selected.slice(0, maxItems);
  if (capped.length === 0 && title) {
    return `1. ${title} (this paper)`;
  }
  return capped.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export function parseReferenceItems(text: string): string[] {
  return splitReferenceItems(stripHtmlToText(text));
}
