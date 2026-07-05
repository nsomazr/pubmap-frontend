import type { Publication } from "../types";

export type YearCount = { year: number; count: number };
export type NamedCount = { name: string; publication_count: number };

export function publicationsByYearFromList(publications: Publication[]): YearCount[] {
  const counts = new Map<number, number>();
  for (const pub of publications) {
    if (!pub.created_at) continue;
    const year = new Date(pub.created_at).getFullYear();
    if (!year || year < 1970) continue;
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }));
}

export function leadingSubfieldFromPublications(publications: Publication[]): NamedCount {
  const counts = new Map<string, number>();
  for (const pub of publications) {
    const name = (pub.subfield_name || pub.sub_category_name || "").trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (!top) return { name: "", publication_count: 0 };
  return { name: top[0], publication_count: top[1] };
}

export function leadingFieldFromPublications(publications: Publication[]): NamedCount {
  const counts = new Map<string, number>();
  for (const pub of publications) {
    const name = (pub.field_name || "").trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (!top) return { name: "", publication_count: 0 };
  return { name: top[0], publication_count: top[1] };
}

export function sumDiscussions(publications: Publication[]): number {
  return publications.reduce((sum, pub) => sum + (pub.discussions_count ?? 0), 0);
}

export function sumResponses(publications: Publication[]): number {
  return publications.reduce((sum, pub) => sum + (pub.responses_count ?? 0), 0);
}

export function topPublicationsFromList(
  publications: Publication[],
  limit = 5
): Publication[] {
  return [...publications]
    .sort((a, b) => {
      const scoreA =
        a.score ??
        (a.discussions_count ?? 0) + (a.responses_count ?? 0) + (a.views_count ?? 0);
      const scoreB =
        b.score ??
        (b.discussions_count ?? 0) + (b.responses_count ?? 0) + (b.views_count ?? 0);
      return scoreB - scoreA || b.id - a.id;
    })
    .slice(0, limit);
}

export type LocationInsights = {
  label: string;
  totalPublications: number;
  totalResearchers: number;
  totalInstitutions: number;
  totalDiscussions: number;
  totalResponses: number;
  leadingField: NamedCount;
  leadingSubfield: NamedCount;
  leadingResearchers: { name: string; user_id?: number | null; publication_count: number }[];
  publicationsByYear: YearCount[];
};

export function collectLocationInsights(
  publications: Publication[],
  query: string
): LocationInsights | null {
  if (!publications.length) return null;

  const researcherIds = new Set<number>();
  const researcherNames = new Set<string>();
  const researcherPubCounts = new Map<number, number>();
  const researcherNameCounts = new Map<string, number>();
  const institutions = new Set<string>();

  for (const pub of publications) {
    const institution = (pub.coordinates?.institution || pub.author?.affiliation || "").trim();
    if (institution) institutions.add(institution.toLowerCase());

    if (pub.author?.id) {
      researcherIds.add(pub.author.id);
      researcherPubCounts.set(
        pub.author.id,
        (researcherPubCounts.get(pub.author.id) ?? 0) + 1
      );
    }
    const authorName = [
      pub.author?.firstname,
      pub.author?.middlename,
      pub.author?.lastname,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (authorName) {
      researcherNames.add(authorName.toLowerCase());
      researcherNameCounts.set(
        authorName.toLowerCase(),
        (researcherNameCounts.get(authorName.toLowerCase()) ?? 0) + 1
      );
    }
  }

  let leadingResearchers: {
    name: string;
    user_id?: number | null;
    publication_count: number;
  }[] = [...researcherPubCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([userId, publication_count]) => {
      const pub = publications.find((row) => row.author?.id === userId);
      const name = pub?.author
        ? [pub.author.firstname, pub.author.middlename, pub.author.lastname]
            .filter(Boolean)
            .join(" ")
            .trim()
        : `Researcher #${userId}`;
      return { name: name || `Researcher #${userId}`, user_id: userId, publication_count };
    });

  if (leadingResearchers.length === 0) {
    leadingResearchers = [...researcherNameCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, publication_count]) => ({
        name: name
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        user_id: null,
        publication_count,
      }));
  }

  return {
    label: query.trim() || "Selected region",
    totalPublications: publications.length,
    totalResearchers: researcherIds.size || researcherNames.size,
    totalInstitutions: institutions.size,
    totalDiscussions: sumDiscussions(publications),
    totalResponses: sumResponses(publications),
    leadingField: leadingFieldFromPublications(publications),
    leadingSubfield: leadingSubfieldFromPublications(publications),
    leadingResearchers,
    publicationsByYear: publicationsByYearFromList(publications),
  };
}
