/** Build home-map URLs that HomePage reads and applies as search filters. */

export function buildMapAuthorPath(author: string): string {
  const q = author.trim();
  if (!q) return "/";
  return `/?${new URLSearchParams({ author: q }).toString()}`;
}

export function buildMapAffiliationPath(affiliation: string): string {
  const q = affiliation.trim();
  if (!q) return "/";
  return `/?${new URLSearchParams({ affiliation: q }).toString()}`;
}
