import { forwardRef, type SelectHTMLAttributes } from "react";
import { RequiredMark } from "./RequiredField";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, className = "", id, children, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
            {props.required ? <RequiredMark /> : null}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 ${error ? "border-red-400" : ""} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
