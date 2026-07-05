/** Shared GRE form field styles (brand blue + teal focus). */
export const greFieldClass =
  "gre-field w-full min-h-[3rem] rounded-lg border border-gre-border bg-gre-panel px-4 py-3 text-base text-ink transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-0 sm:min-h-[2.5rem] sm:py-2.5 sm:text-sm";

/** Single column on phones; two columns from large screens up. */
export const greFormGridClass = "grid grid-cols-1 gap-4 lg:grid-cols-2";

/** Single column on phones; two columns from medium screens up. */
export const greFormGridMdClass = "grid grid-cols-1 gap-4 md:grid-cols-2";

/** Major wizard step (publication composer, meet setup, etc.) — divider, no card chrome. */
export const greFormStageClass = "gre-form-stage";

export const greFormStageHeadClass = "gre-form-stage__head";

/** Artistic card for major form steps only (new publication, meet setup) — do not nest heavily. */
export const greFormArtCardClass = "gre-form-art-card";

/** Stack of {@link greFormArtCardClass} sections with consistent gap. */
export const greFormArtStackClass = "gre-form-art-stack space-y-5 sm:space-y-6";

/** Subsection inside a form (Summary, Methods, admin form blocks). */
export const greFormSectionClass = "gre-form-section";

export const greFormSectionTitleClass = "gre-form-section__title";

/** Dashboard / admin form block (flat; use instead of gre-card on forms). */
export const greDashboardCardClass = "gre-form-panel space-y-4";

export const greFormPanelClass = "gre-form-panel space-y-4";

export const greFormPanelNestedClass =
  "gre-form-panel-nested mt-3 space-y-3 border-l-2 border-brand-200/60 pl-4";

/** Sticky primary actions on small screens (sits above GRE Assistant FAB). */
export const greFormActionsClass =
  "gre-dashboard-form-actions flex flex-col gap-3 border-t border-gre-border bg-gre-panel/95 p-4 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-5";

export const greFormPrimaryButtonClass =
  "w-full min-h-[3rem] text-base sm:w-auto sm:min-h-0 sm:text-sm";
