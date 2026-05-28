import { Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface Props {
  storageKey: string;
  children: ReactNode;
  action?: ReactNode;
}

export function InfoBanner({ storageKey, children, action }: Props) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="gre-info-banner flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <div className="min-w-0 text-sm leading-relaxed text-slate-700">{children}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:pl-2">
        {action}
        <button
          type="button"
          onClick={dismiss}
          className="gre-interactive rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
