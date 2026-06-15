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

export type PublicationPaperDocumentProps = Omit<
  PublicationPaperHeaderProps,
  "publicationId" | "encodedPublicationId"
> &
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
      className="publication-reading-paper gre-public-card min-w-0 overflow-hidden"
    >
      <PublicationPaperHeader
        {...headerProps}
        publicationId={Number(publicationId)}
        encodedPublicationId={encodedPublicationId}
        embedded
      />
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
