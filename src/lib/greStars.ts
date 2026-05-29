/** Match backend `core.rankings` star thresholds. */
export const INSTITUTION_PUBS_PER_STAR = 5000;
export const RESEARCHER_PUBS_PER_STAR = 10;

export function institutionStarsFromPublicationCount(publicationCount: number): number {
  return Math.max(0, Math.floor(publicationCount / INSTITUTION_PUBS_PER_STAR));
}

export function researcherStarsFromPublishedCount(publishedCount: number): number {
  return Math.max(0, Math.floor(publishedCount / RESEARCHER_PUBS_PER_STAR));
}
