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

/** Matches backend — safety margin below hard cap. */
export const LLM_WORD_LIMIT_BUFFER = 20;

/** Matches backend LLM_WORD_TARGET_RATIO — preferred summary length. */
export const LLM_WORD_TARGET_RATIO = 0.75;

export const NARRATIVE_MANUSCRIPT_FIELDS = [
  "abstract",
  "introduction",
  "methods",
  "findings",
  "conclusion",
] as const;

export const REFERENCE_ITEM_LIMIT = 5;

export function externalWordLimit(field: ManuscriptLimitedField): number {
  return MANUSCRIPT_FIELD_WORD_LIMITS[field];
}

export function llmWordTarget(field: ManuscriptLimitedField): number {
  const external = externalWordLimit(field);
  const desired = Math.max(12, Math.round(external * LLM_WORD_TARGET_RATIO));
  const ceiling = Math.max(12, external - LLM_WORD_LIMIT_BUFFER);
  return Math.min(desired, ceiling);
}

export function llmWordTargetFloor(field: ManuscriptLimitedField): number {
  const external = externalWordLimit(field);
  return Math.max(12, Math.round(external * 0.55));
}

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

/** Strip [1], [2,3] and trailing footnote digits (mirrors backend). */
export function stripInlineCitations(text: string): string {
  let value = (text || "").trim();
  if (!value) return "";
  value = value.replace(/\[\s*\d+(?:\s*[,;\-–—]\s*\d+)*\s*\]/g, "");
  value = value.replace(/\(\s*(?:see|cf\.|e\.g\.|ref\.)\s+[^)]{0,120}\)/gi, "");
  value = value.replace(/\s+([.,;:!?])/g, "$1");
  return value.replace(/\s+/g, " ").trim();
}

function polishNarrativeEnding(text: string): string {
  let value = stripInlineCitations(stripContinuationMarkers(text.trim()));
  if (!value) return "";
  value = value.replace(/([.!?]["'”\])]?)\s+\d{1,3}\s*$/, "$1");
  if (/\s\d{1,3}\s*$/.test(value) && !/\s\d{4}\s*$/.test(value)) {
    value = value.replace(/\s+\d{1,3}\s*$/, "").trimEnd();
  }
  if (!/[.!?]$/.test(value)) {
    for (const punct of [". ", "! ", "? "]) {
      const idx = value.lastIndexOf(punct);
      if (idx >= value.length * 0.35) {
        value = value.slice(0, idx + 1).trim();
        break;
      }
    }
  }
  if (value && !/[.!?]$/.test(value)) {
    value = `${value.replace(/[.,;:-]+$/, "")}.`;
  }
  return value;
}

function finishSentence(text: string): string {
  return polishNarrativeEnding(text);
}

/** Prefer ending at the last complete sentence within the word cap (mirrors backend). */
export function truncateToWordLimitAtSentence(text: string, maxWords: number): string {
  if (maxWords <= 0) return "";
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return finishSentence(text.trim());

  const hard = words.slice(0, maxWords).join(" ");
  const minWords = Math.max(12, Math.floor(maxWords * 0.55));
  const sentenceEnd = /[.!?](?:["'”)\]]?)(?=\s|$)/g;
  let best = "";
  let match: RegExpExecArray | null;
  while ((match = sentenceEnd.exec(hard)) !== null) {
    const candidate = hard.slice(0, match.index + match[0].length).trim();
    if (candidate.split(/\s+/).filter(Boolean).length >= minWords) {
      best = candidate;
    }
  }
  if (best) return finishSentence(best);

  for (const punct of [". ", "! ", "? "]) {
    const idx = hard.lastIndexOf(punct);
    if (idx >= 0) {
      const candidate = hard.slice(0, idx + 1);
      if (candidate.split(/\s+/).filter(Boolean).length >= minWords) {
        return finishSentence(candidate);
      }
    }
  }
  return finishSentence(hard);
}

export function truncateToWordLimit(text: string, maxWords: number): string {
  if (maxWords <= 0) return "";
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return stripContinuationMarkers(text.trim());
  return stripContinuationMarkers(words.slice(0, maxWords).join(" "));
}

export function truncateManuscriptField(
  field: ManuscriptLimitedField,
  text: string
): string {
  const external = externalWordLimit(field);
  if (NARRATIVE_MANUSCRIPT_FIELDS.includes(field as (typeof NARRATIVE_MANUSCRIPT_FIELDS)[number])) {
    return truncateToWordLimitAtSentence(text, external);
  }
  return truncateToWordLimit(text, external);
}

function plainToTruncatedHtml(plain: string, truncated: string, html: string): string {
  if (truncated === plain) return html;
  const escaped = truncated
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped}</p>`;
}

export function truncateHtmlToWordLimit(html: string, maxWords: number): string {
  const plain = stripHtmlToText(html);
  return plainToTruncatedHtml(plain, truncateToWordLimit(plain, maxWords), html);
}

export function truncateHtmlToWordLimitAtSentence(html: string, maxWords: number): string {
  const plain = stripHtmlToText(html);
  return plainToTruncatedHtml(plain, truncateToWordLimitAtSentence(plain, maxWords), html);
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
