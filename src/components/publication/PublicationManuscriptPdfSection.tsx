import { PdfPreview } from "./PdfPreview";
import { manuscriptPdfUrl, summaryPdfUrl } from "../../lib/publicationGre";
import { PublicationPageSection } from "./PublicationPageSection";

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
    <PublicationPageSection
      id="uploaded-manuscript"
      title="Uploaded manuscript"
      description="Original PDF as submitted by the author"
    >
      <PdfPreview
        previewUrl={manuscriptUrl}
        fallbackPreviewUrl={fallbackToSummaryPdf ? summaryUrl : null}
        className="min-h-[min(50vh,420px)] sm:min-h-[min(70vh,720px)]"
      />
    </PublicationPageSection>
  );
}
