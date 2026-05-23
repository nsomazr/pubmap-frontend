const styles: Record<string, string> = {
  "0": "bg-slate-100 text-slate-700 ring-slate-200",
  "1": "bg-brand-50 text-brand-800 ring-brand-200",
  "2": "bg-brand-100 text-brand-800 ring-brand-200/80",
  "3": "bg-teal-50 text-teal-800 ring-teal-200",
  "4": "bg-slate-200 text-slate-600 ring-slate-300",
  "6": "bg-slate-300 text-slate-700 ring-slate-400",
};

const labels: Record<string, string> = {
  "0": "Draft",
  "1": "Pending",
  "2": "Revision",
  "3": "Published",
  "4": "Archived",
  "6": "Deleted",
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
