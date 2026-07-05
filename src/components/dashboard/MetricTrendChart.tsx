import type { TrendMonthPoint } from "../../lib/sparkline";
import { formatTrendMonthLabel, trendSummary } from "../../lib/chartFormat";

interface Props {
  points?: TrendMonthPoint[] | null;
  color?: string;
  height?: number;
  className?: string;
  emptyMessage?: string;
}

/** Readable mini bar chart for dashboard metric tiles. */
export function MetricTrendChart({
  points,
  color = "#3b5bdb",
  height = 80,
  className = "",
  emptyMessage = "No activity in this period",
}: Props) {
  const rows = points ?? [];

  if (rows.length === 0) {
    return (
      <div
        className={`mt-3 flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 text-center text-[11px] leading-snug text-slate-500 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  const counts = rows.map((row) => row.count);
  const max = Math.max(...counts, 1);
  const summary = trendSummary(rows);
  const width = 280;
  const padX = 22;
  const padTop = 8;
  const padBottom = 18;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const barGap = 4;
  const barWidth = Math.max(8, (innerW - barGap * (rows.length - 1)) / rows.length);
  const labelIndexes =
    rows.length <= 4
      ? rows.map((_, index) => index)
      : [0, Math.floor((rows.length - 1) / 2), rows.length - 1];

  return (
    <div className={`mt-3 ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Trend chart, total ${summary.total}`}
      >
        <title>{summary.caption}</title>
        <line
          x1={padX}
          x2={width - padX}
          y1={padTop + innerH}
          y2={padTop + innerH}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <text
          x={padX - 4}
          y={padTop + innerH + 1}
          textAnchor="end"
          className="fill-slate-400 text-[8px]"
        >
          0
        </text>
        <text
          x={padX - 4}
          y={padTop + 8}
          textAnchor="end"
          className="fill-slate-400 text-[8px]"
        >
          {max}
        </text>
        {rows.map((row, index) => {
          const x = padX + index * (barWidth + barGap);
          const ratio = row.count / max;
          const barH = row.count > 0 ? Math.max(ratio * innerH, innerH * 0.12) : innerH * 0.08;
          const y = padTop + innerH - barH;
          return (
            <g key={row.month}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                fill={row.count > 0 ? color : "#cbd5e1"}
                opacity={row.count > 0 ? 0.92 : 0.45}
              />
              {labelIndexes.includes(index) ? (
                <text
                  x={x + barWidth / 2}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-slate-500 text-[8px]"
                >
                  {formatTrendMonthLabel(row.month)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="mt-1.5 text-[10px] leading-snug text-slate-500">{summary.caption}</p>
    </div>
  );
}
