import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { parseAffiliationList } from "../../lib/affiliations";

interface Props {
  value?: string | null;
  className?: string;
  /** `block` shows one institution per line; `inline` joins with middle dots. */
  variant?: "block" | "inline";
  mapUrl?: string;
}

export function AffiliationList({
  value,
  className = "",
  variant = "block",
  mapUrl,
}: Props) {
  const items = parseAffiliationList(value);
  if (!items.length) return null;

  if (variant === "inline") {
    const text = items.join(" · ");
    const content = (
      <span className={className}>
        <Building2 className="mr-1 inline h-3.5 w-3.5 shrink-0 align-[-2px] text-slate-400" />
        {text}
      </span>
    );
    if (mapUrl) {
      return (
        <Link to={mapUrl} className={`text-sm text-slate-600 transition hover:text-brand-700 ${className}`}>
          {content}
        </Link>
      );
    }
    return <p className={`text-sm text-slate-600 ${className}`}>{content}</p>;
  }

  const body = (
    <ul className={`space-y-1 text-sm text-slate-600 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-1.5">
          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  if (mapUrl) {
    return (
      <Link to={mapUrl} className="block transition hover:text-brand-700">
        {body}
      </Link>
    );
  }

  return body;
}
