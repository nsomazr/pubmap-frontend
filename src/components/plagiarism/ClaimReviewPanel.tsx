import { FileText, ImageIcon, Maximize2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { PdfPreview } from "../publication/PdfPreview";
import { summaryPdfUrl } from "../../lib/publicationGre";
import type { PublicationPlagiarismEvidence } from "../../types";
import { evidenceFileKind } from "./claimPreviewUtils";

type PreviewTab = "evidence" | "publication";

type Props = {
  publicationId: number;
  evidence: PublicationPlagiarismEvidence[];
  publicationTitle: string;
};

function EvidenceThumb({
  item,
  selected,
  onSelect,
}: {
  item: PublicationPlagiarismEvidence;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = item.label?.trim() || "Attachment";
  const kind = evidenceFileKind(item.url);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`gre-interactive overflow-hidden rounded-xl border text-left transition ${
        selected
          ? "border-brand-400 ring-2 ring-brand-500/25"
          : "border-slate-200/90 hover:border-slate-300"
      }`}
    >
      <div className="relative aspect-[4/3] bg-slate-50">
        {kind === "image" ? (
          <img
            src={item.url}
            alt={label}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            {kind === "pdf" ? (
              <FileText className="h-8 w-8 text-brand-600/80" />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
            <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide">
              {kind === "pdf" ? "PDF" : "File"}
            </span>
          </div>
        )}
      </div>
      <p className="truncate px-2.5 py-2 text-xs font-medium text-slate-700">{label}</p>
    </button>
  );
}

function EvidenceDetail({
  item,
  onExpandImage,
}: {
  item: PublicationPlagiarismEvidence;
  onExpandImage?: () => void;
}) {
  const label = item.label?.trim() || "Attachment";
  const kind = evidenceFileKind(item.url);

  if (kind === "image") {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50">
        <div className="relative">
          <img
            src={item.url}
            alt={label}
            loading="eager"
            decoding="async"
            className="max-h-[min(52vh,520px)] w-full object-contain"
          />
          {onExpandImage && (
            <button
              type="button"
              onClick={onExpandImage}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Expand
            </button>
          )}
        </div>
        <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-600">{label}</p>
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <PdfPreview
        previewUrl={item.url}
        title={label}
        emptyState="publication"
        className="min-h-[320px]"
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
      <FileText className="h-9 w-9 text-slate-400" />
      <p className="mt-2 text-sm font-medium text-ink">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Preview is not available for this file type.</p>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-sm font-semibold text-brand-700 hover:underline"
      >
        Open file
      </a>
    </div>
  );
}

export function ClaimReviewPanel({ publicationId, evidence, publicationTitle }: Props) {
  const hasEvidence = evidence.length > 0;
  const [tab, setTab] = useState<PreviewTab>(hasEvidence ? "evidence" : "publication");
  const [evidenceIndex, setEvidenceIndex] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const paperPreviewUrl = useMemo(
    () => summaryPdfUrl(publicationId, { inline: true }),
    [publicationId]
  );

  const activeEvidence = evidence[evidenceIndex] ?? evidence[0];

  useEffect(() => {
    if (!hasEvidence && tab === "evidence") {
      setTab("publication");
    }
  }, [hasEvidence, tab]);

  useEffect(() => {
    if (evidenceIndex >= evidence.length) {
      setEvidenceIndex(0);
    }
  }, [evidence.length, evidenceIndex]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxUrl]);

  return (
    <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        {hasEvidence && (
          <button
            type="button"
            onClick={() => setTab("evidence")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === "evidence"
                ? "bg-white text-brand-800 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-600 hover:bg-white/70"
            }`}
          >
            Evidence
            {evidence.length > 1 ? ` (${evidence.length})` : ""}
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab("publication")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            tab === "publication"
              ? "bg-white text-brand-800 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-600 hover:bg-white/70"
          }`}
        >
          Publication PDF
        </button>
      </div>

      <div className="mt-3 grid transition-[grid-template-rows] duration-300 ease-out">
        {tab === "evidence" && hasEvidence && activeEvidence && (
          <div className="space-y-3 animate-fade-up">
            {evidence.length > 1 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {evidence.map((item, index) => (
                  <EvidenceThumb
                    key={item.id}
                    item={item}
                    selected={index === evidenceIndex}
                    onSelect={() => setEvidenceIndex(index)}
                  />
                ))}
              </div>
            )}
            <EvidenceDetail
              item={activeEvidence}
              onExpandImage={
                evidenceFileKind(activeEvidence.url) === "image"
                  ? () => setLightboxUrl(activeEvidence.url)
                  : undefined
              }
            />
          </div>
        )}

        {tab === "publication" && (
          <div className="animate-fade-up">
            <p className="mb-2 text-xs text-slate-500">
              GRE summary PDF for{" "}
              <span className="font-medium text-slate-700">{publicationTitle}</span>
            </p>
            <PdfPreview
              previewUrl={paperPreviewUrl}
              title="Publication manuscript"
              emptyState="publication"
              className="min-h-[320px]"
            />
          </div>
        )}
      </div>

      {lightboxUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/85 p-4"
            role="dialog"
            aria-label="Evidence preview"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxUrl}
              alt="Evidence"
              className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
