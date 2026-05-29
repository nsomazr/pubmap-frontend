import { ArrowRight, Loader2 } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  submitAriaLabel?: string;
};

export function MeetDrawerComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Send a message",
  disabled = false,
  loading = false,
  submitAriaLabel = "Send",
}: Props) {
  const canSend = !disabled && !loading && value.trim().length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (!canSend) return;
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-1 rounded-full border border-slate-600/80 bg-slate-800/70 py-1 pl-4 pr-1 transition focus-within:border-cyan-800/50 focus-within:bg-slate-800/90 focus-within:ring-1 focus-within:ring-cyan-900/25"
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        rows={1}
        className="max-h-24 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent py-2 text-sm leading-snug text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label={submitAriaLabel}
        className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-600/90 text-slate-100 transition hover:bg-cyan-900/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
