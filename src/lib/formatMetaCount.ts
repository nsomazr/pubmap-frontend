/** Paper metadata rows: label carries the unit; value is the number only. */

export function metaCountValue(count: number | null | undefined): string {
  return String(count ?? 0);
}
