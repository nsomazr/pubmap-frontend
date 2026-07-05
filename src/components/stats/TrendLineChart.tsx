import type { PublicStatsTrendPoint } from "../../types";
import { formatTrendMonthLabel, trendSummary } from "../../lib/chartFormat";
import type { TrendMonthPoint } from "../../lib/sparkline";

interface Props {
  points: PublicStatsTrendPoint[];
  height?: number;
}

export function TrendLineChart({ points, height = 200 }: Props) {
  const trendPoints: TrendMonthPoint[] = points;
  const summary = trendSummary(trendPoints);
  const total = summary.total;

  if (points.length === 0 || total === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {points.length === 0
          ? "Not enough history to plot a trend yet."
          : "No published papers in the last 12 months yet. Trends appear as submissions are approved."}
      </p>
    );
  }

  const width = 640;
  const padX = 36;
  const padY = 28;
  const padBottom = 22;
  const innerW = width - padX * 2;
  const innerH = height - padY - padBottom;
  const max = Math.max(...points.map((p) => p.count), 1);
  const barWidth = innerW / points.length - 6;

  const coords = points.map((point, index) => {
    const x = padX + index * (innerW / Math.max(points.length - 1, 1));
    const barX = padX + index * (innerW / points.length) + 3;
    const y = padY + innerH - (point.count / max) * innerH;
    const barH = (point.count / max) * innerH;
    return { ...point, x, y, barX, barH };
  });

  const line = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const labelStep = points.length > 8 ? 2 : 1;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[320px]"
        role="img"
        aria-label="Publication trend over the last 12 months"
      >
        <title>Publications per month</title>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padY + innerH - tick * innerH;
          const value = Math.round(max * tick);
          return (
            <g key={tick}>
              <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padX - 6} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">
                {value}
              </text>
            </g>
          );
        })}
        {coords.map((point) => (
          <rect
            key={`bar-${point.month}`}
            x={point.barX}
            y={padY + innerH - Math.max(point.barH, point.count > 0 ? innerH * 0.06 : 0)}
            width={Math.max(barWidth, 4)}
            height={Math.max(point.barH, point.count > 0 ? innerH * 0.06 : 0)}
            rx={3}
            fill="#3b5bdb"
            opacity={point.count > 0 ? 0.18 : 0.08}
          />
        ))}
        {points.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="#3b5bdb"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {coords.map((point, index) => (
          <g key={point.month}>
            <circle
              cx={point.x}
              cy={point.y}
              r={point.count > 0 ? 4.5 : 2.5}
              fill={point.count > 0 ? "#3b5bdb" : "#cbd5e1"}
              stroke="#fff"
              strokeWidth="1.5"
            />
            {index % labelStep === 0 && (
              <text
                x={point.x}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {formatTrendMonthLabel(point.month)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-xs text-slate-500">{summary.caption}</p>
    </div>
  );
}
