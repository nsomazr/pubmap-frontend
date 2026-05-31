import { Link } from "react-router-dom";
import { assets } from "../../lib/brand";

/** full = main GRE logo (logo.png); icon = compact map symbol (map_logo.png) */
type Symbol = "full" | "icon";
type Variant = "light" | "dark" | "gradient" | "float" | "plain";
type Size = "sm" | "md" | "lg" | "xl";

/** Square circle shells — same for full logo and map icon. */
const circleSizes: Record<Size, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
};

const circlePadding: Record<Size, string> = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
  xl: "p-2",
};

const plateStyles: Record<Exclude<Variant, "plain">, string> = {
  light:
    "rounded-full bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.25)] ring-2 ring-slate-200/90",
  dark: "rounded-full bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)] ring-2 ring-white/40",
  gradient:
    "rounded-full bg-white shadow-[0_6px_24px_-6px_rgba(59,91,219,0.35)] ring-2 ring-white/80",
  float:
    "rounded-full bg-white shadow-[0_8px_28px_-6px_rgba(15,23,42,0.35)] ring-2 ring-white",
};

interface Props {
  /** full logo by default; icon only for map markers / tight chips */
  symbol?: Symbol;
  variant?: Variant;
  size?: Size;
  className?: string;
  to?: string;
  title?: string;
}

export function BrandMark({
  symbol = "full",
  variant = "light",
  size = "md",
  className = "",
  to,
  title = "Global Research Exchange",
}: Props) {
  const src = symbol === "full" ? assets.logo : assets.mapLogo;
  const imgClass = "h-full w-full object-contain";

  const shellClass =
    variant === "plain"
      ? `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${circleSizes[size]} ${circlePadding[size]} ${className}`
      : `inline-flex shrink-0 items-center justify-center overflow-hidden ${plateStyles[variant]} ${circleSizes[size]} ${circlePadding[size]} ${className}`;

  const image = (
    <img src={src} alt="Global Research Exchange" className={imgClass} draggable={false} />
  );

  if (to) {
    return (
      <Link to={to} className={shellClass} title={title}>
        {image}
      </Link>
    );
  }

  return <div className={shellClass}>{image}</div>;
}
