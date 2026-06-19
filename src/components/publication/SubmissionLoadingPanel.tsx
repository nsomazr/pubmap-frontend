import {
  BookOpen,
  Check,
  Circle,
  FileText,
  Loader2,
  Send,
} from "lucide-react";
import {
  useExtractionElapsedSeconds,
  useExtractionProgress,
} from "../../hooks/useExtractionProgress";
import {
  SUBMISSION_STEPS,
  submissionActiveStepIndex,
} from "../../hooks/useSubmissionProgress";

const FIELD_CHIPS = [
  "Title",
  "Abstract",
  "Manuscript",
  "Figures",
  "Co-authors",
  "Funding",
  "Location",
  "Review queue",
] as const;

type SubmissionLoadingPanelProps = {
  compact?: boolean;
  title?: string;
  manuscriptFileName?: string | null;
};

function StepIcon({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 ring-2 ring-brand-200">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200/80">
      <Circle className="h-2.5 w-2.5 fill-current" aria-hidden />
    </span>
  );
}

export function SubmissionLoadingPanel({
  compact = false,
  title,
  manuscriptFileName,
}: SubmissionLoadingPanelProps) {
  const progress = useExtractionProgress(true);
  const elapsedSeconds = useExtractionElapsedSeconds(true);
  const activeIndex = submissionActiveStepIndex(progress);
  const displayTitle = title?.trim() || "Your publication";
  const displayFile = manuscriptFileName?.trim();
  const longWait = elapsedSeconds >= 45;

  return (
    <div
      className={`overflow-hidden border-brand-200/80 bg-gradient-to-br from-brand-50/40 via-white to-white ${
        compact ? "" : "rounded-2xl border"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={`${compact ? "p-4" : "p-5 sm:p-6"}`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Send className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-ink">Submitting for admin review</p>
            <p className="mt-1 text-sm text-slate-600">
              <span className="line-clamp-2 font-medium text-slate-700">{displayTitle}</span>
            </p>
            {displayFile && (
              <p className="mt-1 text-sm text-slate-600">
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
                  <span className="truncate font-medium text-slate-700">{displayFile}</span>
                </span>
              </p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              This usually takes under a minute. You&apos;ll return to your publications list when
              review begins.
            </p>
          </div>
        </div>

        <ol className="mt-5 space-y-0">
          {SUBMISSION_STEPS.map((step, index) => {
            const state =
              index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";
            const isLast = index === SUBMISSION_STEPS.length - 1;
            return (
              <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast && (
                  <span
                    className={`absolute left-[13px] top-8 bottom-0 w-0.5 ${
                      index < activeIndex ? "bg-brand-300" : "bg-slate-200"
                    }`}
                    aria-hidden
                  />
                )}
                <StepIcon state={state} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={`text-sm font-semibold ${
                      state === "active"
                        ? "text-brand-800"
                        : state === "done"
                          ? "text-slate-700"
                          : "text-slate-400"
                    }`}
                  >
                    {step.title}
                    {state === "active" && (
                      <span className="ml-2 text-xs font-medium text-brand-600">Now</span>
                    )}
                  </p>
                  <p
                    className={`mt-0.5 text-xs leading-relaxed ${
                      state === "pending" ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {step.id === "review" && state === "active" && longWait
                      ? "Still working — large manuscripts or many figures can take a little longer at the end."
                      : step.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          className="mt-4 h-1 overflow-hidden rounded-full bg-slate-200/90"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>

        {!compact && (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              What we&apos;re packaging for review
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FIELD_CHIPS.map((chip, i) => {
                const filled = i <= activeIndex + 2;
                return (
                  <span
                    key={chip}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                      filled
                        ? "bg-brand-50 text-brand-800 ring-brand-100"
                        : "bg-white text-slate-400 ring-slate-200/80"
                    }`}
                  >
                    {chip}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {longWait && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-100">
            This is taking a bit longer than usual. Large files or many figures can need an extra
            minute. Please keep this tab open.
          </p>
        )}
      </div>
    </div>
  );
}
