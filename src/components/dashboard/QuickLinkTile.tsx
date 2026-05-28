import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  to: string;
  label: string;
  value?: string | number;
  description?: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export function QuickLinkTile({
  to,
  label,
  value,
  description,
  icon: Icon,
  highlight = false,
}: Props) {
  return (
    <Link
      to={to}
      className={`gre-quick-tile group ${highlight ? "gre-quick-tile--highlight" : ""}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            highlight
              ? "bg-violet-100 text-violet-800"
              : "bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink group-hover:text-brand-800">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {value != null && value !== "" && (
          <span className="text-sm font-bold tabular-nums text-slate-700">{value}</span>
        )}
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600" />
      </div>
    </Link>
  );
}
