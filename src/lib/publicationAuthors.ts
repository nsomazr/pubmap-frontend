import type { CoAuthorPerson, Publication, PublicationCoAuthors } from "../types";

export type AuthorBylineEntry = {
  name: string;
  affiliationIndices: number[];
  profileUrl?: string | null;
};

export type AuthorByline = {
  authors: AuthorBylineEntry[];
  affiliations: { index: number; label: string }[];
};

function normalizeAffiliation(value?: string | null): string {
  return (value || "").trim().replace(/\s+/g, " ");
}

function parseAffiliationParts(raw?: string | null): string[] {
  const text = (raw || "").trim();
  if (!text) return [];
  return text
    .split(/[\n;|]+/)
    .map((part) => normalizeAffiliation(part))
    .filter(Boolean);
}

function authorNameKey(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join("|");
}

function dedupeAuthorTeam<
  T extends { fullname?: string; user_id?: number | null; kind?: string },
>(team: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const person of team) {
    const name = (person.fullname || "").trim();
    if (!name) continue;

    const userId = person.user_id;
    const key = userId ? `uid:${userId}` : `name:${authorNameKey(name)}`;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(person);
  }

  return result;
}

function compactByline(byline: AuthorByline): AuthorByline {
  const usedIndices = new Set(byline.authors.flatMap((author) => author.affiliationIndices));
  const keptAffiliations = byline.affiliations.filter(
    (aff) => aff.label.trim() && usedIndices.has(aff.index)
  );
  const remap = new Map(keptAffiliations.map((aff, index) => [aff.index, index + 1]));

  return {
    authors: byline.authors.map((author) => ({
      ...author,
      affiliationIndices: [...new Set(author.affiliationIndices)]
        .filter((idx) => remap.has(idx))
        .map((idx) => remap.get(idx)!)
        .sort((a, b) => a - b),
    })),
    affiliations: keptAffiliations.map((aff, index) => ({
      index: index + 1,
      label: aff.label.trim(),
    })),
  };
}

export function publicationCoAuthorsFromPublication(publication: Publication): PublicationCoAuthors {
  const author = publication.author;
  const primary: CoAuthorPerson = {
    kind: "primary",
    user_id: author?.id ?? null,
    fullname:
      author?.full_name ||
      `${author?.firstname ?? ""} ${author?.lastname ?? ""}`.trim() ||
      "Lead author",
    affiliation: author?.affiliation || "",
    email: author?.email,
    role: "Lead author",
    photo: author?.photo,
    profile_url: author?.id ? `/researcher/${author.id}` : null,
    institution_map_url: author?.affiliation
      ? `/?affiliation=${encodeURIComponent(author.affiliation)}`
      : "/",
    is_registered: Boolean(author?.id),
    ranking: author?.ranking,
  };
  const coAuthors: CoAuthorPerson[] = (publication.collaborators || []).map((person) => ({
    ...person,
    kind: "coauthor",
    role: person.role || "Co-author",
  }));
  return {
    primary_author: primary,
    co_authors: coAuthors,
    team: dedupeAuthorTeam([primary, ...coAuthors]),
    total_authors: dedupeAuthorTeam([primary, ...coAuthors]).length,
  };
}

export function buildAuthorByline(
  team: Array<{
    fullname?: string;
    affiliation?: string | null;
    profile_url?: string | null;
    user_id?: number | null;
    kind?: string;
  }>
): AuthorByline {
  const affiliations: { index: number; label: string }[] = [];
  const affiliationIndex = new Map<string, number>();

  const indexForAffiliation = (raw?: string | null): number[] => {
    const parts = parseAffiliationParts(raw);
    if (!parts.length) return [];

    const indices: number[] = [];
    for (const label of parts) {
      const key = label.toLowerCase();
      let idx = affiliationIndex.get(key);
      if (!idx) {
        idx = affiliations.length + 1;
        affiliationIndex.set(key, idx);
        affiliations.push({ index: idx, label });
      }
      indices.push(idx);
    }
    return [...new Set(indices)].sort((a, b) => a - b);
  };

  const authors: AuthorBylineEntry[] = dedupeAuthorTeam(team)
    .map((person) => {
      const name = (person.fullname || "").trim();
      if (!name) return null;
      return {
        name,
        affiliationIndices: indexForAffiliation(person.affiliation),
        profileUrl:
          person.profile_url || (person.user_id ? `/researcher/${person.user_id}` : null),
      };
    })
    .filter(Boolean) as AuthorBylineEntry[];

  return compactByline({ authors, affiliations });
}

export function authorBylineFromPublication(publication: Publication): AuthorByline {
  const coAuthors = publication.co_authors ?? publicationCoAuthorsFromPublication(publication);
  return buildAuthorByline(coAuthors.team);
}
