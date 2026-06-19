import type { ReactNode } from "react";
import type { ResearcherRanking } from "../../types";
import { institutionStarsFromPublicationCount } from "../../lib/greStars";
import { researcherGreRankEligible, researcherRankStars } from "../../lib/publicationAuthors";
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
  /** When false, hides GRE stars and badges (unlinked co-authors). */
  registered?: boolean;
}

export function resolveRankStars(
  ranking?: ResearcherRanking | null,
  institutionPublicationCount?: number,
  starsOverride?: number
): number {
  if (starsOverride != null && starsOverride > 0) {
    return starsOverride;
  }
  if (ranking) {
    return researcherRankStars(ranking, true);
  }
  if (institutionPublicationCount != null && institutionPublicationCount > 0) {
    return institutionStarsFromPublicationCount(institutionPublicationCount);
  }
  return 0;
}

/** GRE rank stars inline after a person or institution name. */
export function RankedNameLabel({
  name,
  nameClassName = "",
  ranking,
  stars: starsOverride,
  institutionPublicationCount,
  compact = false,
  showBadges = true,
  registered,
}: Props) {
  const canShowResearcherRank = researcherGreRankEligible(ranking, registered);
  const eligibleRanking = canShowResearcherRank ? ranking : null;
  const stars = resolveRankStars(
    eligibleRanking,
    institutionPublicationCount,
    canShowResearcherRank ? starsOverride : undefined
  );
  const badges = canShowResearcherRank ? ranking?.badges ?? [] : [];

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
      <span className={`min-w-0 ${nameClassName}`}>{name}</span>
      {stars > 0 && (
        <span
          className="inline-flex shrink-0 items-center"
          title={`${stars} GRE rank star${stars === 1 ? "" : "s"} (10+ published papers each)`}
        >
          <StarRating stars={stars} size={compact ? "sm" : "md"} showCount={false} />
        </span>
      )}
      {showBadges && badges.length > 0 && (
        <ResearcherBadges badges={badges} compact={compact} />
      )}
    </span>
  );
}
