import { Loader2, Send, type LucideIcon } from "lucide-react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";

type Variant = "light" | "dark";

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
  variant?: Variant;
  hint?: string;
};

const shellClass: Record<Variant, string> = {
  light:
    "border-slate-200/90 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100/80",
  dark: "border-slate-600/80 bg-slate-950/90 shadow-sm shadow-black/20 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-900/40",
};

const fieldClass: Record<Variant, string> = {
  light:
    "text-ink placeholder:text-slate-400 disabled:text-slate-400",
  dark: "text-slate-100 placeholder:text-slate-500 disabled:text-slate-500",
};

const footerClass: Record<Variant, string> = {
  light: "border-slate-100 bg-slate-50/80",
  dark: "border-slate-700/80 bg-slate-900/60",
};

const hintClass: Record<Variant, string> = {
  light: "text-slate-400",
  dark: "text-slate-500",
};

const submitBtnClass: Record<Variant, string> = {
  light:
    "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-45",
  dark: "bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-45",
};

function SubmitButton({
  loading,
  disabled,
  submitAriaLabel,
  submitLabel,
  Icon,
  compact,
  variant,
}: {
  loading: boolean;
  disabled: boolean;
  submitAriaLabel: string;
  submitLabel?: string;
  Icon: LucideIcon;
  compact?: boolean;
  variant: Variant;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label={submitAriaLabel}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold transition disabled:cursor-not-allowed ${
        compact ? "h-8 rounded-lg px-2.5 text-xs" : "h-9 rounded-xl px-3 text-sm"
      } ${submitBtnClass[variant]}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Icon className="h-4 w-4 shrink-0" />
          {submitLabel ? <span className={compact ? "hidden min-[380px]:inline" : ""}>{submitLabel}</span> : null}
        </>
      )}
    </button>
  );
}

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
  variant = "light",
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
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 rounded-2xl border p-1.5 pl-3 pr-1.5 transition ${shellClass[variant]} ${className}`}
    >
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        className={`min-h-9 min-w-0 flex-1 border-0 bg-transparent py-1.5 text-sm outline-none ${fieldClass[variant]}`}
      />
      <SubmitButton
        loading={loading}
        disabled={disabled || loading || !value.trim()}
        submitAriaLabel={submitAriaLabel}
        submitLabel={submitLabel}
        Icon={Icon}
        compact
        variant={variant}
      />
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
  rows = 2,
  footer,
  variant = "light",
  hint,
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

  const defaultHint = hint ?? (enterToSubmit ? "Enter to send · Shift+Enter for new line" : undefined);

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      <div className={`overflow-hidden rounded-2xl border transition ${shellClass[variant]}`}>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={rows}
          className={`block max-h-24 min-h-[2.5rem] w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-snug outline-none ${fieldClass[variant]}`}
        />
        <div className={`flex items-center justify-between gap-2 border-t px-2 py-1.5 ${footerClass[variant]}`}>
          {defaultHint ? (
            <span className={`hidden text-[10px] font-medium sm:inline ${hintClass[variant]}`}>{defaultHint}</span>
          ) : (
            <span />
          )}
          <SubmitButton
            loading={loading}
            disabled={disabled || loading || !value.trim()}
            submitAriaLabel={submitAriaLabel}
            submitLabel={submitLabel}
            Icon={Icon}
            compact
            variant={variant}
          />
        </div>
      </div>
      {footer}
    </form>
  );
}
