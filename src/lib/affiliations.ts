/** Canonical separator for multiple affiliations in a single DB field. */
export const AFFILIATION_FIELD_SEPARATOR = "; ";

const AFFILIATION_SPLIT_RE = /[\n;|]+/;

export function normalizeAffiliationPart(value?: string | null): string {
  return (value || "").trim().replace(/\s+/g, " ");
}

/** Split a stored affiliation field into distinct institutions. */
export function parseAffiliationList(raw?: string | null): string[] {
  const text = (raw || "").trim();
  if (!text) return [];

  const seen = new Set<string>();
  const parts: string[] = [];
  for (const piece of text.split(AFFILIATION_SPLIT_RE)) {
    const label = normalizeAffiliationPart(piece);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(label);
  }
  return parts;
}

/** Serialize institution labels for API / database storage. */
export function serializeAffiliationList(parts: string[]): string {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const part of parts) {
    const label = normalizeAffiliationPart(part);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(label);
  }
  return cleaned.join(AFFILIATION_FIELD_SEPARATOR);
}

/** Short inline display (cards, lists). */
export function formatAffiliationInline(raw?: string | null): string {
  return parseAffiliationList(raw).join(" · ");
}
