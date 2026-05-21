import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markMessageThreadRead,
  markNotificationRead,
  parseNotificationPreview,
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
  if (n.link?.startsWith("/")) {
    return n.link.split(" — ")[0].trim();
  }
  if (n.type === "message") return "/dashboard/messages";
  if (n.type === "forum_reply") return "/forum";
  if (n.type === "discussion") return "/dashboard/publications";
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
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        aria-label={total ? `${total} unread notifications` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-ink">Notifications</p>
            <div className="flex items-center gap-1">
              {unreadItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  title="Mark all read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(60vh,320px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.filter((n) => !n.read).length === 0 && items.length > 0 && (
                  <li className="px-4 py-2 text-center text-xs text-slate-400">
                    All caught up — older alerts are shown below.
                  </li>
                )}
                {items.slice(0, 30).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        !n.read ? "bg-brand-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            !n.read ? "font-semibold text-ink" : "font-medium text-slate-700"
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatWhen(n.created_at)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {parseNotificationPreview(n.message)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 text-center">
            <Link
              to="/dashboard/messages"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Open messages
              {(counts?.messages ?? 0) > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
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
