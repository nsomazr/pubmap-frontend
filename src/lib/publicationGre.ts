import api from "./api";

import { resolveApiBaseUrl } from "./apiBaseUrl";
import { mediaUrl } from "./mediaUrl";
import { publicationApiSegment } from "./publicationPaths";

export type PublicationAccessType = "open" | "closed";

/** Display label for GRE `authors_comment` (restricted-access / reviewer surfaces). */
export const AUTHORS_PERSONAL_FEELING_LABEL =
  "Author's Personal Feeling About the Paper";

export interface PublicationGre {
  access_type: PublicationAccessType;
  external_url?: string;
  reference_url?: string;
  gre_doi?: string | null;
  gre_doi_url?: string | null;
  author_summary?: string;
  authors_comment?: string;
  summary_pdf_path?: string;
  has_summary_pdf?: boolean;
}

export interface PublicationFigure {
  id: number;
  /** Stored media path (e.g. uploads/figures/…) or legacy storage/ URL. */
  photo: string;
  /** Absolute URL when the API provides one. */
  photo_url?: string;
  caption?: string;
  title?: string;
  figure_number?: string;
  sort_order?: number;
}

export interface GreDocument {
  id: number;
  document: string;
  kind?: "manuscript" | "supplementary" | "reference";
  label?: string;
  external_url?: string;
}

type PublicationIdRef = number | string;

function pubSeg(publicationId: PublicationIdRef, encodedId?: string | null) {
  return publicationApiSegment(publicationId, encodedId);
}

/** Preview URL for a figure (API image route; supports JWT via ?access= for <img>). */
export function figurePreviewUrl(
  publicationId: PublicationIdRef,
  figureId: number,
  encodedId?: string | null
): string {
  const apiBase = resolveApiBaseUrl().replace(/\/$/, "");
  const path = `/publications/${pubSeg(publicationId, encodedId)}/figures/${figureId}/image/`;
  const base = apiBase.startsWith("http")
    ? apiBase
    : typeof window !== "undefined"
      ? `${window.location.origin}${apiBase.startsWith("/") ? apiBase : `/${apiBase}`}`
      : apiBase;
  const url = `${base.replace(/\/$/, "")}${path}`;
  if (typeof window === "undefined") return url;
  const token = localStorage.getItem("access_token");
  if (!token) return url;
  return `${url}?access=${encodeURIComponent(token)}`;
}

export function resolveFigureImageSrc(
  fig: PublicationFigure,
  publicationId: PublicationIdRef,
  encodedId?: string | null
): string | null {
  if (publicationId && fig.id > 0) {
    return figurePreviewUrl(publicationId, fig.id, encodedId);
  }
  const fromApi = fig.photo_url?.trim();
  if (fromApi) return fromApi;
  const raw = fig.photo?.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return mediaUrl(raw);
}

/** Fetch figure bytes through the API (Authorization header, no token in URL). */
export async function fetchFigureImageBlob(
  publicationId: PublicationIdRef,
  figureId: number,
  encodedId?: string | null
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/publications/${pubSeg(publicationId, encodedId)}/figures/${figureId}/image/`,
    { responseType: "blob" }
  );
  return data;
}

export async function updatePublicationGre(
  publicationId: PublicationIdRef,
  payload: Partial<PublicationGre>,
  encodedId?: string | null
): Promise<PublicationGre> {
  const { data } = await api.patch<PublicationGre>(
    `/publications/${pubSeg(publicationId, encodedId)}/gre/`,
    payload
  );
  return data;
}

export async function uploadFigure(
  publicationId: PublicationIdRef,
  file: File,
  meta: { caption?: string; title?: string; figure_number?: string },
  encodedId?: string | null
) {
  const form = new FormData();
  form.append("photo", file);
  if (meta.caption) form.append("caption", meta.caption);
  if (meta.title) form.append("title", meta.title);
  if (meta.figure_number) form.append("figure_number", meta.figure_number);
  const { data } = await api.post(
    `/publications/${pubSeg(publicationId, encodedId)}/upload_figure/`,
    form
  );
  return data;
}

export async function deleteFigure(
  publicationId: PublicationIdRef,
  figureId: number,
  encodedId?: string | null
) {
  await api.delete(`/publications/${pubSeg(publicationId, encodedId)}/figures/${figureId}/`);
}

export async function updateFigure(
  publicationId: PublicationIdRef,
  figureId: number,
  meta: { caption?: string; title?: string; figure_number?: string },
  encodedId?: string | null
): Promise<PublicationFigure> {
  const { data } = await api.patch<PublicationFigure>(
    `/publications/${pubSeg(publicationId, encodedId)}/figures/${figureId}/`,
    meta
  );
  return data;
}

export async function uploadSupplementaryDocument(
  publicationId: PublicationIdRef,
  file: File,
  label?: string,
  encodedId?: string | null
): Promise<GreDocument> {
  const form = new FormData();
  form.append("document", file);
  form.append("kind", "supplementary");
  if (label?.trim()) form.append("label", label.trim());
  const { data } = await api.post<GreDocument>(
    `/publications/${pubSeg(publicationId, encodedId)}/upload_document/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function deletePublicationDocument(
  publicationId: PublicationIdRef,
  documentId: number,
  encodedId?: string | null
) {
  await api.delete(
    `/publications/${pubSeg(publicationId, encodedId)}/documents/${documentId}/`
  );
}

export function reviewManuscriptPdfUrl(
  publicationId: PublicationIdRef,
  inline = true,
  encodedId?: string | null
) {
  const base = resolveApiBaseUrl().replace(/\/$/, "");
  const params = inline ? "?inline=1" : "";
  return `${base}/publications/${pubSeg(publicationId, encodedId)}/review-manuscript/${params}`;
}

export function summaryPdfUrl(
  publicationId: PublicationIdRef,
  options: { discussions?: boolean; inline?: boolean; encodedId?: string | null } = {}
) {
  const base = resolveApiBaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams();
  if (options.discussions) params.set("discussions", "1");
  if (options.inline) params.set("inline", "1");
  const query = params.toString();
  const seg = pubSeg(publicationId, options.encodedId);
  return `${base}/publications/${seg}/summary-pdf/${query ? `?${query}` : ""}`;
}

export function greDoiDisplayPath(greDoi: string) {
  return `/doi/${greDoi}`;
}
