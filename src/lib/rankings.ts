import type { InstitutionRankingSort, ResearcherBadge, ResearcherRankingSort } from "../types";

export const INSTITUTION_SORT_OPTIONS: {
  value: InstitutionRankingSort;
  label: string;
  description: string;
}[] = [
  {
    value: "publications",
    label: "Highest publications",
    description:
      "Institutions ranked by the total number of published studies linked to them on GRE (author affiliation, collaborator affiliation, or map location).",
  },
  {
    value: "researchers",
    label: "Most active researchers",
    description:
      "Institutions with the most distinct lead authors who have at least one published study on GRE, not comment or login activity.",
  },
  {
    value: "discussions",
    label: "Most discussed papers",
    description:
      "Institutions whose linked publications received the most discussion threads and replies combined.",
  },
  {
    value: "growth",
    label: "Fastest growing",
    description:
      "Institutions whose number of new publications grew the most: compares studies published in the last 90 days with the previous 90 days.",
  },
];

export const RESEARCHER_SORT_OPTIONS: {
  value: ResearcherRankingSort;
  label: string;
  description: string;
}[] = [
  {
    value: "publications",
    label: "Most publications",
    description: "Authors ranked by how many of their studies are published on the GRE map.",
  },
  {
    value: "stars",
    label: "Highest stars",
    description: "Authors with the most GRE stars (1 star for every 10 published studies).",
  },
  {
    value: "discussions",
    label: "Most discussed",
    description:
      "Authors whose publications received the most comments and replies from the GRE community.",
  },
];

export function institutionSortDescription(sort: InstitutionRankingSort): string {
  return INSTITUTION_SORT_OPTIONS.find((row) => row.value === sort)?.description ?? "";
}

export function researcherSortDescription(sort: ResearcherRankingSort): string {
  return RESEARCHER_SORT_OPTIONS.find((row) => row.value === sort)?.description ?? "";
}

export const BADGE_LABELS: Record<ResearcherBadge, string> = {
  verified_researcher: "Verified Researcher",
  top_contributor: "Top Contributor",
  highly_discussed: "Highly Discussed Author",
  rising_researcher: "Rising Researcher",
};

export const INSTITUTION_PUBS_PER_STAR = 5000;
export const RESEARCHER_PUBS_PER_STAR = 10;
