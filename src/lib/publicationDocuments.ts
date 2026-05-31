import type { GreDocument, Publication } from "../types";

/** Primary uploaded manuscript (excludes supplementary uploads when labeled). */
export function primaryManuscriptDocument(
  pub?: Pick<Publication, "documents"> | null
): GreDocument | null {
  const docs = pub?.documents ?? [];
  if (!docs.length) return null;
  const manuscript =
    docs.find((doc) => !doc.kind || doc.kind === "manuscript") ??
    docs.find((doc) => (doc.document || "").toLowerCase().endsWith(".pdf")) ??
    docs[0];
  return manuscript ?? null;
}

export function primaryManuscriptPath(
  pub?: Pick<Publication, "documents"> | null
): string | null {
  return primaryManuscriptDocument(pub)?.document?.trim() || null;
}
