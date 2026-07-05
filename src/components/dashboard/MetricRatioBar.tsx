interface Props {
  value: number;
  max: number;
  label: string;
  color?: string;
  className?: string;
  caption?: string;
}

/** Snapshot proportion bar when no time-series exists. */
export function MetricRatioBar({
  value,
  max,
  label,
  color = "#0d9488",
  className = "",
  caption,
}: Props) {
  const safeMax = Math.max(max, 1);
  const pct = Math.round((value / safeMax) * 100);
  const detail =
    caption ?? `${value.toLocaleString()} of ${max.toLocaleString()} publications`;

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
        <span>{label}</span>
        <span className="font-semibold tabular-nums text-slate-600">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(pct, value > 0 ? 6 : 0)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <p className="mt-1.5 text-[10px] leading-snug text-slate-500">{detail}</p>
    </div>
  );
}
