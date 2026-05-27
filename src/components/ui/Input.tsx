import type { InputHTMLAttributes } from "react";
import { greFieldClass } from "../../lib/formStyles";
import { RequiredMark } from "./RequiredField";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", id, ...props }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <label htmlFor={inputId} className="block text-sm font-medium text-ink">
            {label}
            {props.required ? <RequiredMark /> : null}
          </label>
          {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
      )}
      <input
        id={inputId}
        className={`${greFieldClass} ${error ? "!border-red-400 focus:!border-red-400 focus:!ring-red-100" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
