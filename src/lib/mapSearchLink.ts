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

export function buildMapCategoryPath(categoryId: string | number): string {
  const id = String(categoryId).trim();
  if (!id) return "/";
  return `/?${new URLSearchParams({ category: id }).toString()}`;
}

export function buildMapSubCategoryPath(
  categoryId: string | number,
  subCategoryId: string | number
): string {
  const cat = String(categoryId).trim();
  const sub = String(subCategoryId).trim();
  if (!cat || !sub) return "/";
  return `/?${new URLSearchParams({ category: cat, sub_category: sub }).toString()}`;
}
