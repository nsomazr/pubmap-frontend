import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { TrendMonthPoint } from "../../lib/sparkline";
import { MetricRatioBar } from "./MetricRatioBar";
import { MetricTrendChart } from "./MetricTrendChart";

interface RatioProps {
  value: number;
  max: number;
  label: string;
  color?: string;
}

interface Props {
  label: string;
  value: number | string | ReactNode;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  valueClassName?: string;
  trendPoints?: TrendMonthPoint[] | null;
  chartColor?: string;
  ratio?: RatioProps;
  className?: string;
}

/** Non-interactive metric tile (public stats, hero figures). */
export function StatDisplayTile({
  label,
  value,
  hint,
  icon: Icon,
  loading = false,
  valueClassName = "text-ink",
  trendPoints,
  chartColor,
  ratio,
  className = "",
}: Props) {
  return (
    <article className={`gre-dashboard-card flex h-full flex-col p-4 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <span className="text-xs font-semibold text-slate-500">{label}</span>
        </div>
      </div>
      <p className={`mt-3 text-3xl font-bold tabular-nums leading-none ${valueClassName}`}>
        {loading ? "—" : value}
      </p>
      <div className="mt-auto">
        {trendPoints ? (
          <MetricTrendChart points={trendPoints} color={chartColor ?? "#3b5bdb"} />
        ) : ratio ? (
          <MetricRatioBar
            value={ratio.value}
            max={ratio.max}
            label={ratio.label}
            color={ratio.color ?? chartColor}
          />
        ) : null}
        {hint && <p className="mt-2 text-[11px] leading-snug text-slate-500">{hint}</p>}
      </div>
    </article>
  );
}
