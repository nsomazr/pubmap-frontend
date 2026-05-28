import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MiniSparkline } from "./MiniSparkline";

interface Props {
  label: string;
  value: number | string;
  hint?: string;
  to: string;
  icon?: LucideIcon;
  loading?: boolean;
  valueClassName?: string;
  sparkline?: number[];
  sparklineColor?: string;
}

export function MetricTile({
  label,
  value,
  hint,
  to,
  icon: Icon,
  loading = false,
  valueClassName = "text-ink",
  sparkline,
  sparklineColor,
}: Props) {
  return (
    <Link to={to} className="gre-metric-tile group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <span className="text-xs font-semibold text-slate-500">{label}</span>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </div>
      <p className={`mt-3 text-3xl font-bold tabular-nums leading-none ${valueClassName}`}>
        {loading ? "—" : value}
      </p>
      {sparkline && sparkline.length > 0 && (
        <MiniSparkline
          points={sparkline}
          className="mt-3 max-h-10"
          stroke={sparklineColor ?? "#3b5bdb"}
        />
      )}
      {hint && <p className="mt-2 text-[11px] leading-snug text-slate-500">{hint}</p>}
    </Link>
  );
}
