import { Link } from "react-router-dom";
import { assets } from "../../lib/brand";

/** full = main GRE logo (logo.png); icon = compact map symbol (map_logo.png) */
type Symbol = "full" | "icon";
type Variant = "light" | "dark" | "gradient" | "float" | "plain";
type Size = "sm" | "md" | "lg" | "xl";

const logoSizes: Record<Size, string> = {
  sm: "h-8 max-w-[110px]",
  md: "h-10 max-w-[130px]",
  lg: "h-12 max-w-[160px]",
  xl: "h-[7.5rem] max-w-[220px]",
};

const iconSizes: Record<Size, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

const floatCircleSizes: Record<Size, string> = {
  sm: "h-9 w-9 p-1",
  md: "h-11 w-11 p-1.5",
  lg: "h-12 w-12 p-1.5",
  xl: "h-14 w-14 p-2",
};

const plateStyles: Record<Exclude<Variant, "plain">, string> = {
  light:
    "rounded-xl bg-white px-2 py-1.5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/90",
  dark: "rounded-xl bg-white px-2 py-1.5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)] ring-1 ring-white/40",
  gradient:
    "rounded-xl bg-white px-2.5 py-2 shadow-[0_6px_24px_-6px_rgba(59,91,219,0.35)] ring-1 ring-white/80",
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
  const isFloatCircle = variant === "float";
  const imgClass = isFloatCircle
    ? "h-full w-full object-contain"
    : symbol === "full"
      ? `${logoSizes[size]} w-auto object-contain`
      : `${iconSizes[size]} object-contain`;

  const shellClass =
    variant === "plain"
      ? `inline-flex shrink-0 items-center ${className}`
      : isFloatCircle
        ? `inline-flex shrink-0 items-center justify-center ${plateStyles.float} ${floatCircleSizes[size]} ${className}`
        : `inline-flex shrink-0 items-center justify-center ${plateStyles[variant]} ${className}`;

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
