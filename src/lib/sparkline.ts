import type { PublicStatsTrendPoint } from "../types";

export type TrendMonthPoint = { month: string; count: number };

/** Extract counts for charts (oldest → newest). */
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

export function pickActivityTrendPoints(
  trend: Record<string, TrendMonthPoint[]> | undefined,
  key: string
): TrendMonthPoint[] {
  return trend?.[key] ?? [];
}

export function asTrendMonthPoints(
  points?: PublicStatsTrendPoint[] | null
): TrendMonthPoint[] {
  return points ?? [];
}
