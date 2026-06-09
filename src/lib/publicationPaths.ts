export const DASHBOARD_NEW_PUBLICATION_PATH = "/dashboard/publications/new";

export type NewPublicationLocationState = {
  /** Set when the user explicitly starts a new publication (clears any in-progress draft session). */
  freshDraft?: boolean;
};

export const freshNewPublicationState: NewPublicationLocationState = {
  freshDraft: true,
};

export function publicationRef(
  publicationId: number | string | undefined | null,
  encodedId?: string | null
): string {
  const encoded = (encodedId || "").trim();
  if (encoded) return encoded;
  return publicationId == null ? "" : String(publicationId);
}

export function buildPublicationPath(
  publicationId: number | string | undefined | null,
  encodedId?: string | null
): string {
  return `/publication/${publicationRef(publicationId, encodedId)}`;
}

export function buildPublicationChatPath(
  publicationId: number | string | undefined | null,
  encodedId?: string | null
): string {
  return `/publication/${publicationRef(publicationId, encodedId)}/chat`;
}

export function publicationPublicApiPath(publicationIdOrCode: string): string {
  const ref = (publicationIdOrCode || "").trim();
  if (!ref) return "/publications/";
  if (/^\d+$/.test(ref)) {
    return `/publications/${ref}/public/`;
  }
  return `/publications/by-code/${ref}/public/`;
}

export function publicationApiSegment(
  publicationId: number | string | undefined | null,
  encodedId?: string | null
): string {
  return publicationRef(publicationId, encodedId);
}

export function buildDashboardPublicationPath(
  publicationId: number | string | undefined | null,
  encodedId?: string | null,
  opts?: { suffix?: "reader"; query?: string }
): string {
  const ref = publicationRef(publicationId, encodedId);
  if (!ref) return "/dashboard/publications";
  let path = `/dashboard/publications/${ref}`;
  if (opts?.suffix === "reader") path += "/reader";
  if (opts?.query) path += opts.query.startsWith("?") ? opts.query : `?${opts.query}`;
  return path;
}
