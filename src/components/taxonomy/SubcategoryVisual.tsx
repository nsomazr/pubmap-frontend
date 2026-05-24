import type { SubcategoryVisual } from "../../types";
import { taxonomyIcon } from "../../lib/taxonomyVisuals";
import { mediaUrl } from "../../lib/mediaUrl";

type Size = "xs" | "sm" | "md" | "lg" | "2xs";

const tileSizes: Record<Size, string> = {
  "2xs": "h-4 w-4 rounded",
  xs: "h-7 w-7 rounded-lg",
  sm: "h-9 w-9 rounded-xl",
  md: "h-12 w-12 rounded-xl",
  lg: "h-16 w-16 rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem]",
};

const iconSizes: Record<Size, string> = {
  "2xs": "h-2.5 w-2.5",
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

interface Props {
  visual: SubcategoryVisual;
  size?: Size;
  className?: string;
  title?: string;
}

export function SubcategoryVisual({ visual, size = "sm", className = "", title }: Props) {
  const Icon = taxonomyIcon(visual.icon_key);
  const logoSrc = mediaUrl(visual.logo_url);

  if (logoSrc) {
    return (
      <span
        className={`inline-flex shrink-0 overflow-hidden ${tileSizes[size]} ${className}`}
        title={title ?? visual.name}
        aria-hidden={title ? undefined : true}
      >
        <img
          src={logoSrc}
          alt=""
          className="h-full w-full object-cover"
          style={{ boxShadow: `0 4px 14px -6px ${visual.accent_color}55` }}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${tileSizes[size]} ${className}`}
      style={{
        backgroundColor: `${visual.accent_color}18`,
        color: visual.accent_color,
        boxShadow: `0 4px 14px -6px ${visual.accent_color}55`,
      }}
      title={title ?? visual.name}
      aria-hidden={title ? undefined : true}
    >
      <Icon className={iconSizes[size]} strokeWidth={2.2} />
    </span>
  );
}
