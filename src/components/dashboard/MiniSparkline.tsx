interface Props {
  points: number[];
  className?: string;
  stroke?: string;
  height?: number;
}

/** Compact area sparkline (Hostinger-style metric charts). */
export function MiniSparkline({
  points,
  className = "",
  stroke = "#3b5bdb",
  height = 40,
}: Props) {
  const width = 120;
  const pad = 2;
  const max = Math.max(...points, 1);
  const innerH = height - pad * 2;
  const innerW = width - pad * 2;

  if (points.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`w-full opacity-40 ${className}`}
        aria-hidden
      >
        <line
          x1={pad}
          x2={width - pad}
          y1={height / 2}
          y2={height / 2}
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  const coords = points.map((value, index) => {
    const x = pad + (index / Math.max(points.length - 1, 1)) * innerW;
    const y = pad + innerH - (value / max) * innerH;
    return { x, y };
  });

  const line = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${coords[0]?.x ?? pad},${pad + innerH} ${line} ${coords[coords.length - 1]?.x ?? pad},${pad + innerH}`;
  const gradientId = `spark-${stroke.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
