import type { PublicStatsTrendPoint } from "../../types";

interface Props {
  points: PublicStatsTrendPoint[];
  height?: number;
}

export function TrendLineChart({ points, height = 160 }: Props) {
  if (points.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        Not enough history to plot a trend yet.
      </p>
    );
  }

  const width = 640;
  const padX = 28;
  const padY = 24;
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

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[320px]" role="img">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padY + innerH - tick * innerH;
          return (
            <line
              key={tick}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}
        <polygon points={area} fill="url(#trendFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} r="4" fill="#2563eb" />
            <text
              x={point.x}
              y={height - 4}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {point.month.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
