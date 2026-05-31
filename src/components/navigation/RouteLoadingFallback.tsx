import { Loader2 } from "lucide-react";

interface Props {
  label?: string;
  /** Full-viewport overlay for top-level route transitions. */
  overlay?: boolean;
}

export function RouteLoadingFallback({
  label = "Loading page…",
  overlay = false,
}: Props) {
  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-[10040] flex flex-col items-center justify-center gap-4 bg-[#eef1f8]/92 backdrop-blur-[2px]"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/80 bg-white px-8 py-7 shadow-lg ring-1 ring-slate-200/80">
          <Loader2 className="h-9 w-9 animate-spin text-brand-600" aria-hidden />
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="max-w-xs text-center text-xs text-slate-500">
            Fetching this section of GRE. Usually just a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[min(50vh,28rem)] flex-col items-center justify-center gap-3 py-16 text-slate-500"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200/90" aria-hidden />
      <Loader2 className="-mt-7 h-8 w-8 animate-spin text-brand-600" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
