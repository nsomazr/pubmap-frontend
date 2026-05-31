import type { Publication } from "../types";

/** Geographic study location only (map pin label; not institution). */
export function publicationMapLocationLabel(
  pub: Pick<Publication, "coordinates"> | null | undefined
): string | undefined {
  const location = pub?.coordinates?.location?.trim();
  return location || undefined;
}

/** Institution or affiliation shown on Research Assistant and paper context. */
export function publicationResearchInstitutionLabel(
  pub: Pick<Publication, "coordinates" | "author" | "co_authors"> | null | undefined
): string | undefined {
  const institution = pub?.coordinates?.institution?.trim();
  if (institution) return institution;
  const leadAffiliation = pub?.co_authors?.primary_author?.affiliation?.trim();
  if (leadAffiliation) return leadAffiliation;
  const authorAffiliation = pub?.author?.affiliation?.trim();
  return authorAffiliation || undefined;
}
