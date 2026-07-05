interface BarItem {
  label: string;
  value: number;
  hint?: string;
}

interface Props {
  items: BarItem[];
  colorClass?: string;
  emptyMessage?: string;
}

export function HorizontalBarChart({
  items,
  colorClass = "from-brand-600 to-teal-600",
  emptyMessage = "No data yet",
}: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  const max = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
        <div key={`${item.label}-${item.hint ?? ""}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-ink" title={item.label}>
              {item.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-600">
              {item.value.toLocaleString()}
              {total > 0 ? (
                <span className="ml-1 text-xs font-medium text-slate-400">({pct}%)</span>
              ) : null}
            </span>
          </div>
          {item.hint && <p className="mb-1 truncate text-xs text-slate-400">{item.hint}</p>}
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700`}
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            />
          </div>
        </div>
        );
      })}
    </div>
  );
}
