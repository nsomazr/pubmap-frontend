import type { InputHTMLAttributes } from "react";
import { greFieldClass } from "../../lib/formStyles";
import { RequiredMark } from "./RequiredField";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
          {props.required ? <RequiredMark /> : null}
        </label>
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
