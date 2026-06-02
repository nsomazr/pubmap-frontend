import { PdfPreview } from "./PdfPreview";
import { manuscriptPdfUrl, summaryPdfUrl } from "../../lib/publicationGre";

type Props = {
  publicationId: number | string;
  encodedId?: string | null;
  /** When false, section is hidden (closed access or no manuscript). */
  show: boolean;
  /** Prefer GRE formatted PDF when the uploaded file is missing on disk. */
  fallbackToSummaryPdf?: boolean;
};

export function PublicationManuscriptPdfSection({
  publicationId,
  encodedId,
  show,
  fallbackToSummaryPdf = true,
}: Props) {
  if (!show) return null;

  const manuscriptUrl = manuscriptPdfUrl(publicationId, { inline: true, encodedId });
  const summaryUrl = summaryPdfUrl(publicationId, { inline: true, encodedId });

  return (
    <section className="gre-public-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Manuscript PDF
          </h2>
          <p className="mt-1 text-xs text-slate-500">Full open-access paper</p>
        </div>
      </div>
      <PdfPreview
        previewUrl={manuscriptUrl}
        fallbackPreviewUrl={fallbackToSummaryPdf ? summaryUrl : null}
        className="min-h-[min(50vh,420px)] rounded-none border-0 sm:min-h-[min(75vh,900px)]"
      />
    </section>
  );
}
