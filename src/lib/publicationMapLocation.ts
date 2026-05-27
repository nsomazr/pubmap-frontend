import type { Publication } from "../types";

/** Geographic study location only (no institution or study-area label). */
export function publicationMapLocationLabel(
  pub: Pick<Publication, "coordinates"> | null | undefined
): string | undefined {
  const location = pub?.coordinates?.location?.trim();
  return location || undefined;
}
