import type { ResearcherRanking } from "../../types";
import { RankedNameLabel } from "./RankedNameLabel";
import { ResearcherBadges } from "./ResearcherBadges";
import { StarRating } from "./StarRating";

interface Props {
  ranking?: ResearcherRanking | null;
  compact?: boolean;
  showBadges?: boolean;
  /** When set, renders stars (and optional badges) before this label. */
  name?: string;
  nameClassName?: string;
}

export function ResearcherRankInline({
  ranking,
  compact = false,
  showBadges = true,
  name,
  nameClassName,
}: Props) {
  if (!ranking || (ranking.stars <= 0 && !ranking.badges?.length)) {
    return null;
  }

  if (name) {
    return (
      <RankedNameLabel
        name={name}
        nameClassName={nameClassName}
        ranking={ranking}
        compact={compact}
        showBadges={showBadges}
      />
    );
  }

  return (
    <span
      className={`inline-flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"}`}
    >
      {ranking.stars > 0 && (
        <StarRating stars={ranking.stars} size={compact ? "sm" : "md"} showCount={!compact} />
      )}
      {showBadges && <ResearcherBadges badges={ranking.badges} compact={compact} />}
    </span>
  );
}
