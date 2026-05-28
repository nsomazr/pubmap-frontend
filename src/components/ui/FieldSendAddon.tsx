import { Loader2, Send, type LucideIcon } from "lucide-react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";

type BaseProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  submitLabel?: string;
  submitAriaLabel?: string;
  icon?: LucideIcon;
  className?: string;
  enterToSubmit?: boolean;
};

export function InputWithSendAddon({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  loading = false,
  submitLabel,
  submitAriaLabel = "Send",
  icon: Icon = Send,
  className = "",
  enterToSubmit = true,
}: BaseProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled || loading || !value.trim()) return;
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!enterToSubmit || event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (disabled || loading || !value.trim()) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-[4.75rem] text-sm text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
      />
      <button
        type="submit"
        disabled={disabled || loading || !value.trim()}
        aria-label={submitAriaLabel}
        className="absolute right-1.5 top-1/2 inline-flex h-8 min-w-[2.75rem] -translate-y-1/2 items-center justify-center gap-1 rounded-lg bg-brand-600 px-2.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Icon className="h-4 w-4 shrink-0" />
            {submitLabel ? <span className="hidden sm:inline">{submitLabel}</span> : null}
          </>
        )}
      </button>
    </form>
  );
}

type TextareaProps = BaseProps & {
  rows?: number;
  footer?: ReactNode;
};

export function TextareaWithSendAddon({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  loading = false,
  submitLabel,
  submitAriaLabel = "Send",
  icon: Icon = Send,
  className = "",
  enterToSubmit = true,
  rows = 3,
  footer,
}: TextareaProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled || loading || !value.trim()) return;
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!enterToSubmit || event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (disabled || loading || !value.trim()) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={rows}
          className="block w-full resize-y border-0 bg-transparent px-3.5 py-3 pr-14 text-sm text-ink outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={disabled || loading || !value.trim()}
          aria-label={submitAriaLabel}
          className="absolute bottom-2 right-2 inline-flex h-9 min-w-[2.75rem] items-center justify-center gap-1 rounded-lg bg-brand-600 px-2.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Icon className="h-4 w-4 shrink-0" />
              {submitLabel ? <span className="hidden sm:inline">{submitLabel}</span> : null}
            </>
          )}
        </button>
      </div>
      {footer}
    </form>
  );
}
