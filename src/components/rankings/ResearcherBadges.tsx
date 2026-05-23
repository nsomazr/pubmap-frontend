import {
  Award,
  BadgeCheck,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import type { ResearcherBadge } from "../../types";
import { BADGE_LABELS } from "../../lib/rankings";

const BADGE_STYLE: Record<
  ResearcherBadge,
  { icon: typeof Award; className: string }
> = {
  verified_researcher: {
    icon: BadgeCheck,
    className: "bg-teal-50 text-teal-800 ring-teal-200/80",
  },
  top_contributor: {
    icon: Award,
    className: "bg-brand-50 text-brand-800 ring-brand-200/80",
  },
  highly_discussed: {
    icon: MessageCircle,
    className: "bg-teal-50 text-teal-800 ring-teal-200/80",
  },
  rising_researcher: {
    icon: TrendingUp,
    className: "bg-brand-100 text-brand-800 ring-brand-200/80",
  },
};

interface Props {
  badges?: ResearcherBadge[] | null;
  compact?: boolean;
  max?: number;
}

export function ResearcherBadges({ badges, compact = false, max = 4 }: Props) {
  if (!badges?.length) return null;
  const shown = badges.slice(0, max);

  return (
    <span className={`inline-flex flex-wrap ${compact ? "gap-1" : "gap-1.5"}`}>
      {shown.map((badge) => {
        const style = BADGE_STYLE[badge];
        const Icon = style.icon;
        return (
          <span
            key={badge}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${style.className} ${
              compact ? "px-1.5" : ""
            }`}
          >
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            {!compact && BADGE_LABELS[badge]}
          </span>
        );
      })}
    </span>
  );
}
