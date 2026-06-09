import { publicationRef } from "./publicationPaths";

export type MapDeepLinkPanel = "summary";

export interface MapDeepLinkState {
  /** Opaque hashid or legacy numeric string from `?pub=` */
  publicationRef: string | null;
  panel: MapDeepLinkPanel | null;
  author: string | null;
  affiliation: string | null;
  location: string | null;
  categoryId: string | null;
  subCategoryId: string | null;
}

export function parseMapDeepLink(search: string): MapDeepLinkState {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const raw = params.get("pub") || params.get("publication");
  const publicationRefValue = raw?.trim() || null;
  const panelRaw = params.get("panel");
  const panel: MapDeepLinkPanel | null = panelRaw === "summary" ? "summary" : null;
  const author = params.get("author")?.trim() || null;
  const affiliation = params.get("affiliation")?.trim() || null;
  const location = params.get("location")?.trim() || null;
  const categoryId = params.get("category")?.trim() || null;
  const subCategoryId = params.get("sub_category")?.trim() || null;
  return {
    publicationRef: publicationRefValue,
    panel,
    author,
    affiliation,
    location,
    categoryId,
    subCategoryId,
  };
}

export function buildMapFocusPath(
  publicationId: number,
  encodedId?: string | null,
  opts?: { panel?: MapDeepLinkPanel }
): string {
  const ref = publicationRef(publicationId, encodedId);
  if (opts?.panel === "summary") {
    return `/publication/${ref}/chat`;
  }
  const params = new URLSearchParams({ pub: ref });
  return `/?${params.toString()}`;
}

export function buildMapLocationPath(location: string): string {
  return `/?${new URLSearchParams({ location }).toString()}`;
}

export function buildMapTaxonomyPath(
  categoryId: string | number,
  subCategoryId?: string | number | null
): string {
  const params = new URLSearchParams({ category: String(categoryId) });
  if (subCategoryId != null && String(subCategoryId).trim()) {
    params.set("sub_category", String(subCategoryId));
  }
  return `/?${params.toString()}`;
}

export function extractNotificationPath(link?: string | null): string | null {
  if (!link?.trim()) return null;
  const trimmed = link.trim();
  if (trimmed.startsWith("/")) {
    return trimmed.split(/\s/)[0];
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      return `${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  }
  return null;
}
