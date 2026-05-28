import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { greUnreadBadge } from "../../lib/greTheme";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const PANEL_WIDTH_PX = 380;
const PANEL_GAP_PX = 6;

type PanelPosition = { top: number; left: number; width: number };

type FooterLink = { to: string; label: string; badge?: number };

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24 && d.toDateString() === now.toDateString()) return `${diffHours}h`;
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
  if (n.type.startsWith("meeting_")) return "/dashboard/meetings";
  if (n.type === "forum_reply") return "/forum";
  if (n.type === "discussion") return "/";
  if (n.type === "publication" || n.type === "review") return "/dashboard/publications";
  return "/dashboard";
}

function measurePanelPosition(button: HTMLElement): PanelPosition {
  const rect = button.getBoundingClientRect();
  const width = Math.min(PANEL_WIDTH_PX, window.innerWidth - 16);
  const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
  const top = rect.bottom + PANEL_GAP_PX;
  return { top, left, width };
}

function footerLinks(items: GreNotification[], messageUnread: number): FooterLink[] {
  const links: FooterLink[] = [];
  const types = new Set(items.map((n) => n.type));

  if (messageUnread > 0) {
    links.push({ to: "/dashboard/messages", label: "Messages", badge: messageUnread });
  }
  if ([...types].some((t) => t.startsWith("meeting_"))) {
    links.push({ to: "/dashboard/meetings", label: "GRE Meet" });
  }
  if (types.has("forum_reply")) {
    links.push({ to: "/forum", label: "Forum" });
  }
  if (types.has("publication") || types.has("review")) {
    links.push({ to: "/dashboard/publications", label: "Publications" });
  }
  if (types.has("review")) {
    links.push({ to: "/dashboard/review", label: "Review queue" });
  }

  return links;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: counts } = useUnreadCounts();

  const syncPosition = useCallback(() => {
    if (!buttonRef.current) return;
    setPosition(measurePanelPosition(buttonRef.current));
  }, []);

  const { data: notifData, isLoading } = useQuery({
    queryKey: ["notifications", notifPage],
    queryFn: () => fetchNotifications(notifPage),
    enabled: open,
    staleTime: 0,
  });

  const items = notifData?.results ?? [];
  const notifTotal = notifData?.count ?? 0;
  const notifPageSize = notifData?.pageSize ?? 12;
  const notifPages = Math.max(1, Math.ceil(notifTotal / notifPageSize));

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

  useLayoutEffect(() => {
    if (!open) return;
    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [open, syncPosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener("click", onDoc, true);
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onDoc, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setPosition(null);
  }, [open]);

  const total = counts?.notifications ?? 0;
  const unreadItems = items.filter((n) => !n.read);
  const messageUnread = counts?.messages ?? 0;

  const quickLinks = useMemo(
    () => footerLinks(items, messageUnread),
    [items, messageUnread]
  );

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setNotifPage(1);
    if (buttonRef.current) {
      setPosition(measurePanelPosition(buttonRef.current));
    }
    setOpen(true);
  };

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

  const panel =
    open &&
    position &&
    createPortal(
      <div
        ref={panelRef}
        className="fixed z-[9999] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: `min(32rem, calc(100vh - ${position.top}px - 12px))`,
        }}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadItems.length > 0 ? (
              <p className="text-xs text-slate-500">{unreadItems.length} unread</p>
            ) : (
              <p className="text-xs text-slate-500">Updates from across GRE</p>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {unreadItems.length > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="gre-interactive rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
                className="gre-interactive rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                title="Clear all"
              >
                {clearAll.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-slate-600">No notifications</p>
              <p className="mt-1 text-xs text-slate-400">
                Messages, meetings, forum activity, and publication updates appear here.
              </p>
            </div>
          ) : (
            <ul>
              {items.map((n) => {
                const visual = notificationVisual(n.type);
                const Icon = visual.icon;
                return (
                  <li key={n.id} className="border-b border-slate-50 last:border-0">
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`gre-interactive flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        !n.read ? "bg-brand-50/40" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${visual.chipClass}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={`line-clamp-2 text-sm leading-snug ${
                              !n.read ? "font-semibold text-ink" : "font-medium text-slate-800"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                            {formatWhen(n.created_at)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {parseNotificationPreview(n.message)}
                        </span>
                        <span className="mt-1 text-[10px] font-medium text-slate-400">
                          {visual.label}
                        </span>
                      </span>
                      {!n.read && (
                        <span
                          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${visual.dotClass}`}
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {(notifTotal > notifPageSize || quickLinks.length > 0) && (
          <div className="space-y-2 border-t border-slate-100 bg-slate-50/90 px-3 py-2.5">
            {notifTotal > notifPageSize && (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={notifPage <= 1}
                  onClick={() => setNotifPage((p) => Math.max(1, p - 1))}
                  className="gre-interactive inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-40"
                  aria-label="Previous notifications"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[11px] tabular-nums text-slate-500">
                  Page {notifPage} of {notifPages}
                </span>
                <button
                  type="button"
                  disabled={notifPage >= notifPages}
                  onClick={() => setNotifPage((p) => Math.min(notifPages, p + 1))}
                  className="gre-interactive inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-40"
                  aria-label="Next notifications"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
            {quickLinks.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                {quickLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="gre-interactive inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-700"
                  >
                    {link.label}
                    {link.badge != null && link.badge > 0 && (
                      <span
                        className={`rounded-full ${greUnreadBadge} px-1.5 py-px text-[10px] font-bold text-white`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>,
      document.body
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleOpen();
        }}
        className={`gre-interactive relative flex h-9 w-9 items-center justify-center rounded-lg transition ${
          open ? "bg-slate-100 text-brand-700" : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-label={total ? `${total} unread notifications` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full ${greUnreadBadge} px-1 text-[10px] font-bold text-white ring-2 ring-white`}
          >
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {panel}
    </>
  );
}
