import { PdfPreview } from "./PdfPreview";
import { ManuscriptContent } from "./ManuscriptContent";
import { PublicationManuscriptSection } from "./PublicationManuscriptSection";
import { PublicationPaperHeader } from "./PublicationPaperHeader";
import type { AuthorByline } from "../../lib/publicationAuthors";
import type { SubcategoryVisual } from "../../types";

export interface PublicationPaperPreviewData {
  title: string;
  greNumber?: string | null;
  authorName?: string;
  affiliation?: string;
  authorByline?: AuthorByline;
  abstract?: string;
  keywords?: string[];
  funder?: string;
  introduction?: string;
  methods?: string;
  results?: string;
  findings?: string;
  conclusion?: string;
  subVisual?: SubcategoryVisual | null;
  subCategoryName?: string;
  location?: string;
  publishedLabel?: string;
  viewsCount?: number;
  downloadsCount?: number;
  discussionsCount?: number;
  responsesCount?: number;
  teamSize?: number;
  greDoi?: string | null;
  accessType?: "open" | "closed";
}

interface Props {
  data: PublicationPaperPreviewData;
  documentPath?: string | null;
  pendingFile?: File | null;
  draft?: boolean;
  showPdf?: boolean;
}

export function PublicationPaperPreview({
  data,
  documentPath,
  pendingFile,
  draft = false,
  showPdf = true,
}: Props) {
  const isClosed = data.accessType === "closed";
  const canShowPdf =
    showPdf && !isClosed && (pendingFile || documentPath?.toLowerCase().endsWith(".pdf"));

  return (
    <div className="publication-paper-preview space-y-5">
      <PublicationPaperHeader
        title={data.title || "Untitled publication"}
        greNumber={data.greNumber}
        funder={data.funder}
        authorName={data.authorName}
        affiliation={data.affiliation}
        authorByline={data.authorByline}
        subVisual={data.subVisual}
        subCategoryName={data.subCategoryName}
        publishedLabel={data.publishedLabel}
        location={data.location}
        viewsCount={data.viewsCount}
        downloadsCount={data.downloadsCount}
        discussionsCount={data.discussionsCount}
        responsesCount={data.responsesCount}
        teamSize={data.teamSize}
        greDoi={data.greDoi}
        accessType={data.accessType}
        draft={draft}
      />

      <section className="rounded-2xl border border-slate-200/70 bg-white px-5 py-5 sm:px-7 sm:py-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">Abstract</h2>
        {data.abstract?.trim() ? (
          <ManuscriptContent value={data.abstract} className="mt-4" />
        ) : (
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Add an abstract to preview how it will appear to readers.
          </p>
        )}
        {data.keywords && data.keywords.length > 0 && (
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Keywords: </span>
            {data.keywords.join(", ")}
          </p>
        )}
      </section>

      {canShowPdf && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
          <div className="border-b border-slate-100 px-5 py-3 sm:px-7">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
              Manuscript PDF review
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              This is how readers will open the full paper for open-access publications.
            </p>
          </div>
          <PdfPreview
            file={pendingFile}
            documentPath={documentPath}
            className="min-h-[min(70vh,720px)] rounded-none border-0"
          />
        </section>
      )}

      <div className="space-y-4">
        <PublicationManuscriptSection title="Introduction" body={data.introduction} />
        <PublicationManuscriptSection title="Methods" body={data.methods} />
        <PublicationManuscriptSection title="Results" body={data.results} />
        <PublicationManuscriptSection title="Findings — discussion" body={data.findings} />
        <PublicationManuscriptSection title="Conclusion" body={data.conclusion} />
      </div>
    </div>
  );
}
