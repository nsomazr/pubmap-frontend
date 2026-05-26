import type { QueryClient } from "@tanstack/react-query";
import api from "./api";

export interface GreNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string | null;
}

export interface UnreadCounts {
  notifications: number;
  messages: number;
  byType: Record<string, number>;
  messagePartners: Record<string, number>;
}

const NOTIFICATION_OPEN_MARKERS = [" | Open: ", " \u2014 Open: "] as const;

export function parseNotificationPreview(message: string): string {
  const text = message || "";
  for (const marker of NOTIFICATION_OPEN_MARKERS) {
    if (text.includes(marker)) {
      return text.split(marker)[0].trim();
    }
  }
  return text;
}

export function notificationLinkFromMessage(message: string): string | null {
  for (const marker of NOTIFICATION_OPEN_MARKERS) {
    if (message.includes(marker)) {
      return message.split(marker).pop()?.trim() ?? null;
    }
  }
  return null;
}

export function partnerIdFromLink(link?: string | null): number | null {
  if (!link?.includes("partner=")) return null;
  const m = link.match(/partner=(\d+)/);
  return m ? Number(m[1]) : null;
}

export async function fetchUnreadCounts(): Promise<UnreadCounts> {
  const [notifRes, inboxRes] = await Promise.all([
    api.get<{ total: number; by_type: Record<string, number> }>(
      "/notifications/unread_count/"
    ),
    api.get<{ unread_total: number; partners: Record<string, number> }>(
      "/messages/inbox_meta/"
    ),
  ]);
  return {
    notifications: notifRes.data.total ?? 0,
    messages: inboxRes.data.unread_total ?? 0,
    byType: notifRes.data.by_type ?? {},
    messagePartners: inboxRes.data.partners ?? {},
  };
}

export async function fetchNotifications(): Promise<GreNotification[]> {
  const { data } = await api.get<GreNotification[] | { results: GreNotification[] }>(
    "/notifications/"
  );
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/mark_read/`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/mark_all_read/");
}

export async function clearAllNotifications(): Promise<void> {
  await api.post("/notifications/clear_all/");
}

export async function markMessageThreadRead(partnerId: number): Promise<void> {
  await api.post("/messages/mark_thread_read/", { partner_id: partnerId });
}

/** Optimistically drop counts so badges clear before the next poll. */
export function patchUnreadCountsAfterRead(
  queryClient: QueryClient,
  opts?: { partnerId?: number; notificationId?: number }
) {
  queryClient.setQueryData<UnreadCounts>(["unread-counts"], (old) => {
    if (!old) return old;
    const next = { ...old, messagePartners: { ...old.messagePartners } };
    if (opts?.partnerId != null) {
      const key = String(opts.partnerId);
      const n = next.messagePartners[key] ?? 0;
      next.messages = Math.max(0, next.messages - n);
      delete next.messagePartners[key];
    }
    if (opts?.notificationId != null) {
      next.notifications = Math.max(0, next.notifications - 1);
    }
    return next;
  });

  if (opts?.notificationId != null) {
    queryClient.setQueryData<GreNotification[]>(["notifications"], (old) =>
      old?.map((n) =>
        n.id === opts.notificationId ? { ...n, read: true } : n
      )
    );
  }
}

export async function refreshUnreadState(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["unread-counts"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["messages-inbox"] }),
  ]);
}
