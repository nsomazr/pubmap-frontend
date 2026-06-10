import { Star } from "lucide-react";
import { greStarCount } from "../../lib/greTheme";

interface Props {
  stars: number;
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  label?: string;
}

const sizeClass = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRating({
  stars,
  maxVisible = 5,
  size = "md",
  showCount = true,
  label,
}: Props) {
  const visible = Math.min(stars, maxVisible);
  const extra = stars > maxVisible ? stars - maxVisible : 0;
  const icon = sizeClass[size];

  if (stars <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        {label && <span className="font-medium">{label}</span>}
        <span>No stars yet</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex flex-wrap items-center gap-0.5"
      title={label ? `${label}: ${stars} star${stars !== 1 ? "s" : ""}` : `${stars} stars`}
      aria-label={`${stars} stars`}
    >
      {label && <span className="mr-1 text-xs font-semibold text-slate-600">{label}</span>}
      {Array.from({ length: visible }).map((_, i) => (
        <Star
          key={i}
          className={`${icon} fill-amber-400 text-amber-500 drop-shadow-sm`}
          aria-hidden
        />
      ))}
      {extra > 0 && showCount && (
        <span className={`ml-0.5 text-xs font-bold ${greStarCount}`}>+{extra}</span>
      )}
      {showCount && extra === 0 && stars > maxVisible && (
        <span className={`ml-0.5 text-xs font-semibold ${greStarCount}`}>{stars}</span>
      )}
    </span>
  );
}
