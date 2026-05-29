import type { ReactNode, RefObject } from "react";

type Props = {
  notice?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  footerError?: string;
  threadRef?: RefObject<HTMLDivElement | null>;
};

/** Meet-style in-call panel: open thread, pill composer pinned at bottom. */
export function MeetDrawerThreadLayout({ notice, children, footer, footerError, threadRef }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950/40">
      {notice}
      <div
        ref={threadRef}
        className="meet-drawer-thread min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
      >
        {children}
      </div>
      <div className="shrink-0 space-y-2 border-t border-slate-800/90 bg-slate-900/80 px-3 py-3 backdrop-blur-sm">
        {footer}
        {footerError ? <p className="px-1 text-xs text-red-400">{footerError}</p> : null}
      </div>
    </div>
  );
}
