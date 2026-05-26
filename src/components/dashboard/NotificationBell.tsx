import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { greUnreadBadge } from "../../lib/greTheme";
import { Bell, CheckCheck, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { extractNotificationPath } from "../../lib/mapDeepLink";
import { notificationVisual } from "../../lib/notificationVisuals";
import {
  clearAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markMessageThreadRead,
  markNotificationRead,
  parseNotificationPreview,
  notificationLinkFromMessage,
  partnerIdFromLink,
  patchUnreadCountsAfterRead,
  refreshUnreadState,
  type GreNotification,
} from "../../lib/notifications";
import { useUnreadCounts } from "../../hooks/useUnreadCounts";

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function notificationHref(n: GreNotification): string {
  const fromLink = extractNotificationPath(n.link);
  if (fromLink) return fromLink;

  const fromMessage = extractNotificationPath(notificationLinkFromMessage(n.message));
  if (fromMessage) return fromMessage;

  if (n.type === "message") return "/dashboard/messages";
  if (n.type === "forum_reply") return "/forum";
  if (n.type === "discussion") return "/";
  if (n.type === "publication") return "/";
  return "/dashboard";
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: counts } = useUnreadCounts();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: open,
    staleTime: 0,
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await refreshUnreadState(queryClient);
    },
  });

  const clearAll = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: async () => {
      queryClient.setQueryData<GreNotification[]>(["notifications"], []);
      queryClient.setQueryData(["unread-counts"], (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const current = old as {
          notifications: number;
          messages: number;
          byType: Record<string, number>;
          messagePartners: Record<string, number>;
        };
        return {
          ...current,
          notifications: 0,
          byType: {},
        };
      });
      await refreshUnreadState(queryClient);
    },
  });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const total = counts?.notifications ?? 0;
  const unreadItems = items.filter((n) => !n.read);

  const openNotification = async (n: GreNotification) => {
    const href = notificationHref(n);
    const partnerId = partnerIdFromLink(n.link ?? href);

    if (!n.read) {
      patchUnreadCountsAfterRead(queryClient, {
        notificationId: n.id,
        partnerId: partnerId ?? undefined,
      });
      try {
        await markNotificationRead(n.id);
        if (n.type === "message" && partnerId) {
          await markMessageThreadRead(partnerId);
        }
      } catch {
        /* refetch restores truth */
      }
      await refreshUnreadState(queryClient);
    }

    setOpen(false);
    navigate(href);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="gre-interactive relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        aria-label={total ? `${total} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full ${greUnreadBadge} px-1 text-[10px] font-bold text-white ring-2 ring-white`}>
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="gre-card fixed inset-x-2 top-[calc(env(safe-area-inset-top)+3.75rem)] z-[1200] overflow-hidden p-0 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.28)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:z-50 sm:mt-2 sm:w-[min(100vw-2rem,24rem)]">
          <div className="relative border-b border-slate-100 px-4 py-3">
            <div className="absolute inset-x-0 top-0 h-0.5 gre-gradient-bar" aria-hidden />
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">Notifications</p>
                {unreadItems.length > 0 && (
                  <p className="text-[11px] text-slate-500">{unreadItems.length} unread</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => markAll.mutate()}
                    disabled={markAll.isPending}
                    className="gre-interactive rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                    title="Mark all read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearAll.mutate()}
                    disabled={clearAll.isPending}
                    className="gre-interactive rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                    title="Clear notifications"
                  >
                    {clearAll.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="gre-interactive rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[min(70dvh,26rem)] overflow-y-auto sm:max-h-[min(60vh,360px)]">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Forum replies, messages, and publication updates appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 gre-stagger">
                {items.filter((n) => !n.read).length === 0 && items.length > 0 && (
                  <li className="px-4 py-2 text-center text-xs text-slate-400">
                    All caught up. Older alerts are shown below.
                  </li>
                )}
                {items.slice(0, 30).map((n) => {
                  const visual = notificationVisual(n.type);
                  const Icon = visual.icon;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNotification(n)}
                        className={`gre-interactive flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50/90 ${
                          !n.read ? "bg-brand-50/30" : ""
                        }`}
                      >
                        {!n.read && (
                          <span
                            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${visual.dotClass}`}
                            aria-hidden
                          />
                        )}
                        <div className={`min-w-0 flex-1 ${n.read ? "pl-5" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${visual.chipClass}`}
                            >
                              <Icon className="h-3 w-3" />
                              {visual.label}
                            </span>
                            <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                              {formatWhen(n.created_at)}
                            </span>
                          </div>
                          <p
                            className={`mt-1.5 text-sm leading-snug ${
                              !n.read ? "font-semibold text-ink" : "font-medium text-slate-700"
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                            {parseNotificationPreview(n.message)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-center">
            <Link
              to="/dashboard/messages"
              onClick={() => setOpen(false)}
              className="gre-interactive inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Open messages
              {(counts?.messages ?? 0) > 0 && (
                <span className={`rounded-full ${greUnreadBadge} px-1.5 py-0.5 text-[10px] text-white`}>
                  {counts!.messages}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
