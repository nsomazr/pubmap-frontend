import type { CoAuthorPerson, Publication, PublicationCoAuthors, ResearcherRanking } from "../types";

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
    const nameKey = authorNameKey(name);
    const email = normalizeAffiliation(
      "email" in person ? String((person as { email?: string }).email || "") : ""
    );
    const affiliation = normalizeAffiliation(
      "affiliation" in person ? String((person as { affiliation?: string }).affiliation || "") : ""
    );
    const key = userId
      ? `uid:${userId}|name:${nameKey}`
      : email
        ? `email:${email}|name:${nameKey}`
        : `name:${nameKey}|aff:${affiliation}`;
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
    affiliation:
      author?.affiliation ||
      publication.coordinates?.institution ||
      "",
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
    ranking: (person as CoAuthorPerson).ranking,
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

/** Full author team (lead + co-authors), deduped. */
export function publicationAuthorTeam(publication: Publication): CoAuthorPerson[] {
  const coAuthors = publication.co_authors ?? publicationCoAuthorsFromPublication(publication);
  return coAuthors.team;
}

/** GRE rank for a team member on a publication (never the lead author's rank by mistake). */
export function rankingForPublicationTeamMember(
  publication: Publication,
  opts: { userId?: number | null; name?: string }
): ResearcherRanking | undefined {
  const team = publication.co_authors ?? publicationCoAuthorsFromPublication(publication);
  const nameKey = opts.name ? authorNameKey(opts.name) : "";
  for (const person of team.team) {
    if (opts.userId != null && person.user_id === opts.userId) {
      return person.ranking ?? undefined;
    }
    const personName = (person.fullname || "").trim();
    if (nameKey && personName && authorNameKey(personName) === nameKey) {
      return person.ranking ?? undefined;
    }
  }
  if (opts.userId != null && publication.author?.id === opts.userId) {
    return publication.author.ranking ?? undefined;
  }
  return undefined;
}

/** Resolve researcher stars from API ranking only (10 published GRE papers per star). */
export function researcherRankStars(ranking?: ResearcherRanking | null): number {
  if (!ranking) return 0;
  if (typeof ranking.stars === "number" && ranking.stars > 0) {
    return ranking.stars;
  }
  if (typeof ranking.published_count === "number" && ranking.published_count >= 10) {
    return Math.floor(ranking.published_count / 10);
  }
  return 0;
}

/** Compact comma-separated author line for map cards and list rows. */
export function compactAuthorLineFromPublication(
  publication: Publication,
  maxAuthors = 3
): string {
  const byline = authorBylineFromPublication(publication);
  const names = byline.authors.map((author) => author.name).filter(Boolean);
  if (!names.length) return "";
  if (names.length <= maxAuthors) return names.join(", ");
  const shown = names.slice(0, maxAuthors);
  const extra = names.length - maxAuthors;
  return `${shown.join(", ")}, et al. (+${extra})`;
}

/** Build a journal-style byline when only a single author name is available. */
export function authorBylineFromNames(
  authorName?: string,
  affiliation?: string
): AuthorByline | undefined {
  const name = (authorName || "").trim();
  if (!name) return undefined;
  return buildAuthorByline([{ fullname: name, affiliation: affiliation || "" }]);
}

export function resolvePaperHeaderByline(
  authorByline?: AuthorByline,
  fallback?: { authorName?: string; affiliation?: string }
): AuthorByline | undefined {
  if (authorByline?.authors?.length) return authorByline;
  return authorBylineFromNames(fallback?.authorName, fallback?.affiliation);
}
