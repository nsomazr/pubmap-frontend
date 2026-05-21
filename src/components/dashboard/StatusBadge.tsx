const styles: Record<string, string> = {
  "0": "bg-slate-100 text-slate-700 ring-slate-200",
  "1": "bg-amber-50 text-amber-800 ring-amber-200",
  "2": "bg-orange-50 text-orange-800 ring-orange-200",
  "3": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "4": "bg-slate-200 text-slate-600 ring-slate-300",
};

const labels: Record<string, string> = {
  "0": "Draft",
  "1": "Pending",
  "2": "Revision",
  "3": "Published",
  "4": "Hidden",
};

export function StatusBadge({ status }: { status: number | string }) {
  const key = String(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[key] ?? styles["0"]}`}
    >
      {labels[key] ?? key}
    </span>
  );
}
