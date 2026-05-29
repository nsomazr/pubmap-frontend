/** Shared Tailwind classes for the live meet-room control drawer (dark theme). */
export const meetDrawer = {
  card: "rounded-xl border border-slate-700/80 bg-slate-800/50 p-3",
  cardElevated: "rounded-xl border border-slate-700/80 bg-slate-800/80 p-3 shadow-sm shadow-black/20",
  label: "text-[11px] font-semibold uppercase tracking-wide text-slate-400",
  title: "text-lg font-semibold text-slate-100",
  link: "inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-brand-400 transition hover:text-brand-300",
  badge: "rounded-full bg-slate-700/80 px-2.5 py-1 font-medium capitalize text-slate-200 ring-1 ring-slate-600/80",
  badgeAccent: "rounded-full bg-brand-950/60 px-2.5 py-1 font-semibold text-brand-300 ring-1 ring-brand-800/80",
  input:
    "min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-900/50",
  muted: "text-sm text-slate-400",
  hostHint: "text-sm text-slate-400",
  btn: "h-9 w-full !border-slate-600 !bg-slate-800 !text-slate-100 hover:!bg-slate-700",
  btnGhost: "h-9 shrink-0 !text-slate-300 hover:!bg-slate-800",
  chatShell: "min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-900/50 p-3",
  chatForm: "mt-auto space-y-2 rounded-xl border border-slate-700/80 bg-slate-800/80 p-3 shadow-sm shadow-black/15",
  chatReplyBanner: "rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-xs text-slate-300",
  participantCard:
    "relative flex flex-col gap-2 rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-2 shadow-sm shadow-black/10 sm:flex-row sm:items-center sm:justify-between",
  menu: "absolute right-0 top-11 z-20 w-56 rounded-xl border border-slate-600 bg-slate-900 p-2 shadow-lg ring-1 ring-slate-700/80",
  menuBtn: "h-10 w-full justify-start gap-2 whitespace-nowrap px-2.5 text-left !text-slate-100 hover:!bg-slate-800",
  waitingCard: "rounded-xl border border-amber-900/50 bg-amber-950/40 p-3",
  waitingItem: "flex flex-col gap-2 rounded-lg border border-amber-900/40 bg-slate-900/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
  copilotOutput: "rounded-xl border border-slate-700/80 bg-slate-900/70 p-3 shadow-sm shadow-black/15",
} as const;
