import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";

type Props = {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
};

export function ExtractionErrorBanner({
  message,
  onRetry,
  retrying = false,
  className = "mb-5",
}: Props) {
  return (
    <div
      className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}
      role="alert"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex min-w-0 flex-1 gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
          <span>{message}</span>
        </p>
        {onRetry && (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 !py-2 !px-3 text-xs"
            onClick={onRetry}
            disabled={retrying}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`}
              aria-hidden
            />
            {retrying ? "Retrying…" : "Try again"}
          </Button>
        )}
      </div>
    </div>
  );
}
