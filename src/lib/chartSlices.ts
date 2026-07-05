export const CHART_SLICE_COLORS = [
  "#3b5bdb",
  "#0d9488",
  "#7c3aed",
  "#d97706",
  "#0891b2",
  "#65a30d",
  "#db2777",
  "#4f46e5",
  "#ea580c",
  "#64748b",
  "#14b8a6",
  "#ca8a04",
] as const;

export function formatChartShare(count: number, total: number) {
  if (total <= 0) return "0%";
  const pct = (count / total) * 100;
  return pct >= 10 || pct === 0 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
}

export function chartSliceColor(index: number) {
  return CHART_SLICE_COLORS[index % CHART_SLICE_COLORS.length];
}

export function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

export type ChartSlice = {
  id: string;
  label: string;
  hint?: string;
  value: number;
  color: string;
  startAngle: number;
  endAngle: number;
  share: string;
};

export function buildChartSlices(
  items: { id: string; label: string; hint?: string; value: number }[]
): ChartSlice[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;

  return items.map((item, index) => {
    const sweep = total > 0 ? (item.value / total) * 360 : 0;
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    cursor = endAngle;

    return {
      id: item.id,
      label: item.label,
      hint: item.hint,
      value: item.value,
      color: chartSliceColor(index),
      startAngle,
      endAngle,
      share: formatChartShare(item.value, total),
    };
  });
}
