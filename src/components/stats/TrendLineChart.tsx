import type { PublicStatsTrendPoint } from "../../types";

interface Props {
  points: PublicStatsTrendPoint[];
  height?: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthLabel(ym: string) {
  const [, mm] = ym.split("-");
  const idx = Number(mm) - 1;
  if (idx >= 0 && idx < 12) return MONTH_NAMES[idx];
  return mm || ym;
}

export function TrendLineChart({ points, height = 180 }: Props) {
  const total = points.reduce((sum, p) => sum + p.count, 0);

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
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(...points.map((p) => p.count), 1);

  const coords = points.map((point, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * innerW;
    const y = padY + innerH - (point.count / max) * innerH;
    return { ...point, x, y };
  });

  const line = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${coords[0]?.x ?? padX},${padY + innerH} ${line} ${coords[coords.length - 1]?.x ?? padX},${padY + innerH}`;

  const labelStep = points.length > 8 ? 2 : 1;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[320px]" role="img" aria-label="Publication trend over the last 12 months">
        <title>Publications per month</title>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b5bdb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b5bdb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
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
        <polygon points={area} fill="url(#trendFill)" />
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
              r={point.count > 0 ? 4 : 2.5}
              fill={point.count > 0 ? "#3b5bdb" : "#cbd5e1"}
            />
            {index % labelStep === 0 && (
              <text
                x={point.x}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {formatMonthLabel(point.month)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-xs text-slate-400">
        Last 12 months · {total} publication{total === 1 ? "" : "s"} total
      </p>
    </div>
  );
}
