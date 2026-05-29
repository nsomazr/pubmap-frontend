/** Shared GRE form field styles (brand blue + teal focus). */
export const greFieldClass =
  "gre-field w-full min-h-[3rem] rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-base text-ink shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-0 sm:min-h-[2.5rem] sm:py-2.5 sm:text-sm";

/** Single column on phones; two columns from large screens up. */
export const greFormGridClass = "grid grid-cols-1 gap-4 lg:grid-cols-2";

/** Single column on phones; two columns from medium screens up. */
export const greFormGridMdClass = "grid grid-cols-1 gap-4 md:grid-cols-2";

export const greDashboardCardClass =
  "gre-dashboard-card overflow-visible p-4 sm:p-6";

export const greFormPanelClass =
  "gre-form-panel space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6";

export const greFormPanelNestedClass =
  "gre-form-panel-nested mt-3 space-y-3 rounded-xl border border-brand-100/70 bg-gradient-to-br from-brand-50/40 to-teal-50/30 p-4";

/** Sticky primary actions on small screens (sits above GRE Assistant FAB). */
export const greFormActionsClass =
  "gre-dashboard-form-actions gre-dashboard-card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-5";

export const greFormPrimaryButtonClass =
  "w-full min-h-[3rem] text-base sm:w-auto sm:min-h-0 sm:text-sm";
