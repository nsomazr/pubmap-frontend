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
    <section className="publication-uploaded-manuscript min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <header className="border-b border-slate-100 px-5 py-4 sm:px-7">
        <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
          Uploaded manuscript
        </h2>
        <p className="mt-1 text-xs text-slate-500">Original PDF as submitted by the author</p>
      </header>
      <div className="p-4 sm:p-5">
        <PdfPreview
          previewUrl={manuscriptUrl}
          fallbackPreviewUrl={fallbackToSummaryPdf ? summaryUrl : null}
          className="min-h-[min(50vh,420px)] sm:min-h-[min(70vh,720px)]"
        />
      </div>
    </section>
  );
}
