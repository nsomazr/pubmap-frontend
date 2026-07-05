import { Download, Eye, EyeOff, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import {
  isMessageAttachmentImage,
  isMessageAttachmentPdf,
  isMessageAttachmentPreviewable,
} from "../../lib/messageAttachments";
import { FigureLightbox } from "../publication/FigureLightbox";
import { PdfPreview } from "../publication/PdfPreview";

type Props = {
  messageId: number;
  filename: string;
  mine: boolean;
  onDownload: () => void;
};

function useAttachmentObjectUrl(messageId: number, enabled: boolean) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    api
      .get<Blob>(`/messages/${messageId}/attachment/`, { responseType: "blob" })
      .then(({ data }) => {
        if (cancelled) return;
        setObjectUrl(URL.createObjectURL(data));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [messageId, enabled]);

  return { objectUrl, loading, error };
}

export function MessageAttachmentPreview({ messageId, filename, mine, onDownload }: Props) {
  const isImage = isMessageAttachmentImage(filename);
  const isPdf = isMessageAttachmentPdf(filename);
  const previewable = isMessageAttachmentPreviewable(filename);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const shouldLoadAttachment = isImage || (isPdf && pdfOpen);
  const { objectUrl, loading, error } = useAttachmentObjectUrl(messageId, shouldLoadAttachment);

  const cardClass = mine
    ? "bg-white/10 ring-white/20"
    : "bg-slate-50 ring-slate-200/80";

  const textClass = mine ? "text-white" : "text-slate-700";
  const mutedClass = mine ? "text-white/70" : "text-slate-500";
  const actionClass = mine
    ? "text-white/90 hover:bg-white/10"
    : "text-slate-600 hover:bg-slate-100";

  if (!previewable) {
    return (
      <button
        type="button"
        onClick={onDownload}
        className={`mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium ring-1 ${cardClass} ${textClass}`}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{filename}</span>
        <Download className="h-4 w-4 shrink-0 opacity-80" />
      </button>
    );
  }

  return (
    <div className={`mb-2 overflow-hidden rounded-xl ring-1 ${cardClass}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <FileText className={`h-4 w-4 shrink-0 ${textClass}`} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${textClass}`}>{filename}</p>
          {loading && (isImage || pdfOpen) ? (
            <p className={`flex items-center gap-1 text-[11px] ${mutedClass}`}>
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading preview…
            </p>
          ) : error && (isImage || pdfOpen) ? (
            <p className={`text-[11px] ${mutedClass}`}>Preview unavailable</p>
          ) : isPdf && !pdfOpen ? (
            <p className={`text-[11px] ${mutedClass}`}>Tap preview to open</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {isPdf ? (
            <button
              type="button"
              onClick={() => setPdfOpen((open) => !open)}
              disabled={loading && pdfOpen}
              className={`rounded-lg p-1.5 transition ${actionClass} disabled:opacity-40`}
              aria-label={pdfOpen ? "Hide PDF preview" : "Preview PDF"}
              title={pdfOpen ? "Hide preview" : "Preview"}
            >
              {pdfOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDownload}
            className={`rounded-lg p-1.5 transition ${actionClass}`}
            aria-label="Download attachment"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isImage && objectUrl ? (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block w-full border-t border-white/10 p-2 sm:p-3"
          aria-label={`Preview ${filename}`}
        >
          <img
            src={objectUrl}
            alt={filename}
            loading="lazy"
            decoding="async"
            className="mx-auto max-h-56 w-full rounded-lg object-contain"
          />
          <p className={`mt-1.5 text-center text-[11px] ${mutedClass}`}>Tap to enlarge</p>
        </button>
      ) : null}

      {isPdf && pdfOpen ? (
        <div
          className={`border-t p-2 sm:p-3 ${mine ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white"}`}
        >
          {loading ? (
            <p className={`flex items-center justify-center gap-2 py-8 text-sm ${mutedClass}`}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading PDF…
            </p>
          ) : objectUrl ? (
            <PdfPreview
              previewUrl={objectUrl}
              title={filename}
              layout="page"
              allowExpand
              emptyState="publication"
              className="w-full"
            />
          ) : null}
        </div>
      ) : null}

      <FigureLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={objectUrl || ""}
        alt={filename}
      />
    </div>
  );
}
