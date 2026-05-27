/** GRE manuscript field word limits (mirrors backend manuscript_limits.py). */

export const MANUSCRIPT_FIELD_WORD_LIMITS = {
  title: 40,
  abstract: 200,
  introduction: 300,
  methods: 300,
  results: 250,
  findings: 300,
  conclusion: 200,
  funder: 100,
  keywords: 30,
} as const;

export const REFERENCE_ITEM_LIMIT = 5;

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

export function truncateToWordLimit(text: string, maxWords: number): string {
  if (maxWords <= 0) return "";
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
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
