/** Shared Tailwind classes for the live meet-room control drawer (dark theme). */
export const meetDrawer = {
  card: "rounded-xl border border-slate-700/80 bg-slate-800/50 p-3",
  cardElevated: "rounded-xl border border-slate-700/80 bg-slate-800/80 p-3 shadow-sm shadow-black/20",
  label: "text-[11px] font-semibold uppercase tracking-wide text-slate-400",
  title: "text-lg font-semibold text-slate-100",
  headerAccent: "border-cyan-800/70",
  tabActive:
    "bg-slate-700/95 text-slate-100 ring-1 ring-cyan-900/45 shadow-sm shadow-black/25",
  tabInactive: "bg-slate-800/90 text-slate-400 hover:bg-slate-700/90 hover:text-slate-200",
  link: "inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-cyan-400/90 transition hover:text-cyan-300",
  badge: "rounded-full bg-slate-700/80 px-2.5 py-1 font-medium capitalize text-slate-200 ring-1 ring-slate-600/80",
  badgeAccent:
    "rounded-full bg-cyan-950/35 px-2.5 py-1 font-semibold text-cyan-200/90 ring-1 ring-cyan-900/45",
  input:
    "min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-800 focus:ring-0 focus:shadow-[0_0_0_3px_rgba(14,116,144,0.25)]",
  muted: "text-sm text-slate-400",
  hostHint: "text-sm text-slate-400",
  btn: "h-9 w-full !border-slate-600 !bg-slate-800 !text-slate-100 hover:!bg-slate-700",
  btnGhost: "h-9 shrink-0 !text-slate-300 hover:!bg-slate-800",
  chatNotice: "mx-1 mb-3 flex gap-2.5 rounded-xl bg-slate-800/45 px-3 py-2.5 text-xs leading-relaxed text-slate-400",
  chatReplyBanner: "rounded-xl bg-slate-800/60 px-3 py-2 text-xs text-slate-300 ring-1 ring-slate-700/40",
  chatBubbleOwn:
    "rounded-[18px] rounded-br-[5px] bg-cyan-950/50 px-4 py-2.5 text-sm leading-relaxed text-slate-100 shadow-sm shadow-black/10",
  chatBubbleOther:
    "rounded-[18px] rounded-bl-[5px] bg-slate-800/80 px-4 py-2.5 text-sm leading-relaxed text-slate-100 shadow-sm shadow-black/10",
  chatReplyOwn: "bg-slate-600/35",
  chatReplyLabel: "text-cyan-400/85",
  participantCard:
    "relative flex flex-col gap-2 rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-2 shadow-sm shadow-black/10 sm:flex-row sm:items-center sm:justify-between",
  menu: "absolute right-0 top-11 z-20 w-56 rounded-xl border border-slate-600 bg-slate-900 p-2 shadow-lg ring-1 ring-slate-700/80",
  menuBtn: "h-10 w-full justify-start gap-2 whitespace-nowrap px-2.5 text-left !text-slate-100 hover:!bg-slate-800",
  waitingCard: "rounded-xl border border-amber-900/50 bg-amber-950/40 p-3",
  waitingItem: "flex flex-col gap-2 rounded-lg border border-amber-900/40 bg-slate-900/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
  copilotOutput: "rounded-xl border border-slate-700/80 bg-slate-900/70 p-3 shadow-sm shadow-black/15",
  fabIcon: "text-cyan-500/90",
  fabHover:
    "hover:border-cyan-800/50 hover:bg-slate-800 hover:text-white hover:shadow-[0_10px_32px_-6px_rgba(8,51,68,0.35)]",
  fabDragRing: "ring-2 ring-cyan-800/45",
  /** Tucked under the bubble; overlaps slightly so hover does not drop between bubble and pill. */
  messageActions:
    "absolute z-10 top-[calc(100%-5px)] flex items-center gap-0.5 rounded-full border border-slate-600/90 bg-slate-900 px-1.5 py-0.5 shadow-lg ring-1 ring-slate-700/50 opacity-0 pointer-events-none transition-opacity duration-100 [@media(hover:hover)]:group-hover/msg:opacity-100 [@media(hover:hover)]:group-hover/msg:pointer-events-auto [@media(hover:none)]:relative [@media(hover:none)]:top-auto [@media(hover:none)]:mt-1 [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto",
  messageActionsEnd: "right-2",
  messageActionsStart: "left-2",
  messageActionBtn:
    "rounded-full px-2 py-0.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 hover:text-white",
  messageActionBtnAccent:
    "rounded-full px-2 py-0.5 text-[11px] font-semibold text-cyan-400/90 hover:bg-slate-700 hover:text-cyan-300",
  messageActionBtnOwn:
    "rounded-full px-2 py-0.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-600 hover:text-white",
} as const;
