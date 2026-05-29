import type { GreDocument, Publication } from "../types";
import { mediaUrl } from "./mediaUrl";

export function primaryManuscriptDocument(
  documents?: GreDocument[] | null
): GreDocument | null {
  if (!documents?.length) return null;
  return documents.find((doc) => !doc.kind || doc.kind === "manuscript") ?? documents[0];
}

export function manuscriptFileLabel(doc: GreDocument | null | undefined): string {
  if (!doc?.document) return "";
  const path = doc.document.split("/").pop() || doc.document;
  return doc.label?.trim() || path;
}

export function publicationManuscriptUrl(
  publication?: Pick<Publication, "documents"> | null
): string | null {
  const doc = primaryManuscriptDocument(publication?.documents);
  return doc?.document ? mediaUrl(doc.document) : null;
}
