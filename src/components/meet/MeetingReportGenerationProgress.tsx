import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { MeetSummaryStatus } from "../../types";

type Props = {
  status: MeetSummaryStatus;
  ended: boolean;
  messageCount: number;
  errorMessage?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
};

const STEPS = [
  { id: "close", label: "Finalizing meeting" },
  { id: "transcript", label: "Processing transcript" },
  { id: "summary", label: "Generating summary" },
  { id: "report", label: "Preparing host report" },
] as const;

export function MeetingReportGenerationProgress({
  status,
  ended,
  messageCount,
  errorMessage,
  onRetry,
  retrying,
}: Props) {
  const [animated, setAnimated] = useState(12);

  useEffect(() => {
    if (status !== "pending") return;
    const id = window.setInterval(() => {
      setAnimated((value) => {
        if (value >= 90) return value;
        return value + 4 + Math.random() * 5;
      });
    }, 700);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === "ready") setAnimated(100);
    if (status === "failed") setAnimated(0);
    if (status === "pending") setAnimated(12);
  }, [status]);

  const activeStep = useMemo(() => {
    if (status === "ready") return STEPS.length;
    if (!ended) return 0;
    if (messageCount === 0) return 1;
    if (animated < 55) return 2;
    return 3;
  }, [animated, ended, messageCount, status]);

  if (status === "none" && ended) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">Report not started</p>
        <p className="mt-1 text-amber-800/90">
          Generate the archive report to create an editable summary for attendees.
        </p>
        {onRetry ? (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
            disabled={retrying}
            onClick={onRetry}
          >
            {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Generate report
          </button>
        ) : null}
      </div>
    );
  }

  if (status !== "pending" && status !== "failed") {
    return null;
  }

  const progress = status === "failed" ? 0 : Math.round(animated);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        {status === "pending" ? (
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-brand-600" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {status === "pending" ? "Generating meeting report…" : "Report generation failed"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {status === "pending"
              ? "GRE is building the archive summary from your transcript and assistant notes. This usually takes under a minute."
              : errorMessage ||
                "Something went wrong while creating the report. You can retry or write the report manually."}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-brand-700">{progress}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
            status === "failed" ? "bg-red-400" : "bg-gradient-to-r from-brand-500 to-cyan-500"
          }`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <ol className="space-y-2">
        {STEPS.map((step, index) => {
          const done = index < activeStep;
          const current = status === "pending" && index === activeStep;
          return (
            <li key={step.id} className="flex items-center gap-2 text-xs">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-brand-600 text-white"
                    : current
                      ? "bg-brand-100 text-brand-800 ring-2 ring-brand-200"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className={done || current ? "font-medium text-slate-700" : "text-slate-400"}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {status === "failed" && onRetry ? (
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          disabled={retrying}
          onClick={onRetry}
        >
          {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Retry generation
        </button>
      ) : null}
    </div>
  );
}
