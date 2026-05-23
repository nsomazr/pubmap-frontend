import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  to: string;
  label?: string;
  className?: string;
}

/** Left-aligned back navigation for public detail pages. */
export function PageBackLink({ to, label = "Back", className = "" }: Props) {
  return (
    <Link
      to={to}
      className={`gre-interactive inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
