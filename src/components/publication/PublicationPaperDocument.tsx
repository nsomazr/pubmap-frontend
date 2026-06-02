import { ChevronDown, Eye } from "lucide-react";
import { useId, useState } from "react";
import { PublicationPaperHeader, type PublicationPaperHeaderProps } from "./PublicationPaperHeader";
import { PublicationReadingPaper } from "./PublicationReadingPaper";
import { PdfPreview } from "./PdfPreview";
import { manuscriptPdfUrl, summaryPdfUrl } from "../../lib/publicationGre";
import type { PublicationFigure } from "../../lib/publicationGre";

export type PublicationPaperDocumentProps = PublicationPaperHeaderProps & {
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
  /** Hide abstract + sections + PDF until the reader chooses to open the paper. */
  collapsibleReading?: boolean;
  readingOpen?: boolean;
  onReadingOpenChange?: (open: boolean) => void;
  /** Show uploaded manuscript PDF after GRE paper sections when reading is open. */
  showUploadedManuscriptPdf?: boolean;
  canExpandReading?: boolean;
};

/** One GRE paper: masthead, metadata, and optional collapsible reading body. */
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
  collapsibleReading = false,
  readingOpen: readingOpenProp,
  onReadingOpenChange,
  showUploadedManuscriptPdf = false,
  canExpandReading = true,
  ...headerProps
}: PublicationPaperDocumentProps) {
  const [readingOpenInternal, setReadingOpenInternal] = useState(false);
  const readingOpen = readingOpenProp ?? readingOpenInternal;
  const setReadingOpen = onReadingOpenChange ?? setReadingOpenInternal;
  const panelId = useId();

  const showBody = !collapsibleReading || readingOpen;
  const manuscriptUrl = manuscriptPdfUrl(publicationId, {
    inline: true,
    encodedId: encodedPublicationId,
  });
  const summaryUrl = summaryPdfUrl(publicationId, {
    inline: true,
    encodedId: encodedPublicationId,
  });

  return (
    <article
      id="publication-paper"
      className="publication-reading-paper min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
    >
      <PublicationPaperHeader {...headerProps} embedded />

      {collapsibleReading && !showBody && canExpandReading && (
        <div className="border-t border-slate-100 px-5 py-6 sm:px-8 sm:py-7">
          <p className="text-sm leading-relaxed text-slate-600">
            Read the GRE structured paper first, then the original uploaded manuscript PDF when
            available.
          </p>
          <button
            type="button"
            onClick={() => setReadingOpen(true)}
            className="mt-4 inline-flex min-h-[3rem] w-full items-center justify-center gap-2.5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 sm:w-auto"
            aria-expanded={false}
            aria-controls={panelId}
          >
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
            View paper
          </button>
        </div>
      )}

      {showBody && (
        <div id={panelId}>
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

          {showUploadedManuscriptPdf && (
            <section className="border-t border-slate-100 px-5 pb-6 pt-8 sm:px-8 sm:pb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
                Original manuscript
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Uploaded PDF as submitted by the author
              </p>
              <PdfPreview
                previewUrl={manuscriptUrl}
                fallbackPreviewUrl={summaryUrl}
                className="mt-4 min-h-[min(50vh,420px)] rounded-xl border border-slate-200/80 sm:min-h-[min(70vh,720px)]"
              />
            </section>
          )}

          {collapsibleReading && canExpandReading && (
            <div className="border-t border-slate-100 px-5 pb-5 sm:px-8">
              <button
                type="button"
                onClick={() => setReadingOpen(false)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
                aria-expanded={readingOpen}
                aria-controls={panelId}
              >
                <ChevronDown className="h-4 w-4 rotate-180" aria-hidden />
                Hide paper
              </button>
            </div>
          )}

          {!collapsibleReading && <div className="h-6 sm:h-8" aria-hidden />}
        </div>
      )}
    </article>
  );
}
