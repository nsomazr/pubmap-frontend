import { primaryManuscriptPath } from "./publicationDocuments";
import type { Publication } from "../types";

/** Structured GRE paper fields (not the uploaded PDF file). */
export function publicationHasGrePaperBody(
  pub: Pick<
    Publication,
    | "abstract"
    | "introduction"
    | "methods"
    | "findings"
    | "conclusion"
    | "references"
    | "figures"
    | "keywords"
  >
): boolean {
  return Boolean(
    pub.abstract?.trim() ||
      pub.introduction?.trim() ||
      pub.methods?.trim() ||
      pub.findings?.trim() ||
      pub.conclusion?.trim() ||
      pub.references?.trim() ||
      (pub.keywords?.length ?? 0) > 0 ||
      (pub.figures?.length ?? 0) > 0
  );
}

export function publicationHasUploadedManuscriptPdf(
  pub: Pick<Publication, "documents" | "gre">
): boolean {
  if (pub.gre?.access_type === "closed") return false;
  const path = primaryManuscriptPath(pub);
  return Boolean(path?.trim().toLowerCase().endsWith(".pdf"));
}

/** Anything the reader can open under “View paper”. */
export function publicationHasReadablePaper(pub: Publication): boolean {
  const closed = pub.gre?.access_type === "closed";
  if (closed) {
    return Boolean(pub.abstract?.trim() || pub.gre?.authors_comment?.trim());
  }
  return publicationHasGrePaperBody(pub) || publicationHasUploadedManuscriptPdf(pub);
}
