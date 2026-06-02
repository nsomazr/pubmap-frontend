import type { PublicationFigure } from "./publicationGre";

type PaperFields = {
  abstract?: string | null;
  introduction?: string | null;
  methods?: string | null;
  findings?: string | null;
  conclusion?: string | null;
  references?: string | null;
  keywords?: string[] | null;
  figures?: PublicationFigure[] | null;
};

/** Structured GRE paper text (abstract, sections, figures, references). */
export function publicationHasNarrativeContent(pub: PaperFields): boolean {
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

export function publicationHasUploadedPdf(documentPath?: string | null): boolean {
  return Boolean(documentPath?.trim().toLowerCase().endsWith(".pdf"));
}
