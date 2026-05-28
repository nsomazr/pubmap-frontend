import { Bot, FileText, Info, LayoutGrid, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../ui/Button";

export type MeetRoomDrawerTab = "info" | "assistant" | "chat" | "host" | "people";

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex justify-end pointer-events-auto"
      style={{ zIndex: 2147483647 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Close meeting controls"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 text-slate-100 shadow-2xl sm:max-w-lg">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="truncate text-xl font-semibold text-slate-100">
              {meetingTitle || "GRE Meet"}
            </h2>
          </div>
          <Button
            variant="ghost"
            className="px-2 !bg-slate-900 !text-slate-300 hover:!bg-slate-800 hover:!text-white"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-800 px-3 py-2">
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-brand-600 text-white"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 p-4">{panels[tab]}</div>
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
      className={`fixed z-[2147483645] w-auto ${position ? "pointer-events-auto" : "pointer-events-none bottom-7 left-3 sm:bottom-8 sm:left-4"}`}
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
            const current = position ?? clampToViewport(rect?.left ?? 16, rect?.top ?? window.innerHeight - 84);
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
          className={`pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/95 px-4 text-sm font-semibold text-slate-100 shadow-[0_8px_24px_rgba(2,6,23,0.45)] select-none touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab transition hover:border-slate-600 hover:bg-slate-800"}`}
        >
          <LayoutGrid className="h-4 w-4" />
          {label}
        </button>
      </div>
    </div>
  );
}
