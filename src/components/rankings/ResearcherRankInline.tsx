import type { ResearcherRanking } from "../../types";
import { ResearcherBadges } from "./ResearcherBadges";
import { StarRating } from "./StarRating";

interface Props {
  ranking?: ResearcherRanking | null;
  compact?: boolean;
  showBadges?: boolean;
}

export function ResearcherRankInline({
  ranking,
  compact = false,
  showBadges = true,
}: Props) {
  if (!ranking || (ranking.stars <= 0 && !ranking.badges?.length)) {
    return null;
  }

  return (
    <span
      className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"}`}
    >
      {ranking.stars > 0 && (
        <StarRating stars={ranking.stars} size={compact ? "sm" : "md"} showCount={!compact} />
      )}
      {showBadges && <ResearcherBadges badges={ranking.badges} compact={compact} />}
    </span>
  );
}
