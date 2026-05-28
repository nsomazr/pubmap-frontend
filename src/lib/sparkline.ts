import type { PublicStatsTrendPoint } from "../types";

export type TrendMonthPoint = { month: string; count: number };

/** Extract counts for mini sparklines (oldest → newest). */
export function trendToSparkline(points?: TrendMonthPoint[] | null): number[] {
  if (!points?.length) return [];
  return points.map((row) => row.count);
}

export function pickActivityTrend(
  trend: Record<string, TrendMonthPoint[]> | undefined,
  key: string
): number[] {
  return trendToSparkline(trend?.[key]);
}
