/** Matches Django REST framework PageNumberPagination responses. */

export const DEFAULT_PAGE_SIZE = 20;

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export function unwrapPaginated<T>(data: T[] | Paginated<T>): Paginated<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    };
  }
  return {
    count: data.count ?? data.results?.length ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: data.results ?? [],
  };
}

export function totalPages(count: number, pageSize: number): number {
  if (count <= 0) return 1;
  return Math.ceil(count / pageSize);
}

export function pageRange(current: number, total: number, maxButtons = 5): number[] {
  if (total <= 1) return [1];
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function resultWindow(page: number, pageSize: number, total: number) {
  if (total <= 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { from, to };
}
