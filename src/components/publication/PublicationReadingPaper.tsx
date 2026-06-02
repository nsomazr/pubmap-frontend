import { ManuscriptContent } from "./ManuscriptContent";
import { PublicationManuscriptBody } from "./PublicationManuscriptBody";
import type { PublicationFigure } from "../../lib/publicationGre";

type Props = {
  abstract?: string | null;
  keywords?: string[];
  showManuscript: boolean;
  introduction?: string | null;
  methods?: string | null;
  findings?: string | null;
  conclusion?: string | null;
  figures?: PublicationFigure[];
  publicationId: number | string;
  encodedPublicationId?: string | null;
};

/** Single reading surface: abstract + manuscript sections without per-section cards. */
export function PublicationReadingPaper({
  abstract,
  keywords,
  showManuscript,
  introduction,
  methods,
  findings,
  conclusion,
  figures = [],
  publicationId,
  encodedPublicationId,
}: Props) {
  const hasKeywords = Boolean(keywords?.length);
  const hasAbstractBlock = Boolean(abstract?.trim()) || hasKeywords;
  const hasManuscript =
    showManuscript &&
    ([introduction, methods, findings, conclusion].some((s) => Boolean(s?.trim())) ||
      figures.length > 0);

  if (!hasAbstractBlock && !hasManuscript) return null;

  return (
    <article className="publication-reading-paper min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:px-8 sm:py-8">
      {hasAbstractBlock && (
        <section
          className={`min-w-0 ${hasManuscript ? "mb-8 border-b border-slate-100 pb-8" : ""}`}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">Abstract</h2>
          {abstract?.trim() ? (
            <ManuscriptContent value={abstract} className="mt-4 min-w-0" />
          ) : (
            <p className="mt-4 text-base leading-relaxed text-slate-700">No abstract provided.</p>
          )}
          {hasKeywords && keywords && (
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Keywords: </span>
              {keywords.join(", ")}
            </p>
          )}
        </section>
      )}

      {hasManuscript && (
        <PublicationManuscriptBody
          introduction={introduction}
          methods={methods}
          findings={findings}
          conclusion={conclusion}
          figures={figures}
          publicationId={publicationId}
          encodedPublicationId={encodedPublicationId}
          variant="public"
          layout="flat"
        />
      )}
    </article>
  );
}
