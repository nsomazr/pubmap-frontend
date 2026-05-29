import type { ReactNode } from "react";
import type { ResearcherRanking } from "../../types";
import { institutionStarsFromPublicationCount, researcherStarsFromPublishedCount } from "../../lib/greStars";
import { ResearcherBadges } from "./ResearcherBadges";
import { StarRating } from "./StarRating";

interface Props {
  name: ReactNode;
  nameClassName?: string;
  ranking?: ResearcherRanking | null;
  /** Precomputed star count (institution or researcher). */
  stars?: number;
  /** Institution stars when `ranking` / `stars` are absent. */
  institutionPublicationCount?: number;
  compact?: boolean;
  showBadges?: boolean;
}

export function resolveRankStars(
  ranking?: ResearcherRanking | null,
  institutionPublicationCount?: number,
  starsOverride?: number
): number {
  if (starsOverride != null && starsOverride > 0) {
    return starsOverride;
  }
  if (ranking && ranking.stars > 0) {
    return ranking.stars;
  }
  if (ranking?.published_count != null && ranking.published_count > 0) {
    const derived = researcherStarsFromPublishedCount(ranking.published_count);
    if (derived > 0) return derived;
  }
  if (institutionPublicationCount != null && institutionPublicationCount > 0) {
    return institutionStarsFromPublicationCount(institutionPublicationCount);
  }
  return 0;
}

/** GRE rank stars immediately before a person or institution name. */
export function RankedNameLabel({
  name,
  nameClassName = "",
  ranking,
  stars: starsOverride,
  institutionPublicationCount,
  compact = false,
  showBadges = true,
}: Props) {
  const stars = resolveRankStars(ranking, institutionPublicationCount, starsOverride);
  const badges = ranking?.badges ?? [];

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
      {stars > 0 && (
        <StarRating stars={stars} size={compact ? "sm" : "md"} showCount={false} />
      )}
      <span className={`min-w-0 ${nameClassName}`}>{name}</span>
      {showBadges && badges.length > 0 && (
        <ResearcherBadges badges={badges} compact={compact} />
      )}
    </span>
  );
}
