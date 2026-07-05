import { Eye, EyeOff, FileText, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  formatMessageAttachmentSize,
  isPendingFileImage,
  isPendingFilePdf,
} from "../../lib/messageAttachments";
import { PdfPreview } from "../publication/PdfPreview";
import { FigureLightbox } from "../publication/FigureLightbox";

type Props = {
  file: File;
  onRemove: () => void;
};

export function PendingAttachmentPreview({ file, onRemove }: Props) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const isImage = isPendingFileImage(file);
  const isPdf = isPendingFilePdf(file);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return (
    <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-3">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">{file.name}</p>
          <p className="text-[10px] text-slate-400">{formatMessageAttachmentSize(file.size)}</p>
        </div>
        {isPdf ? (
          <button
            type="button"
            onClick={() => setPdfOpen((open) => !open)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-700"
            aria-label={pdfOpen ? "Hide PDF preview" : "Preview PDF"}
          >
            {pdfOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
          aria-label="Remove attachment"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {isImage ? (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="mt-2 block w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-2"
          aria-label={`Preview ${file.name}`}
        >
          <img
            src={objectUrl}
            alt={file.name}
            className="mx-auto max-h-40 w-full object-contain"
          />
        </button>
      ) : null}

      {isPdf && pdfOpen ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
          <PdfPreview file={file} layout="page" allowExpand className="w-full" />
        </div>
      ) : null}

      <FigureLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={objectUrl}
        alt={file.name}
      />
    </div>
  );
}
