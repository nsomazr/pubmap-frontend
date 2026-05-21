import { Calendar, MessageSquare } from "lucide-react";

export type BannerKind = "event" | "forum";
export type BannerVariant = 0 | 1 | 2;

/** GRE header gradient: brand blue → teal only */
const GRE_GRADIENTS: Record<BannerVariant, string> = {
  0: "from-brand-600 via-[#3b5bdb] to-teal-600",
  1: "from-[#364fc7] via-[#3b5bdb] to-teal-600",
  2: "from-brand-600 via-teal-600 to-[#0f766e]",
};

export function pickBannerVariant(seed: number): BannerVariant {
  return (Math.abs(seed) % 3) as BannerVariant;
}

const LABELS: Record<BannerKind, string[]> = {
  event: ["Research event", "Conference", "Field symposium"],
  forum: ["Discussion", "Forum thread", "Research dialogue"],
};

interface Props {
  kind: BannerKind;
  variant?: BannerVariant;
  seed?: number;
  className?: string;
  compact?: boolean;
}

export function DefaultBanner({ kind, variant, seed = 0, className = "", compact }: Props) {
  const v = variant ?? pickBannerVariant(seed);
  const gradient = GRE_GRADIENTS[v];
  const Icon = kind === "event" ? Calendar : MessageSquare;
  const label = LABELS[kind][v];

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-r ${gradient} ${className}`}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      />
      <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-teal-300/20 blur-2xl" />
      <div className={`relative flex flex-col items-center gap-2 px-4 text-center ${compact ? "scale-90" : ""}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
          <Icon className="h-6 w-6 text-white/95" strokeWidth={1.75} />
        </div>
        {!compact && (
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
