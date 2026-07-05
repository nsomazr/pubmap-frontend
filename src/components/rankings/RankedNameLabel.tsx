import type { ReactNode } from "react";
import type { ResearcherRanking } from "../../types";
import { INSTITUTION_PUBS_PER_STAR, RESEARCHER_PUBS_PER_STAR } from "../../lib/greStars";
import { researcherGreRankEligible, researcherRankStars } from "../../lib/publicationAuthors";
import { ResearcherBadges } from "./ResearcherBadges";
import { StarRating } from "./StarRating";

interface Props {
  name: ReactNode;
  nameClassName?: string;
  ranking?: ResearcherRanking | null;
  /** Precomputed star count (institution rankings or researcher leaderboard). */
  stars?: number;
  compact?: boolean;
  showBadges?: boolean;
  /** When false, hides GRE stars and badges (unlinked co-authors). */
  registered?: boolean;
}

export function resolveRankStars(
  ranking?: ResearcherRanking | null,
  starsOverride?: number,
  registered?: boolean
): number {
  if (starsOverride != null && starsOverride > 0) {
    return starsOverride;
  }
  if (ranking && researcherGreRankEligible(ranking, registered)) {
    return researcherRankStars(ranking, registered);
  }
  return 0;
}

/** GRE rank stars inline after a person or institution name. */
export function RankedNameLabel({
  name,
  nameClassName = "",
  ranking,
  stars: starsOverride,
  compact = false,
  showBadges = true,
  registered,
}: Props) {
  const canShowResearcherRank = researcherGreRankEligible(ranking, registered);
  const eligibleRanking = canShowResearcherRank ? ranking : null;
  const stars = resolveRankStars(eligibleRanking, starsOverride, registered);
  const badges = canShowResearcherRank ? ranking?.badges ?? [] : [];
  const institutionStars = starsOverride != null && starsOverride > 0 && !canShowResearcherRank;
  const starTitle = institutionStars
    ? `${stars} GRE rank star${stars === 1 ? "" : "s"} (${INSTITUTION_PUBS_PER_STAR}+ published papers each)`
    : `${stars} GRE rank star${stars === 1 ? "" : "s"} (${RESEARCHER_PUBS_PER_STAR}+ published papers each)`;

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
      <span className={`min-w-0 ${nameClassName}`}>{name}</span>
      {stars > 0 && (
        <span className="inline-flex shrink-0 items-center" title={starTitle}>
          <StarRating stars={stars} size={compact ? "sm" : "md"} showCount={false} />
        </span>
      )}
      {showBadges && badges.length > 0 && (
        <ResearcherBadges badges={badges} compact={compact} />
      )}
    </span>
  );
}
