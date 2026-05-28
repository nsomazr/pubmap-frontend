import type { ReactNode } from "react";
import { greGradientPremium } from "../../lib/greTheme";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** clean = flat title (Hostinger-style); premium = gradient hero band; default = legacy plain */
  variant?: "clean" | "premium" | "default";
}

export function PageHeader({ title, description, action, className = "", variant = "clean" }: Props) {
  if (variant === "premium") {
    return (
      <div
        className={`mb-6 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm ${greGradientPremium} ${className}`}
      >
        <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
            aria-hidden
          />
          <div className="relative min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/75">{description}</p>
            )}
          </div>
          {action && <div className="relative shrink-0">{action}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0 sm:border-l-[3px] sm:border-brand-500 sm:pl-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
