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
  return /^\d+$/.test(publicationIdOrCode)
    ? `/publications/${publicationIdOrCode}/public/`
    : `/publications/by-code/${publicationIdOrCode}/public/`;
}
