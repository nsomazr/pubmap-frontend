import { grePaperSectionHeadingClass } from "../../lib/publicationPageStyles";
import { ManuscriptContent } from "./ManuscriptContent";
import { PublicationManuscriptBody } from "./PublicationManuscriptBody";
import { PublicationManuscriptSection } from "./PublicationManuscriptSection";
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
  references?: string | null;
  /** Render inside {@link PublicationPaperDocument} without its own outer card. */
  embedded?: boolean;
  /** Show abstract block even when empty (composer preview). */
  alwaysShowAbstract?: boolean;
  abstractEmptyMessage?: string;
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
  references,
  embedded = false,
  alwaysShowAbstract = false,
  abstractEmptyMessage,
}: Props) {
  const hasKeywords = Boolean(keywords?.length);
  const hasAbstractBlock = Boolean(abstract?.trim()) || hasKeywords || alwaysShowAbstract;
  const hasManuscript =
    showManuscript &&
    ([introduction, methods, findings, conclusion].some((s) => Boolean(s?.trim())) ||
      figures.length > 0);

  const hasReferences = Boolean(references?.trim());

  if (!hasAbstractBlock && !hasManuscript && !hasReferences) return null;

  const body = (
    <>
      {hasAbstractBlock && (
        <section
          className={`min-w-0 ${embedded ? "border-t border-slate-100 pt-8" : ""} ${
            hasManuscript || hasReferences ? "mb-8 border-b border-slate-100 pb-8" : ""
          }`}
        >
          <h2 className={grePaperSectionHeadingClass}>Abstract</h2>
          {abstract?.trim() ? (
            <ManuscriptContent value={abstract} className="mt-4 min-w-0" />
          ) : (
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              {abstractEmptyMessage ?? "No abstract provided."}
            </p>
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

      {hasReferences && (
        <PublicationManuscriptSection
          title="References"
          body={references}
          layout="flat"
          variant="public"
        />
      )}
    </>
  );

  if (embedded) {
    return <div className="publication-reading-paper__body min-w-0 px-5 sm:px-8">{body}</div>;
  }

  return (
    <article className="publication-reading-paper min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:px-8 sm:py-8">
      {body}
    </article>
  );
}
