import type { InstitutionRankingSort, ResearcherBadge, ResearcherRankingSort } from "../types";

export const INSTITUTION_SORT_OPTIONS: { value: InstitutionRankingSort; label: string }[] = [
  { value: "publications", label: "Highest publications" },
  { value: "researchers", label: "Most active researchers" },
  { value: "discussions", label: "Most discussed papers" },
  { value: "growth", label: "Fastest growing" },
];

export const RESEARCHER_SORT_OPTIONS: { value: ResearcherRankingSort; label: string }[] = [
  { value: "publications", label: "Most publications" },
  { value: "stars", label: "Highest stars" },
  { value: "discussions", label: "Most discussed" },
];

export const BADGE_LABELS: Record<ResearcherBadge, string> = {
  verified_researcher: "Verified Researcher",
  top_contributor: "Top Contributor",
  highly_discussed: "Highly Discussed Author",
  rising_researcher: "Rising Researcher",
};

export const INSTITUTION_PUBS_PER_STAR = 5000;
export const RESEARCHER_PUBS_PER_STAR = 10;
