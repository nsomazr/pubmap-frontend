import type { SubcategoryVisual as Visual } from "../../types";
import { SubcategoryVisual } from "./SubcategoryVisual";

type Variant = "badge" | "chip" | "plain";
type Size = "xs" | "sm" | "md" | "2xs";

interface Props {
  visual: Visual;
  showCategory?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
}

const badgeSizes: Record<Size, { tile: "2xs" | "xs" | "sm" | "md"; text: string; shell: string }> = {
  "2xs": { tile: "2xs", text: "text-[10px]", shell: "gap-1 rounded-md px-1.5 py-0.5" },
  xs: { tile: "xs", text: "text-[10px]", shell: "gap-1 rounded-full px-2 py-0.5" },
  sm: { tile: "xs", text: "text-[11px]", shell: "gap-1.5 rounded-full px-2 py-1" },
  md: { tile: "sm", text: "text-xs", shell: "gap-1.5 rounded-xl px-2 py-1" },
};

export function SubcategoryBadge({
  visual,
  showCategory = false,
  variant = "badge",
  size = "sm",
  className = "",
}: Props) {
  const sizing = badgeSizes[size];

  if (variant === "plain") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-ink ${className}`}>
        <SubcategoryVisual visual={visual} size={sizing.tile} />
        <span className={sizing.text}>{visual.name}</span>
      </span>
    );
  }

  const shellClass =
    variant === "chip"
      ? `inline-flex max-w-full items-center ring-1 ${sizing.shell}`
      : `inline-flex max-w-full items-center ring-1 ${sizing.shell.replace("rounded-full", "rounded-lg").replace("rounded-md", "rounded-lg")}`;

  return (
    <span
      className={`${shellClass} ${sizing.text} font-semibold ${className}`}
      style={{
        backgroundColor: `${visual.accent_color}12`,
        color: visual.accent_color,
        borderColor: `${visual.accent_color}33`,
      }}
      title={showCategory && visual.category_name ? `${visual.category_name} · ${visual.name}` : visual.name}
    >
      <SubcategoryVisual visual={visual} size={sizing.tile} className="!shadow-none" />
      <span className="min-w-0 truncate">{visual.name}</span>
    </span>
  );
}
