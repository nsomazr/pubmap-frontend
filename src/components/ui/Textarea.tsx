import { forwardRef, type TextareaHTMLAttributes } from "react";
import { greFieldClass } from "../../lib/formStyles";
import { RequiredMark } from "./RequiredField";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
            {props.required ? <RequiredMark /> : null}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`${greFieldClass} resize-y min-h-[5rem] ${error ? "!border-red-400 focus:!border-red-400 focus:!ring-red-100" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
