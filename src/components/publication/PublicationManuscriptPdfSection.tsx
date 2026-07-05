import { Download, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { PdfPreview } from "./PdfPreview";
import { manuscriptPdfUrl, summaryPdfUrl } from "../../lib/publicationGre";
import { PublicationPageSection } from "./PublicationPageSection";

type Props = {
  publicationId: number | string;
  encodedId?: string | null;
  show: boolean;
  fallbackToSummaryPdf?: boolean;
};

export function PublicationManuscriptPdfSection({
  publicationId,
  encodedId,
  show,
  fallbackToSummaryPdf = true,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!show) return null;

  const manuscriptUrl = manuscriptPdfUrl(publicationId, { inline: true, encodedId });
  const manuscriptDownloadUrl = manuscriptPdfUrl(publicationId, { encodedId });
  const summaryUrl = summaryPdfUrl(publicationId, { inline: true, encodedId });

  return (
    <PublicationPageSection
      id="uploaded-manuscript"
      title="Uploaded manuscript"
      description="Original PDF as submitted by the author"
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen((open) => !open)}
          className={`inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            previewOpen
              ? "border-brand-300 bg-brand-50 text-brand-800"
              : "border-slate-200 bg-white text-slate-700 hover:border-brand-200"
          }`}
          aria-expanded={previewOpen}
          aria-controls="uploaded-manuscript-preview"
        >
          {previewOpen ? (
            <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {previewOpen ? "Hide manuscript" : "View manuscript"}
        </button>
        <a
          href={manuscriptDownloadUrl}
          className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-800"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          Download manuscript
        </a>
      </div>

      {previewOpen ? (
        <div id="uploaded-manuscript-preview" className="mt-5">
          <PdfPreview
            previewUrl={manuscriptUrl}
            fallbackPreviewUrl={fallbackToSummaryPdf ? summaryUrl : null}
            className="min-h-[min(50vh,420px)] sm:min-h-[min(70vh,720px)]"
          />
        </div>
      ) : null}
    </PublicationPageSection>
  );
}
