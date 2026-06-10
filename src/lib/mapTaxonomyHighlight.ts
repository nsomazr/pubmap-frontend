import type { Publication } from "../types";

export type MapTaxonomyHighlightKind = "field" | "subfield";

export type MapTaxonomyHighlight = {
  kind: MapTaxonomyHighlightKind;
  name: string;
};

export function normalizeTaxonomyName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function publicationFieldName(pub: Publication): string {
  return (pub.field_name || "").trim();
}

export function publicationSubfieldName(pub: Publication): string {
  return (pub.subfield_name || pub.sub_category_name || "").trim();
}

export function publicationMatchesTaxonomyHighlight(
  pub: Publication,
  highlight: MapTaxonomyHighlight | null | undefined
): boolean {
  if (!highlight?.name?.trim()) return false;
  const target = normalizeTaxonomyName(highlight.name);
  if (highlight.kind === "field") {
    const field = publicationFieldName(pub);
    return Boolean(field) && normalizeTaxonomyName(field) === target;
  }
  const subfield = publicationSubfieldName(pub);
  return Boolean(subfield) && normalizeTaxonomyName(subfield) === target;
}

export function publicationIdsForTaxonomyHighlight(
  publications: Publication[],
  highlight: MapTaxonomyHighlight | null | undefined
): number[] {
  if (!highlight?.name?.trim()) return [];
  return publications
    .filter((pub) => publicationMatchesTaxonomyHighlight(pub, highlight))
    .map((pub) => pub.id);
}

export function isTaxonomyHighlightActive(
  highlight: MapTaxonomyHighlight | null | undefined,
  kind: MapTaxonomyHighlightKind,
  name: string
): boolean {
  if (!highlight?.name?.trim() || !name.trim()) return false;
  return (
    highlight.kind === kind &&
    normalizeTaxonomyName(highlight.name) === normalizeTaxonomyName(name)
  );
}

export function toggleTaxonomyHighlight(
  current: MapTaxonomyHighlight | null,
  next: MapTaxonomyHighlight
): MapTaxonomyHighlight | null {
  if (isTaxonomyHighlightActive(current, next.kind, next.name)) {
    return null;
  }
  return next;
}
