import type { TrendMonthPoint } from "./sparkline";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatTrendMonthLabel(ym: string): string {
  const [, mm] = ym.split("-");
  const idx = Number(mm) - 1;
  if (idx >= 0 && idx < 12) return MONTH_NAMES[idx];
  return mm || ym;
}

export function trendSummary(points: TrendMonthPoint[]): {
  total: number;
  peak: number;
  peakLabel: string;
  caption: string;
} {
  if (points.length === 0) {
    return { total: 0, peak: 0, peakLabel: "", caption: "No activity yet" };
  }
  const total = points.reduce((sum, row) => sum + row.count, 0);
  const peakRow = points.reduce(
    (best, row) => (row.count > best.count ? row : best),
    points[0]
  );
  if (total === 0) {
    return {
      total: 0,
      peak: 0,
      peakLabel: formatTrendMonthLabel(points[points.length - 1]?.month ?? ""),
      caption: "No activity in the last 8 months",
    };
  }
  const peakLabel = formatTrendMonthLabel(peakRow.month);
  return {
    total,
    peak: peakRow.count,
    peakLabel,
    caption: `${total} total · peak ${peakRow.count} in ${peakLabel}`,
  };
}
