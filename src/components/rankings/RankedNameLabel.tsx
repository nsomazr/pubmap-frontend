import type { ReactNode } from "react";
import type { ResearcherRanking } from "../../types";
import { institutionStarsFromPublicationCount } from "../../lib/greStars";
import { researcherRankStars } from "../../lib/publicationAuthors";
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
  if (ranking) {
    return researcherRankStars(ranking);
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
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/90 px-1.5 py-0.5 shadow-sm ring-1 ring-amber-300/90"
          title={`${stars} GRE rank star${stars === 1 ? "" : "s"} (10+ published papers each)`}
        >
          <StarRating stars={stars} size={compact ? "sm" : "md"} showCount={false} />
          <span className="text-[10px] font-extrabold tabular-nums leading-none text-amber-900">
            {stars}
          </span>
        </span>
      )}
      <span className={`min-w-0 ${nameClassName}`}>{name}</span>
      {showBadges && badges.length > 0 && (
        <ResearcherBadges badges={badges} compact={compact} />
      )}
    </span>
  );
}
