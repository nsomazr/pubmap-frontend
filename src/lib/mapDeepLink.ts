export type MapDeepLinkPanel = "summary";

export interface MapDeepLinkState {
  publicationId: number | null;
  panel: MapDeepLinkPanel | null;
  author: string | null;
  affiliation: string | null;
  location: string | null;
}

export function parseMapDeepLink(search: string): MapDeepLinkState {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const raw = params.get("pub") || params.get("publication");
  const publicationId = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  const panelRaw = params.get("panel");
  const panel: MapDeepLinkPanel | null = panelRaw === "summary" ? "summary" : null;
  const author = params.get("author")?.trim() || null;
  const affiliation = params.get("affiliation")?.trim() || null;
  const location = params.get("location")?.trim() || null;
  return { publicationId, panel, author, affiliation, location };
}

export function buildMapFocusPath(
  publicationId: number,
  opts?: { panel?: MapDeepLinkPanel }
): string {
  if (opts?.panel === "summary") {
    return `/publication/${publicationId}/chat`;
  }
  const params = new URLSearchParams({ pub: String(publicationId) });
  return `/?${params.toString()}`;
}

export function buildMapLocationPath(location: string): string {
  return `/?${new URLSearchParams({ location }).toString()}`;
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
