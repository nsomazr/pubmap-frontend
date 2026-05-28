import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEFAULT_PAGE_SIZE,
  pageRange,
  resultWindow,
  totalPages,
} from "../../lib/pagination";

type Props = {
  page: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string;
};

export function Pagination({
  page,
  totalCount,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  className = "",
  itemLabel = "items",
}: Props) {
  const pages = totalPages(totalCount, pageSize);
  const safePage = Math.min(Math.max(1, page), pages);
  const { from, to } = resultWindow(safePage, pageSize, totalCount);

  if (totalCount <= pageSize) {
    if (totalCount === 0) return null;
    return (
      <p className={`text-center text-xs text-slate-500 ${className}`}>
        {totalCount} {totalCount === 1 ? itemLabel.replace(/s$/, "") : itemLabel}
      </p>
    );
  }

  const buttons = pageRange(safePage, pages);

  return (
    <nav
      className={`flex flex-col items-center gap-3 sm:flex-row sm:justify-between ${className}`}
      aria-label="Pagination"
    >
      <p className="text-xs text-slate-500 tabular-nums">
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{totalCount}</span> {itemLabel}
      </p>

      <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="gre-interactive inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {buttons[0] > 1 && (
          <>
            <PageNum n={1} active={safePage === 1} onSelect={onPageChange} />
            {buttons[0] > 2 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}

        {buttons.map((n) => (
          <PageNum key={n} n={n} active={n === safePage} onSelect={onPageChange} />
        ))}

        {buttons[buttons.length - 1] < pages && (
          <>
            {buttons[buttons.length - 1] < pages - 1 && (
              <span className="px-1 text-slate-400">…</span>
            )}
            <PageNum n={pages} active={safePage === pages} onSelect={onPageChange} />
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= pages}
          className="gre-interactive inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

function PageNum({
  n,
  active,
  onSelect,
}: {
  n: number;
  active: boolean;
  onSelect: (page: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(n)}
      aria-current={active ? "page" : undefined}
      className={`gre-interactive min-w-[2rem] rounded-lg px-2.5 py-1.5 text-xs font-semibold tabular-nums ${
        active ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {n}
    </button>
  );
}
