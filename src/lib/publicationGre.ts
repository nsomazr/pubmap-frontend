import api from "./api";

import { resolveApiBaseUrl } from "./apiBaseUrl";

export type PublicationAccessType = "open" | "closed";

export interface PublicationGre {
  access_type: PublicationAccessType;
  external_url?: string;
  reference_url?: string;
  gre_doi?: string | null;
  gre_doi_url?: string | null;
  author_summary?: string;
  summary_pdf_path?: string;
  has_summary_pdf?: boolean;
}

export interface PublicationFigure {
  id: number;
  photo: string;
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

export async function updatePublicationGre(
  publicationId: number,
  payload: Partial<PublicationGre>
): Promise<PublicationGre> {
  const { data } = await api.patch<PublicationGre>(`/publications/${publicationId}/gre/`, payload);
  return data;
}

export async function uploadFigure(
  publicationId: number,
  file: File,
  meta: { caption?: string; title?: string; figure_number?: string }
) {
  const form = new FormData();
  form.append("photo", file);
  if (meta.caption) form.append("caption", meta.caption);
  if (meta.title) form.append("title", meta.title);
  if (meta.figure_number) form.append("figure_number", meta.figure_number);
  const { data } = await api.post(`/publications/${publicationId}/upload_figure/`, form);
  return data;
}

export async function deleteFigure(publicationId: number, figureId: number) {
  await api.delete(`/publications/${publicationId}/figures/${figureId}/`);
}

export async function updateFigure(
  publicationId: number,
  figureId: number,
  meta: { caption?: string; title?: string; figure_number?: string }
): Promise<PublicationFigure> {
  const { data } = await api.patch<PublicationFigure>(
    `/publications/${publicationId}/figures/${figureId}/`,
    meta
  );
  return data;
}

export async function uploadSupplementaryDocument(
  publicationId: number,
  file: File,
  label?: string
): Promise<GreDocument> {
  const form = new FormData();
  form.append("document", file);
  form.append("kind", "supplementary");
  if (label?.trim()) form.append("label", label.trim());
  const { data } = await api.post<GreDocument>(
    `/publications/${publicationId}/upload_document/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function deletePublicationDocument(publicationId: number, documentId: number) {
  await api.delete(`/publications/${publicationId}/documents/${documentId}/`);
}

export function reviewManuscriptPdfUrl(publicationId: number, inline = true) {
  const base = resolveApiBaseUrl().replace(/\/$/, "");
  const params = inline ? "?inline=1" : "";
  return `${base}/publications/${publicationId}/review-manuscript/${params}`;
}

export function summaryPdfUrl(
  publicationId: number,
  options: { discussions?: boolean; inline?: boolean } = {}
) {
  const base = resolveApiBaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams();
  if (options.discussions) params.set("discussions", "1");
  if (options.inline) params.set("inline", "1");
  const query = params.toString();
  return `${base}/publications/${publicationId}/summary-pdf/${query ? `?${query}` : ""}`;
}

export function greDoiDisplayPath(greDoi: string) {
  return `/doi/${greDoi}`;
}
