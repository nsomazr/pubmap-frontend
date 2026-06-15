import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 border border-brand-600 focus-visible:ring-brand-500",
  secondary:
    "bg-white text-ink border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  light: "bg-white text-brand-600 hover:bg-slate-50 border border-slate-200",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  loading,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={`gre-interactive inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Please wait…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
