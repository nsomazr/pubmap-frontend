/**
 * GRE visual identity — premium slate→brand gradients, accents, and component tokens.
 * Prefer these exports over hard-coded Tailwind gradient strings in pages.
 */

/* Premium hero (GRE Meet detail, page intros) */
export const greGradientPremium = "gre-gradient-premium";
export const greGradientPremiumBr = "gre-gradient-premium-br";
export const greGradientPremiumTeal = "gre-gradient-premium-teal";

/* Bright hero (profiles, publication cards, legacy banners) */
export const greGradientHero = "gre-gradient-hero-bright";
export const greGradientHeroBr = "gre-gradient-hero-bright-br";

/* CTA bands, primary actions */
export const greGradientCta = "gre-gradient-cta";

/* On-dark hero controls */
export const grePillOnDark =
  "bg-brand-500/25 text-brand-50 ring-1 ring-brand-300/40";
export const grePillOnDarkMuted =
  "bg-white/10 text-white/90 ring-1 ring-white/15";
export const greHeroIconBox =
  "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20";
export const greBtnOnDarkPrimary = "gre-btn-on-dark-primary shadow-md";
export const greBtnOnDarkSecondary =
  "!border-white/25 !bg-white/10 !text-white hover:!bg-white/20";

export const greAvatarInitials = "gre-avatar-initials";
export const greAccentBadge = "gre-accent-badge";

/* Cards */
export const greCardAccent = "gre-card-accent";

/* Stat / dashboard cards */
export const greStatBgBrand = "from-brand-50 to-white";
export const greStatBgTeal = "from-teal-50 to-white";

export const greStatCardDraft = "from-slate-500/10 to-slate-500/5";
export const greStatCardPending = "from-brand-500/10 to-brand-500/5";
export const greStatCardRevision = "from-brand-600/10 to-teal-500/5";
export const greStatCardPublished = "from-teal-500/10 to-teal-500/5";

export const greStatIconDraft = "bg-slate-100 text-slate-600";
export const greStatIconPending = "bg-brand-100 text-brand-700";
export const greStatIconRevision = "bg-brand-50 text-brand-700";
export const greStatIconPublished = "bg-teal-50 text-teal-700";

export const greStatLinkPending = "bg-brand-100 text-brand-900 hover:bg-brand-200";
export const greStatLinkUrgent = "bg-teal-100 text-teal-900 hover:bg-teal-200";

export const greStatusStyles: Record<string, string> = {
  "0": "bg-slate-100 text-slate-700 ring-slate-200",
  "1": "bg-brand-50 text-brand-800 ring-brand-200",
  "2": "bg-brand-100 text-brand-800 ring-brand-200/80",
  "3": "bg-teal-50 text-teal-800 ring-teal-200",
  "4": "bg-slate-200 text-slate-600 ring-slate-300",
  "6": "bg-slate-300 text-slate-700 ring-slate-400",
};

export const greChipBrand = "bg-brand-50 text-brand-800 ring-brand-200/80";
export const greChipTeal = "bg-teal-50 text-teal-800 ring-teal-200/80";
export const greChipTopic = "bg-slate-100 text-slate-700";

export const greAlertInfo = "bg-brand-50 text-brand-900 ring-brand-200";
export const greAlertWarning = "bg-teal-50 text-teal-900 ring-teal-200";
export const greAlertError = "bg-brand-100 text-brand-900 ring-brand-300";

export const greIconBrand = "text-brand-600";
export const greIconTeal = "text-teal-600";

export const greStarFill = "fill-brand-500 text-brand-500";
export const greStarCount = "text-brand-700";
export const greBarPrimary = "from-brand-600 to-teal-600";
export const greBarSecondary = "from-brand-500 to-brand-600";

export const greAdminTileBrand = "bg-brand-100 text-brand-800";
export const greAdminTileTeal = "bg-teal-100 text-teal-800";

export const GRE_ADMIN_QUICK_LINK_COLORS = [
  greAdminTileBrand,
  greAdminTileTeal,
  "bg-brand-50 text-brand-800",
  greAdminTileTeal,
  greAdminTileBrand,
  "bg-teal-50 text-teal-800",
  greAdminTileBrand,
] as const;

export const greAccountStatPublished = {
  color: "text-teal-700",
  bg: "hover:bg-teal-50/80",
};
export const greAccountStatPending = {
  color: "text-brand-700",
  bg: "hover:bg-brand-50/80",
};
export const greAccountStatRevision = {
  color: "text-brand-800",
  bg: "hover:bg-brand-100/80",
};
export const greAccountStatDraft = {
  color: "text-slate-700",
  bg: "hover:bg-slate-100/80",
};

export const greUnreadBadge = "bg-brand-600";
export const greUrgentRing = "border-brand-300 ring-2 ring-brand-200/60";
export const greUrgentIcon = "bg-brand-100 text-brand-700";
