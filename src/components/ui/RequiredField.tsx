interface RequiredFieldsLegendProps {
  className?: string;
}

export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-red-500">
        *
      </span>
      <span className="sr-only"> required</span>
    </>
  );
}

export function RequiredFieldsLegend({ className = "" }: RequiredFieldsLegendProps) {
  return (
    <p className={`text-xs text-slate-500 ${className}`.trim()}>
      <span aria-hidden="true" className="font-semibold text-red-500">
        *
      </span>{" "}
      indicates a required field.
    </p>
  );
}
