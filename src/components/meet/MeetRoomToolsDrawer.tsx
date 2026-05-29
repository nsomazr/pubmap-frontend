import { Bot, FileText, Info, LayoutGrid, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../ui/Button";

export type MeetRoomDrawerTab = "info" | "assistant" | "chat" | "host";

type Props = {
  open: boolean;
  onClose: () => void;
  tab: MeetRoomDrawerTab;
  onTabChange: (tab: MeetRoomDrawerTab) => void;
  canManage: boolean;
  meetingTitle?: string;
  panels: Record<MeetRoomDrawerTab, ReactNode>;
};

const TABS: { id: MeetRoomDrawerTab; label: string; icon: typeof Bot; hostOnly?: boolean }[] = [
  { id: "info", label: "Meeting", icon: Info },
  { id: "assistant", label: "Assistant", icon: Bot },
  { id: "chat", label: "Messages", icon: FileText },
];

const DRAWER_TRANSITION_MS = 320;

export function MeetRoomToolsDrawer({
  open,
  onClose,
  tab,
  onTabChange,
  canManage,
  meetingTitle,
  panels,
}: Props) {
  const visibleTabs = TABS.filter((item) => !item.hostOnly || canManage);
  const [mounted, setMounted] = useState(open);
  const [animating, setAnimating] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setAnimating(true));
      return () => cancelAnimationFrame(frame);
    }
    setAnimating(false);
    const timer = window.setTimeout(() => setMounted(false), DRAWER_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open || !mounted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex justify-end pointer-events-auto"
      style={{ zIndex: 2147483647 }}
      role="dialog"
      aria-modal="true"
      aria-label="Meeting controls"
    >
      <button
        type="button"
        className={`absolute inset-y-0 left-0 right-[min(100%,28rem)] bg-transparent transition-opacity duration-300 ease-out sm:right-[32rem] ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close meeting controls"
        onClick={onClose}
      />
      <aside
        className={`relative flex h-full w-full max-w-md flex-col border-l border-slate-700/90 bg-slate-900 text-slate-100 shadow-[-16px_0_48px_-12px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-w-lg ${
          animating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3.5 sm:px-5">
          <div className="min-w-0 border-l-[3px] border-brand-500 pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Meeting controls
            </p>
            <h2 className="truncate text-lg font-semibold text-slate-100">
              {meetingTitle || "GRE Meet"}
            </h2>
          </div>
          <Button
            variant="ghost"
            className="shrink-0 px-2 !text-slate-400 hover:!bg-slate-800 hover:!text-slate-100"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-800 px-3 py-2.5 sm:px-4">
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-out ${
                  active
                    ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          className={`meet-drawer-panel meet-drawer-panel--dark flex min-h-0 flex-1 flex-col overscroll-contain p-4 sm:p-5 ${
            tab === "assistant" || tab === "chat" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {panels[tab]}
        </div>
      </aside>
    </div>
  );
}

export function MeetRoomControlsFab({
  onClick,
  label = "Meeting controls",
}: {
  onClick: () => void;
  label?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const clampToViewport = (x: number, y: number) => {
    const element = buttonRef.current;
    const width = element?.offsetWidth ?? 180;
    const height = element?.offsetHeight ?? 40;
    const padding = 8;
    const maxX = Math.max(padding, window.innerWidth - width - padding);
    const maxY = Math.max(padding, window.innerHeight - height - padding);
    return {
      x: Math.min(maxX, Math.max(padding, x)),
      y: Math.min(maxY, Math.max(padding, y)),
    };
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gre-meet-controls-fab-pos");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { x?: number; y?: number };
      if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") return;
      setPosition(clampToViewport(parsed.x, parsed.y));
    } catch {
      // Ignore malformed saved position.
    }
  }, []);

  useEffect(() => {
    if (!position) return;
    try {
      localStorage.setItem("gre-meet-controls-fab-pos", JSON.stringify(position));
    } catch {
      // Ignore storage failures.
    }
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        if (!current) return current;
        return clampToViewport(current.x, current.y);
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`fixed z-[2147483645] w-auto ${position ? "pointer-events-auto" : "pointer-events-none bottom-7 left-5 sm:bottom-8 sm:left-6"}`}
      style={
        position
          ? { zIndex: 2147483647, left: `${position.x}px`, top: `${position.y}px` }
          : { zIndex: 2147483647 }
      }
    >
      <div className="flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          onPointerDown={(event) => {
            const rect = buttonRef.current?.getBoundingClientRect();
            const current = position ?? clampToViewport(rect?.left ?? 24, rect?.top ?? window.innerHeight - 84);
            dragStateRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              offsetX: event.clientX - current.x,
              offsetY: event.clientY - current.y,
              moved: false,
            };
            setPosition(current);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const dragState = dragStateRef.current;
            if (!dragState || dragState.pointerId !== event.pointerId) return;
            const movedX = event.clientX - dragState.startX;
            const movedY = event.clientY - dragState.startY;
            if (!dragState.moved && (Math.abs(movedX) > 4 || Math.abs(movedY) > 4)) {
              dragState.moved = true;
              setIsDragging(true);
            }
            if (!dragState.moved) return;
            const nextX = event.clientX - dragState.offsetX;
            const nextY = event.clientY - dragState.offsetY;
            setPosition(clampToViewport(nextX, nextY));
          }}
          onPointerUp={(event) => {
            const dragState = dragStateRef.current;
            if (!dragState || dragState.pointerId !== event.pointerId) return;
            event.currentTarget.releasePointerCapture(event.pointerId);
            const wasDrag = dragState.moved;
            dragStateRef.current = null;
            setIsDragging(false);
            if (!wasDrag) onClick();
          }}
          onPointerCancel={() => {
            dragStateRef.current = null;
            setIsDragging(false);
          }}
          className={`pointer-events-auto inline-flex h-10 min-h-11 items-center gap-2 rounded-full border border-slate-600/90 bg-slate-900/95 px-3 text-sm font-semibold text-slate-100 shadow-[0_8px_28px_-6px_rgba(0,0,0,0.45)] backdrop-blur-sm select-none touch-none sm:px-4 ${
            isDragging
              ? "cursor-grabbing scale-[0.98] ring-2 ring-brand-500/50"
              : "cursor-grab transition-all duration-200 ease-out hover:border-brand-500/60 hover:bg-slate-800 hover:text-white hover:shadow-[0_10px_32px_-6px_rgba(59,91,219,0.35)]"
          }`}
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-brand-400" />
          <span className="sm:hidden">Menu</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      </div>
    </div>
  );
}
