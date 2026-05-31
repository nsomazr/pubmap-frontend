import type { GreDocument, Publication } from "../types";

/** Primary uploaded manuscript (excludes supplementary uploads when labeled). */
export function primaryManuscriptDocument(
  pub?: Pick<Publication, "documents"> | null
): GreDocument | null {
  const docs = pub?.documents ?? [];
  if (!docs.length) return null;
  const sorted = [...docs].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  const manuscript =
    sorted.find((doc) => !doc.kind || doc.kind === "manuscript") ??
    sorted.find((doc) => (doc.document || "").toLowerCase().endsWith(".pdf")) ??
    sorted[0];
  return manuscript ?? null;
}

export function primaryManuscriptPath(
  pub?: Pick<Publication, "documents"> | null
): string | null {
  return primaryManuscriptDocument(pub)?.document?.trim() || null;
}
