import { useEffect, useState } from "react";
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
  fit?: "cover" | "contain";
  clip?: boolean;
  shadow?: boolean;
  priority?: boolean;
}

export function SubcategoryVisual({
  visual,
  size = "sm",
  className = "",
  title,
  fit = "cover",
  clip = true,
  shadow = true,
  priority = false,
}: Props) {
  const Icon = taxonomyIcon(visual.icon_key);
  const rawLogo = (visual.logo_url || "").trim();
  const logoSrc =
    rawLogo.startsWith("/assets/") || rawLogo.startsWith("assets/")
      ? `/${rawLogo.replace(/^\/+/, "")}`
      : mediaUrl(rawLogo);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [logoSrc]);

  const tileShadow = shadow ? { boxShadow: `0 4px 14px -6px ${visual.accent_color}55` } : undefined;

  if (logoSrc && !failed) {
    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center ${
          clip ? "overflow-hidden" : ""
        } ${tileSizes[size]} ${className}`}
        title={title ?? visual.name}
        aria-hidden={title ? undefined : true}
        style={tileShadow}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
          style={{ backgroundColor: `${visual.accent_color}14`, color: visual.accent_color }}
        >
          <Icon className={iconSizes[size]} strokeWidth={2.2} />
        </span>
        <img
          src={logoSrc}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${fit === "contain" ? "object-contain" : "object-cover"}`}
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
        ...tileShadow,
      }}
      title={title ?? visual.name}
      aria-hidden={title ? undefined : true}
    >
      <Icon className={iconSizes[size]} strokeWidth={2.2} />
    </span>
  );
}
