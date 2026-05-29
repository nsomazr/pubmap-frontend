import { Loader2, Sparkles } from "lucide-react";

type Variant = "compact" | "bubble";

interface Props {
  variant?: Variant;
  className?: string;
}

/** Consistent GRE Assistant “thinking” state while a model response is loading. */
export function AssistantThinkingIndicator({ variant = "bubble", className = "" }: Props) {
  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center gap-2 text-sm text-slate-500 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden />
        Thinking…
      </span>
    );
  }

  return (
    <div className={`flex gap-2.5 ${className}`} role="status" aria-live="polite" aria-label="Thinking">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm text-slate-600 ring-1 ring-slate-200/80">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden />
          Thinking…
        </span>
      </div>
    </div>
  );
}
