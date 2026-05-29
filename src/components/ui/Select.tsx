import { forwardRef, type SelectHTMLAttributes } from "react";
import { greFieldClass } from "../../lib/formStyles";
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
          <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
            {label}
            {props.required ? <RequiredMark /> : null}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`${greFieldClass} ${error ? "!border-red-400 focus:!border-red-400 focus:!ring-red-100" : ""} ${className}`}
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
