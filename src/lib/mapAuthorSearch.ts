import { authorDisplayName, userFullName } from "./userDisplay";
import type { Publication } from "../types";

/** Strip accidental filter labels pasted into the author field. */
export function normalizeAuthorSearchQuery(query: string): string {
  return query
    .replace(/^(author|researcher)\s*:\s*/i, "")
    .trim();
}

export function normalizePersonNameForSearch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function personNameMatchesAuthorQuery(name: string, query: string): boolean {
  const normalizedName = normalizePersonNameForSearch(name);
  const normalizedQuery = normalizePersonNameForSearch(normalizeAuthorSearchQuery(query));
  if (!normalizedQuery) return false;
  if (normalizedName === normalizedQuery) return true;
  if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
    return true;
  }
  const tokens = normalizedQuery.split(" ").filter((token) => token.length > 1);
  if (!tokens.length) return false;
  return tokens.every((token) => normalizedName.includes(token));
}

export function publicationMatchesAuthorQuery(pub: Publication, query: string): boolean {
  const ownerName = authorDisplayName(pub.author) || userFullName(pub.author);
  if (ownerName && personNameMatchesAuthorQuery(ownerName, query)) return true;
  for (const collab of pub.collaborators ?? []) {
    const name = collab.fullname?.trim();
    if (name && personNameMatchesAuthorQuery(name, query)) return true;
  }
  return false;
}

export function filterPublicationsByAuthorQuery(
  publications: Publication[],
  query: string
): Publication[] {
  const normalized = normalizeAuthorSearchQuery(query);
  if (normalized.length < 2) return [];
  return publications.filter((pub) => publicationMatchesAuthorQuery(pub, normalized));
}

export type AuthorMatchedResearcher = {
  key: string;
  userId?: number | null;
  name: string;
  affiliation: string;
  photo?: string;
  publications: Publication[];
};

/** Researchers matched on map papers (lead author or co-author list). */
export function collectAuthorMatchedResearchers(
  publications: Publication[],
  query: string
): AuthorMatchedResearcher[] {
  const normalized = normalizeAuthorSearchQuery(query);
  if (normalized.length < 2) return [];

  const grouped = new Map<
    string,
    {
      userId?: number | null;
      name: string;
      affiliation: string;
      photo?: string;
      publications: Publication[];
    }
  >();

  const addMatch = (
    key: string,
    pub: Publication,
    person: { userId?: number | null; name: string; affiliation: string; photo?: string }
  ) => {
    const existing = grouped.get(key);
    if (existing) {
      if (!existing.publications.some((p) => p.id === pub.id)) {
        existing.publications.push(pub);
      }
      return;
    }
    grouped.set(key, {
      ...person,
      publications: [pub],
    });
  };

  for (const pub of publications) {
    const ownerName = authorDisplayName(pub.author) || userFullName(pub.author);
    if (ownerName && personNameMatchesAuthorQuery(ownerName, normalized)) {
      addMatch(
        pub.author?.id ? `user:${pub.author.id}` : `name:${normalizePersonNameForSearch(ownerName)}`,
        pub,
        {
          userId: pub.author?.id,
          name: ownerName,
          affiliation: pub.author?.affiliation || "",
          photo: pub.author?.photo,
        }
      );
    }

    for (const collab of pub.collaborators ?? []) {
      const name = collab.fullname?.trim();
      if (!name || !personNameMatchesAuthorQuery(name, normalized)) continue;
      addMatch(
        collab.user_id ? `user:${collab.user_id}` : `name:${normalizePersonNameForSearch(name)}`,
        pub,
        {
          userId: collab.user_id,
          name,
          affiliation: collab.affiliation || "",
          photo: collab.photo,
        }
      );
    }
  }

  return [...grouped.values()]
    .map((row) => ({
      key: row.userId ? `user:${row.userId}` : `name:${normalizePersonNameForSearch(row.name)}`,
      userId: row.userId,
      name: row.name,
      affiliation: row.affiliation,
      photo: row.photo,
      publications: row.publications,
    }))
    .sort(
      (a, b) =>
        b.publications.length - a.publications.length || a.name.localeCompare(b.name)
    );
}
