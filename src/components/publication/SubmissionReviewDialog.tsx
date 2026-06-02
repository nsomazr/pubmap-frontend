import { FileText, MapPin, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { abstractPlainText } from "../../lib/abstractText";
import { AUTHORS_PERSONAL_FEELING_LABEL } from "../../lib/publicationGre";
import { Button } from "../ui/Button";
import { ManuscriptContent } from "./ManuscriptContent";
import type { ManuscriptFields } from "./ManuscriptSectionsEditor";
import type { PublicationFigure } from "../../lib/publicationGre";
import { PublicationManuscriptBody } from "./PublicationManuscriptBody";

export const AUTHOR_SUBMISSION_DECLARATION =
  "I declare that this work is my own and that the Global Research Explorer (GRE) has no obligation or liability regarding any claims, including complaints from third parties, related to this article.";

interface Props {
  open: boolean;
  title: string;
  manuscript: ManuscriptFields;
  keywords?: string;
  subCategoryName?: string;
  location?: string;
  institution?: string;
  accessType?: "open" | "closed";
  authorsComment?: string;
  figures?: PublicationFigure[];
  publicationId?: number | string;
  encodedPublicationId?: string | null;
  manuscriptFileName?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ReviewBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ReviewText({ value }: { value?: string | null }) {
  const text = (value || "").trim();
  if (!text) {
    return <p className="text-sm italic text-slate-400">Not provided</p>;
  }
  return <ManuscriptContent value={value} className="min-w-0 text-sm" />;
}

function parseKeywordList(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function SubmissionReviewDialog({
  open,
  title,
  manuscript,
  keywords,
  subCategoryName,
  location,
  institution,
  accessType,
  authorsComment,
  figures = [],
  publicationId = 0,
  encodedPublicationId,
  manuscriptFileName,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  const [declared, setDeclared] = useState(false);
  const keywordList = parseKeywordList(keywords);

  useEffect(() => {
    if (!open) setDeclared(false);
  }, [open]);

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
              Check every field below. Nothing is sent for admin review until you confirm.
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
          <ReviewBlock label="Title">
            <p className="text-base font-semibold text-ink">{title || "Not provided"}</p>
            {subCategoryName && (
              <span className="mt-2 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                {subCategoryName}
              </span>
            )}
          </ReviewBlock>

          {accessType && (
            <ReviewBlock label="Access">
              <p className="text-sm text-slate-700">
                {accessType === "closed" ? "Closed access" : "Open access"}
              </p>
            </ReviewBlock>
          )}

          {manuscriptFileName && (
            <ReviewBlock label="Manuscript file">
              <p className="flex items-center gap-1.5 text-sm text-slate-700">
                <FileText className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <span className="truncate">{manuscriptFileName}</span>
              </p>
            </ReviewBlock>
          )}

          <ReviewBlock label="Abstract">
            <p className="text-sm leading-relaxed text-slate-700">
              {abstractPlainText(manuscript.abstract) || (
                <span className="italic text-slate-400">Not provided</span>
              )}
            </p>
          </ReviewBlock>

          <ReviewBlock label="Keywords">
            {keywordList.length > 0 ? (
              <p className="text-sm text-slate-700">{keywordList.join(", ")}</p>
            ) : (
              <p className="text-sm italic text-slate-400">Not provided</p>
            )}
          </ReviewBlock>

          <PublicationManuscriptBody
            introduction={manuscript.introduction}
            methods={manuscript.methods}
            findings={manuscript.findings}
            conclusion={manuscript.conclusion}
            figures={figures}
            publicationId={publicationId}
            encodedPublicationId={encodedPublicationId}
            variant="composer"
          />

          <ReviewBlock label="Funding organizations">
            <ReviewText value={manuscript.funder} />
          </ReviewBlock>

          <ReviewBlock label="Key references">
            <ReviewText value={manuscript.references} />
          </ReviewBlock>

          {location && (
            <ReviewBlock label="Study location">
              <p className="flex items-start gap-1.5 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                {location}
                {institution ? ` · ${institution}` : ""}
              </p>
            </ReviewBlock>
          )}

          {accessType === "closed" && (
            <ReviewBlock label={AUTHORS_PERSONAL_FEELING_LABEL}>
              <ReviewText value={authorsComment} />
            </ReviewBlock>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3.5">
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm leading-relaxed text-slate-700">
              {AUTHOR_SUBMISSION_DECLARATION}
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Go back and edit
          </Button>
          <Button type="button" onClick={onConfirm} loading={submitting} disabled={!declared}>
            Confirm & submit for review
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
