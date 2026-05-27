import { Loader2 } from "lucide-react";
import {
  extractionProgressLabel,
  useExtractionProgress,
} from "../../hooks/useExtractionProgress";

type ExtractionLoadingPanelProps = {
  compact?: boolean;
};

export function ExtractionLoadingPanel({ compact = false }: ExtractionLoadingPanelProps) {
  const progress = useExtractionProgress(true);
  const label = extractionProgressLabel(progress);
  const displayPercent = Math.round(progress);

  return (
    <div
      className={`rounded-2xl border border-brand-200 bg-white/90 shadow-sm ${
        compact ? "mt-3 px-4 py-4" : "mb-5 px-5 py-5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-900">Extracting manuscript details</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            GRE is reading the file and preparing the title plus manuscript sections for review.
          </p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-brand-900">{label}</p>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-brand-700">
                {displayPercent}%
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-slate-200/90"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={displayPercent}
              aria-valuetext={`${displayPercent}% — ${label}`}
            >
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/25 to-transparent" />
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Progress is estimated while GRE works. Scanned PDFs and long manuscripts can take several
              minutes — the bar keeps moving until extraction finishes.
            </p>
          </div>

          {!compact && (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
