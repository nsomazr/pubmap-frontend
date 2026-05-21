import { MapPin, X } from "lucide-react";
import { createPortal } from "react-dom";
import { abstractPlainText } from "../../lib/abstractText";
import { Button } from "../ui/Button";
import { PdfPreview } from "./PdfPreview";

interface Props {
  open: boolean;
  title: string;
  abstract: string;
  subCategoryName?: string;
  location?: string;
  institution?: string;
  documentPath?: string | null;
  pendingFile?: File | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SubmissionReviewDialog({
  open,
  title,
  abstract,
  subCategoryName,
  location,
  institution,
  documentPath,
  pendingFile,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="submission-review-title"
    >
      <div className="flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
              Before you submit
            </p>
            <h2 id="submission-review-title" className="text-lg font-bold text-ink">
              Review your submission
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Check title, abstract, PDF, and map location. Nothing is sent for admin review until you
              confirm below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close review"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</h3>
            <p className="mt-1 text-base font-semibold text-ink">{title}</p>
            {subCategoryName && (
              <span className="mt-2 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                {subCategoryName}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Abstract</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {abstractPlainText(abstract) || "—"}
            </p>
          </div>

          {location && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Study location
              </h3>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                {location}
                {institution ? ` · ${institution}` : ""}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Manuscript PDF
            </h3>
            <PdfPreview
              file={pendingFile}
              documentPath={documentPath}
              title="Manuscript preview"
              className="min-h-[280px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Go back and edit
          </Button>
          <Button type="button" onClick={onConfirm} loading={submitting}>
            Confirm & submit for review
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
