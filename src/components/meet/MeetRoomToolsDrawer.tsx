import { Bot, FileText, Info, LayoutGrid, Settings2, Users, X } from "lucide-react";
import type { ReactNode } from "react";
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
  { id: "host", label: "Host", icon: Settings2, hostOnly: true },
  { id: "people", label: "People", icon: Users },
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
  return (
    <div
      className="pointer-events-none fixed bottom-16 left-1/2 z-[2147483645] w-full max-w-none -translate-x-1/2 px-3 sm:bottom-14"
      style={{ zIndex: 2147483647 }}
    >
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onClick}
          className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/95 px-4 text-sm font-semibold text-slate-100 shadow-[0_8px_24px_rgba(2,6,23,0.45)] transition hover:border-slate-600 hover:bg-slate-800"
        >
          <LayoutGrid className="h-4 w-4" />
          {label}
        </button>
      </div>
    </div>
  );
}
