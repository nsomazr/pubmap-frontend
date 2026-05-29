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
