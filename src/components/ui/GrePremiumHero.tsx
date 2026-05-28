import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  greBtnOnDarkPrimary,
  greBtnOnDarkSecondary,
  greGradientPremium,
  greHeroIconBox,
  grePillOnDark,
  grePillOnDarkMuted,
} from "../../lib/greTheme";

export {
  greBtnOnDarkPrimary,
  greBtnOnDarkSecondary,
  grePillOnDark,
  grePillOnDarkMuted,
  greHeroIconBox,
};

type Props = {
  /** Primary headline (schedule line, page title, etc.) */
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  /** White content strip below the gradient (stats, description, secondary actions). */
  footer?: ReactNode;
  variant?: "full" | "compact";
  className?: string;
};

export function GrePremiumHero({
  title,
  subtitle,
  meta,
  badges,
  icon: Icon,
  actions,
  footer,
  variant = "full",
  className = "",
}: Props) {
  const isCompact = variant === "compact";

  return (
    <section
      className={`gre-premium-hero overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm ${className}`}
    >
      <div
        className={`${greGradientPremium} relative ${isCompact ? "px-5 py-5 sm:px-7 sm:py-6" : "px-6 py-6 sm:px-8"}`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="relative">
          {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
          <div
            className={`flex flex-col gap-4 ${badges ? "mt-4" : ""} lg:flex-row lg:items-end lg:justify-between`}
          >
            <div className="flex min-w-0 gap-4">
              {Icon && (
                <div className={`${greHeroIconBox} shrink-0`}>
                  <Icon className="h-6 w-6 text-brand-200 sm:h-7 sm:w-7" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</div>
                {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
                {meta && <p className="mt-1.5 text-sm text-white/65">{meta}</p>}
              </div>
            </div>
            {actions && <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">{actions}</div>}
          </div>
        </div>
      </div>
      {footer && <div className="border-t border-slate-100 px-6 py-5 sm:px-8">{footer}</div>}
    </section>
  );
}

/** Status pill for use inside GrePremiumHero badges slot. */
export function GrePremiumPill({
  children,
  active,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
        active ? grePillOnDark : grePillOnDarkMuted
      } ${className}`}
    >
      {children}
    </span>
  );
}
