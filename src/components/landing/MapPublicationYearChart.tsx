type YearCount = { year: number; count: number };

interface Props {
  data: YearCount[];
  className?: string;
}

export function MapPublicationYearChart({ data, className = "" }: Props) {
  const series = data.filter((row) => row.year > 1900 && row.count > 0);
  if (series.length === 0) return null;

  const max = Math.max(...series.map((row) => row.count), 1);

  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Publications by year
      </p>
      <div
        className="mt-2 flex h-20 items-end gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label="Bar chart of publications per year"
      >
        {series.map((row) => (
          <div
            key={row.year}
            className="flex min-w-[28px] flex-1 flex-col items-center justify-end gap-1"
            title={`${row.year}: ${row.count} publication${row.count === 1 ? "" : "s"}`}
          >
            <span className="text-[10px] font-semibold text-slate-600">{row.count}</span>
            <div
              className="w-full max-w-[22px] rounded-t-md bg-gradient-to-t from-brand-700 to-brand-500"
              style={{ height: `${Math.max(8, (row.count / max) * 56)}px` }}
            />
            <span className="text-[10px] font-medium text-slate-500">{row.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
