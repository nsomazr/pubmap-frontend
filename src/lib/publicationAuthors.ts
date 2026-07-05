import type { CoAuthorPerson, Publication, PublicationCoAuthors, ResearcherRanking } from "../types";
import { normalizeAffiliationPart, parseAffiliationList } from "./affiliations";
import { RESEARCHER_PUBS_PER_STAR, researcherStarsFromPublishedCount } from "./greStars";

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
  return normalizeAffiliationPart(value);
}

function parseAffiliationParts(raw?: string | null): string[] {
  return parseAffiliationList(raw);
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
  const coAuthors: CoAuthorPerson[] = (publication.collaborators || []).map((person) => {
    const row = person as CoAuthorPerson;
    const registered = isRegisteredGreResearcher(row);
    return {
      ...row,
      kind: "coauthor",
      role: row.role || "Co-author",
      is_registered: registered,
      ranking: registered ? row.ranking : undefined,
      user_id: registered ? row.user_id : null,
    };
  });
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

export type AuthorSearchEntry = {
  name: string;
  userId?: number | null;
  affiliation?: string;
  photo?: string;
};

/** All searchable author names on a publication (lead + every co-author). */
export function publicationAuthorSearchEntries(publication: Publication): AuthorSearchEntry[] {
  return publicationAuthorTeam(publication)
    .map((person) => ({
      name: (person.fullname || "").trim(),
      userId: person.user_id ?? null,
      affiliation: person.affiliation || "",
      photo: person.photo,
    }))
    .filter((entry) => entry.name.length > 0);
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
      return person.user_id ? person.ranking ?? undefined : undefined;
    }
    const personName = (person.fullname || "").trim();
    if (
      nameKey &&
      personName &&
      authorNameKey(personName) === nameKey &&
      person.user_id
    ) {
      return person.ranking ?? undefined;
    }
  }
  if (opts.userId != null && publication.author?.id === opts.userId) {
    return publication.author.ranking ?? undefined;
  }
  return undefined;
}

/** True when a co-author row is linked to a GRE user account. */
export function isRegisteredGreResearcher(person: {
  user_id?: number | null;
  is_registered?: boolean;
}): boolean {
  return Boolean(person.is_registered ?? person.user_id);
}

type DiscussionParticipant = {
  id?: number;
  firstname?: string;
  lastname?: string;
  full_name?: string;
  email?: string;
};

function normalizeDiscussionAuthorRole(
  role?: string | null,
  kind?: CoAuthorPerson["kind"]
): string {
  const value = (role || "").trim();
  if (/^lead/i.test(value) || kind === "primary") return "Lead author";
  if (/^co-?author/i.test(value) || kind === "coauthor") return "Co-author";
  if (value) return value;
  return kind === "primary" ? "Lead author" : "Co-author";
}

function discussionParticipantNameKey(user?: DiscussionParticipant): string {
  if (!user) return "";
  const name =
    user.full_name?.trim() ||
    `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();
  return name ? authorNameKey(name) : "";
}

function discussionParticipantMatchesAuthor(
  person: CoAuthorPerson,
  user: DiscussionParticipant
): boolean {
  const userId = user.id;
  if (userId != null && person.user_id != null && person.user_id === userId) {
    return true;
  }
  const nameKey = discussionParticipantNameKey(user);
  const personName = (person.fullname || "").trim();
  if (nameKey && personName && authorNameKey(personName) === nameKey) {
    return true;
  }
  const email = (user.email || "").trim().toLowerCase();
  const personEmail = (person.email || "").trim().toLowerCase();
  return Boolean(email && personEmail && email === personEmail);
}

function publicationAuthorRoster(
  coAuthors?: PublicationCoAuthors | null
): CoAuthorPerson[] {
  const roster: CoAuthorPerson[] = [];
  const seen = new Set<string>();

  const add = (person?: CoAuthorPerson | null) => {
    if (!person) return;
    const key =
      person.user_id != null
        ? `u:${person.user_id}`
        : `n:${authorNameKey(person.fullname || "")}`;
    if (!key || seen.has(key)) return;
    seen.add(key);
    roster.push(person);
  };

  add(coAuthors?.primary_author);
  for (const person of coAuthors?.co_authors ?? []) add(person);
  for (const person of coAuthors?.team ?? []) add(person);
  return roster;
}

/** Role badge for publication discussion participants (lead, co-author, or member). */
export function discussionAuthorRoleLabel(
  user?: DiscussionParticipant,
  coAuthors?: PublicationCoAuthors | null,
  opts?: { authorUserId?: number | null }
): string | null {
  if (!user) return null;
  if (!user.id && !discussionParticipantNameKey(user)) return null;

  for (const person of publicationAuthorRoster(coAuthors)) {
    if (discussionParticipantMatchesAuthor(person, user)) {
      return normalizeDiscussionAuthorRole(person.role, person.kind);
    }
  }

  const userId = user.id;
  if (userId != null && opts?.authorUserId != null && userId === opts.authorUserId) {
    const primary = coAuthors?.primary_author;
    if (!primary || primary.user_id == null || primary.user_id === userId) {
      return "Lead author";
    }
  }

  if (userId != null) return "Member";
  return null;
}

/** Resolve researcher stars from API ranking only (10 published GRE papers per star). */
export function researcherRankStars(
  ranking?: ResearcherRanking | null,
  registered?: boolean
): number {
  if (!researcherGreRankEligible(ranking, registered)) return 0;
  if (typeof ranking!.stars === "number" && ranking!.stars > 0) {
    return ranking!.stars;
  }
  return researcherStarsFromPublishedCount(ranking!.published_count ?? 0);
}

/** GRE stars and badges apply only to registered researchers with 10+ published GRE papers. */
export function researcherGreRankEligible(
  ranking?: ResearcherRanking | null,
  registered?: boolean
): boolean {
  if (!registered || !ranking) return false;
  const published = ranking.published_count ?? 0;
  if (published < RESEARCHER_PUBS_PER_STAR) return false;
  const stars =
    typeof ranking.stars === "number" && ranking.stars > 0
      ? ranking.stars
      : researcherStarsFromPublishedCount(published);
  return stars > 0;
}

/** Comma-separated author names for a publication (all authors by default). */
export function compactAuthorLineFromPublication(
  publication: Publication,
  maxAuthors?: number
): string {
  const byline = authorBylineFromPublication(publication);
  const names = byline.authors.map((author) => author.name).filter(Boolean);
  if (!names.length) return "";
  if (maxAuthors == null || maxAuthors < 1 || names.length <= maxAuthors) {
    return names.join(", ");
  }
  const shown = names.slice(0, maxAuthors);
  const extra = names.length - maxAuthors;
  return `${shown.join(", ")}, et al. (+${extra})`;
}

/** Full author team as a comma-separated line (paper views). */
export function fullAuthorLineFromPublication(publication: Publication): string {
  return compactAuthorLineFromPublication(publication);
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
