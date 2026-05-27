import { Bot, FileText, Info, LayoutGrid, Settings2, Users, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../ui/Button";

export type MeetRoomDrawerTab = "info" | "assistant" | "chat" | "host" | "people" | "session";

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
  { id: "chat", label: "Chat", icon: FileText },
  { id: "host", label: "Host", icon: Settings2, hostOnly: true },
  { id: "people", label: "People", icon: Users },
  { id: "session", label: "Session", icon: LayoutGrid, hostOnly: true },
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
    <div className="fixed inset-0 z-[2147483646] flex justify-end pointer-events-auto">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Close meeting controls"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:max-w-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Meeting controls
            </p>
            <h2 className="truncate text-lg font-semibold text-ink">
              {meetingTitle || "GRE Meet"}
            </h2>
          </div>
          <Button variant="ghost" className="px-2" onClick={onClose} aria-label="Close panel">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">{panels[tab]}</div>
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
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[2147483645] pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-700"
    >
      <LayoutGrid className="h-4 w-4" />
      {label}
    </button>
  );
}
