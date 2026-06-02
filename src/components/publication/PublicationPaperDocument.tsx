import { PublicationPaperHeader, type PublicationPaperHeaderProps } from "./PublicationPaperHeader";
import { PublicationReadingPaper } from "./PublicationReadingPaper";
import type { PublicationFigure } from "../../lib/publicationGre";

export type PublicationManuscriptFields = {
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
  alwaysShowAbstract?: boolean;
  abstractEmptyMessage?: string;
};

export type PublicationPaperDocumentProps = PublicationPaperHeaderProps &
  PublicationManuscriptFields & {
    /** When false, only the masthead/metadata card is rendered (manuscript shown elsewhere). */
    includeManuscript?: boolean;
  };

/** GRE paper masthead; optional inline manuscript for composer preview. */
export function PublicationPaperDocument({
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
  alwaysShowAbstract,
  abstractEmptyMessage,
  includeManuscript = true,
  ...headerProps
}: PublicationPaperDocumentProps) {
  return (
    <article
      id="publication-paper"
      className="publication-reading-paper min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
    >
      <PublicationPaperHeader {...headerProps} embedded />
      {includeManuscript && (
        <>
          <div className="border-t border-slate-100" aria-hidden />
          <PublicationReadingPaper
            abstract={abstract}
            keywords={keywords}
            showManuscript={showManuscript}
            introduction={introduction}
            methods={methods}
            findings={findings}
            conclusion={conclusion}
            figures={figures}
            publicationId={publicationId}
            encodedPublicationId={encodedPublicationId}
            references={references}
            embedded
            alwaysShowAbstract={alwaysShowAbstract}
            abstractEmptyMessage={abstractEmptyMessage}
          />
          <div className="h-6 sm:h-8" aria-hidden />
        </>
      )}
    </article>
  );
}
