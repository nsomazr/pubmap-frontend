import { Loader2 } from "lucide-react";

export function RouteLoadingFallback({ label = "Loading page…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-transparent text-slate-500"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
