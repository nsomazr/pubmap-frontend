import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Copy,
  Loader2,
  MessageSquare,
  MoreVertical,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { GreAvatarSlot } from "../../components/ui/GreHeroBanner";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { useUnreadCounts } from "../../hooks/useUnreadCounts";
import {
  assistantMessageDraftStream,
  type MessageDraftTask,
} from "../../lib/assistant";
import api from "../../lib/api";
import { looksLikeDialogueScript, sanitizeMessageDraft } from "../../lib/messageDraft";
import {
  markMessageThreadRead,
  patchUnreadCountsAfterRead,
  refreshUnreadState,
} from "../../lib/notifications";
import { userInitials } from "../../lib/userDisplay";
import type { Message, User } from "../../types";

function displayName(u: User) {
  return (
    u.full_name || [u.title, u.firstname, u.middlename, u.lastname].filter(Boolean).join(" ")
  ).trim();
}

function dedupeContacts(users: User[], myId?: number) {
  const seen = new Set<number>();
  return users.filter((c) => {
    if (!c.id || c.id === myId || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

function contactSubtitle(c: User, last?: Message, myId?: number) {
  if (last?.is_deleted) {
    return `${last.from_user?.id === myId ? "You: " : ""}Message deleted`;
  }
  if (last?.message) {
    return `${last.from_user?.id === myId ? "You: " : ""}${last.message}`;
  }
  if (c.area_of_study?.trim()) return c.area_of_study.trim();
  return c.affiliation || "";
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function partnerIdForMessage(m: Message, myId: number): number | undefined {
  if (m.from_user?.id === myId) return m.to_user?.id;
  if (m.to_user?.id === myId) return m.from_user?.id;
  return undefined;
}

const DRAFT_OPTIONS: { task: MessageDraftTask; label: string; needsText?: boolean; needsThread?: boolean }[] =
  [
    { task: "draft", label: "Write intro" },
    { task: "polish", label: "Polish", needsText: true },
    { task: "shorter", label: "Shorter", needsText: true },
    { task: "follow_up", label: "Follow-up", needsThread: true },
  ];

function ContactSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-3 py-3">
      <div className="h-11 w-11 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-2.5 w-40 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function MessagesPage() {
  const { user } = useAuth();
  const myId = user?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const [partnerId, setPartnerId] = useState(() => searchParams.get("partner") ?? "");
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sendError, setSendError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [showDraftMenu, setShowDraftMenu] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const draftAbortRef = useRef<AbortController | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { data: unread } = useUnreadCounts();
  const confirm = useConfirm();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts", debouncedSearch],
    queryFn: async () => {
      const params = debouncedSearch ? { q: debouncedSearch } : undefined;
      const { data } = await api.get<User[]>("/auth/contacts/", { params });
      return dedupeContacts(data, myId);
    },
    enabled: !!myId,
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages-inbox"],
    queryFn: async () => {
      const { data } = await api.get<Message[] | { results: Message[] }>("/messages/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
    enabled: !!myId,
  });

  const { data: thread = [], isLoading: threadLoading } = useQuery({
    queryKey: ["messages", partnerId],
    enabled: !!partnerId && partnerId !== String(myId),
    queryFn: async () => {
      const { data } = await api.get<Message[] | { results: Message[] }>("/messages/", {
        params: { partner: partnerId },
      });
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const previews = useMemo(() => {
    const map = new Map<number, Message>();
    if (!myId) return map;
    for (const m of allMessages) {
      const pid = partnerIdForMessage(m, myId);
      if (!pid || pid === myId) continue;
      const prev = map.get(pid);
      if (!prev || new Date(m.created_at) > new Date(prev.created_at)) {
        map.set(pid, m);
      }
    }
    return map;
  }, [allMessages, myId]);

  const { conversationContacts, suggestedContacts } = useMemo(() => {
    const list = dedupeContacts(contacts, myId);
    const withPreview = list.filter((c) => previews.has(c.id));
    const withoutPreview = list.filter((c) => !previews.has(c.id));

    const sortByActivity = (a: User, b: User) => {
      const ta = previews.get(a.id)?.created_at;
      const tb = previews.get(b.id)?.created_at;
      if (ta && tb) return new Date(tb).getTime() - new Date(ta).getTime();
      if (ta) return -1;
      if (tb) return 1;
      return displayName(a).localeCompare(displayName(b));
    };

    return {
      conversationContacts: [...withPreview].sort(sortByActivity),
      suggestedContacts: [...withoutPreview],
    };
  }, [contacts, previews, myId]);

  const partner =
    contacts.find((c) => String(c.id) === partnerId) ||
    conversationContacts.find((c) => String(c.id) === partnerId) ||
    suggestedContacts.find((c) => String(c.id) === partnerId);

  const selectPartner = (id: string) => {
    setPartnerId(id);
    setShowDraftMenu(false);
    if (id) setSearchParams({ partner: id }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    const fromUrl = searchParams.get("partner") ?? "";
    if (fromUrl !== partnerId) setPartnerId(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (partnerId && myId && Number(partnerId) === myId) {
      selectPartner("");
    }
  }, [partnerId, myId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, threadLoading]);

  useEffect(() => {
    if (!partnerId || !myId) return;
    const pid = Number(partnerId);
    if (!pid || pid === myId) return;

    let cancelled = false;
    patchUnreadCountsAfterRead(queryClient, { partnerId: pid });

    (async () => {
      try {
        await markMessageThreadRead(pid);
        if (!cancelled) await refreshUnreadState(queryClient);
      } catch {
        if (!cancelled) await refreshUnreadState(queryClient);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [partnerId, myId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: () =>
      api.post("/messages/", { message: text.trim(), to_user_id: Number(partnerId) }),
    onSuccess: () => {
      setText("");
      setSendError("");
      queryClient.invalidateQueries({ queryKey: ["messages", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["messages-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
    onError: () => {
      setSendError("Message could not be sent. Try again.");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: number) => api.delete(`/messages/${messageId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["messages-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (targetPartnerId: number) =>
      api.post("/messages/delete-thread/", { partner_id: targetPartnerId }),
    onSuccess: (_data, targetPartnerId) => {
      setHeaderMenuOpen(false);
      if (String(targetPartnerId) === partnerId) {
        selectPartner("");
      }
      queryClient.invalidateQueries({ queryKey: ["messages-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["messages", String(targetPartnerId)] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });

  const handleDeleteThread = async (target?: User) => {
    const person = target ?? partner;
    const pid = target?.id ?? (partnerId ? Number(partnerId) : 0);
    if (!person || !pid) return;
    const ok = await confirm({
      title: "Delete conversation?",
      description: `Delete your conversation with ${displayName(person)}? Message text will be cleared; deleted notices may remain in the thread.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    deleteThreadMutation.mutate(pid);
  };

  const handleDeleteMessage = async (messageId: number) => {
    const ok = await confirm({
      title: "Delete message?",
      description:
        "Delete this message for both of you? The text will be removed but a notice will stay in the chat.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    deleteMessageMutation.mutate(messageId);
  };

  const handleCopyMessage = async (body: string) => {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      /* ignore */
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !partnerId || Number(partnerId) === myId) return;
    setSendError("");
    sendMutation.mutate();
  };

  const runMessageDraft = async (task: MessageDraftTask) => {
    if (!partnerId || drafting) return;
    draftAbortRef.current?.abort();
    const controller = new AbortController();
    draftAbortRef.current = controller;
    setDraftError("");
    setDrafting(true);
    setShowDraftMenu(false);

    let accumulated = "";
    try {
      await assistantMessageDraftStream(
        Number(partnerId),
        text,
        task,
        {
          onToken: (token) => {
            accumulated += token;
            setText(accumulated);
          },
          onError: (detail) => setDraftError(detail),
        },
        controller.signal
      );
      const raw = accumulated.trim();
      if (looksLikeDialogueScript(raw)) {
        setDraftError(
          "AI returned a full conversation instead of one message. Try again or write your follow-up manually."
        );
        setText("");
      } else {
        setText(sanitizeMessageDraft(raw));
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setDraftError(
          (err as Error).message || "Could not draft message. Try again."
        );
      }
    } finally {
      setDrafting(false);
      draftAbortRef.current = null;
    }
  };

  const renderContactRow = (c: User, section: "conversation" | "suggested") => {
    const active = String(c.id) === partnerId;
    const last = previews.get(c.id);
    const unreadCount = unread?.messagePartners?.[String(c.id)] ?? 0;
    const hasUnread = unreadCount > 0;
    const subtitle = contactSubtitle(c, last, myId);
    const showMatch = section === "suggested" && c.match_reason && !last;

    const canDeleteConversation = section === "conversation" && previews.has(c.id);

    return (
      <li key={`${section}-${c.id}`} className="group/contact relative mx-2">
        <button
          type="button"
          onClick={() => selectPartner(String(c.id))}
          className={`gre-interactive relative flex w-full items-center gap-3 rounded-xl px-3 py-3 pr-10 text-left ${
            active
              ? "bg-white shadow-sm ring-1 ring-slate-200/90"
              : hasUnread
                ? "bg-brand-50/40 hover:bg-brand-50/70"
                : "hover:bg-white/90"
          }`}
        >
          {active && (
            <span
              className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-brand-500"
              aria-hidden
            />
          )}
          <div className="relative shrink-0">
            <GreAvatarSlot
              photoUrl={c.photo}
              initials={userInitials(c)}
              size="sm"
              className={`border-2 border-white shadow-sm ${
                active ? "ring-2 ring-brand-200" : ""
              }`}
            />
            {hasUnread && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p
                className={`truncate text-sm ${
                  hasUnread ? "font-semibold text-ink" : "font-medium text-ink"
                }`}
              >
                {displayName(c)}
              </p>
              {last && (
                <span
                  className={`shrink-0 text-[10px] tabular-nums ${
                    hasUnread ? "font-medium text-brand-600" : "text-slate-400"
                  }`}
                >
                  {formatTime(last.created_at)}
                </span>
              )}
            </div>
            {showMatch && (
              <span className="mt-1 inline-flex max-w-full items-center rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-800 ring-1 ring-teal-100/80">
                <span className="truncate">{c.match_reason}</span>
              </span>
            )}
            {subtitle && !showMatch && (
              <p
                className={`mt-0.5 truncate text-xs ${
                  hasUnread ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {subtitle}
              </p>
            )}
            {subtitle && showMatch && (
              <p className="mt-1 truncate text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
        </button>
        {canDeleteConversation && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleDeleteThread(c);
            }}
            disabled={deleteThreadMutation.isPending}
            className="gre-interactive absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover/contact:opacity-100 focus:opacity-100 disabled:opacity-40"
            aria-label={`Delete conversation with ${displayName(c)}`}
            title="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </li>
    );
  };

  const hasContacts =
    conversationContacts.length > 0 || suggestedContacts.length > 0;

  return (
    <div className="animate-fade-up flex h-[calc(100dvh-5.5rem)] flex-col">
      <PageHeader
        title="Messages"
        className="mb-4"
      />
      <div className="gre-card-plain flex min-h-0 flex-1 flex-col overflow-hidden p-0 md:flex-row">
        {/* Sidebar */}
        <aside
          className={`flex shrink-0 flex-col bg-slate-50/50 md:w-[min(100%,340px)] md:border-r md:border-slate-100 ${
            partnerId ? "hidden md:flex" : "flex min-h-0 flex-1"
          }`}
        >
          <div className="border-b border-slate-100/80 bg-white px-4 pb-3 pt-4">
            <h1 className="text-lg font-semibold tracking-tight text-ink">Messages</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Researchers connected to your work
            </p>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or area…"
                className="w-full rounded-xl border-0 bg-slate-100/90 py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-slate-400 ring-1 ring-slate-200/60 transition focus:bg-white focus:ring-2 focus:ring-brand-200/80 focus:outline-none"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
            {contactsLoading ? (
              <div className="space-y-1 py-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ContactSkeleton key={i} />
                ))}
              </div>
            ) : !hasContacts ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">No matches yet</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {debouncedSearch
                    ? "Try another name or research area."
                    : "Add your area of study in Account to get personalized suggestions."}
                </p>
              </div>
            ) : (
              <>
                {conversationContacts.length > 0 && (
                  <section className="mb-1">
                    <p className="px-4 pb-1 pt-1 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Recent
                    </p>
                    <ul className="gre-stagger">{conversationContacts.map((c) => renderContactRow(c, "conversation"))}</ul>
                  </section>
                )}
                {suggestedContacts.length > 0 && (
                  <section>
                    <p className="px-4 pb-1 pt-2 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      {debouncedSearch ? "Matches" : "Suggested"}
                    </p>
                    <ul className="gre-stagger">{suggestedContacts.map((c) => renderContactRow(c, "suggested"))}</ul>
                  </section>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Thread panel */}
        <div
          className={`flex min-w-0 flex-1 flex-col bg-[#f8fafc] ${
            partnerId ? "flex" : "hidden md:flex"
          }`}
        >
          {!partnerId || !partner ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/80">
                <MessageSquare className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-base font-semibold text-ink">Choose a conversation</p>
                <p className="mx-auto mt-1.5 max-w-[16rem] text-sm leading-relaxed text-slate-500">
                  Open a recent chat or pick someone suggested from your research area.
                </p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/60 bg-white px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => selectPartner("")}
                  className="-ml-1 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 md:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <GreAvatarSlot
                  photoUrl={partner.photo}
                  initials={userInitials(partner)}
                  size="sm"
                  className="border-2 border-white shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{displayName(partner)}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[partner.area_of_study?.trim(), partner.affiliation]
                      .filter(Boolean)
                      .join(" · ") || "Researcher on GRE"}
                  </p>
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setHeaderMenuOpen((v) => !v)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Conversation actions"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {headerMenuOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="Close menu"
                        onClick={() => setHeaderMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          disabled={deleteThreadMutation.isPending || thread.length === 0}
                          onClick={() => void handleDeleteThread()}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
                          Delete conversation
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </header>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6">
                {threadLoading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                  </div>
                ) : thread.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <p className="text-sm text-slate-500">
                      Start a conversation with {partner.firstname}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDraftMenu(true);
                        runMessageDraft("draft");
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-200/80 transition hover:bg-brand-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Draft intro with AI
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto space-y-4">
                    {thread.map((m) => {
                      const mine = m.from_user?.id === myId;
                      const deleted = !!m.is_deleted;
                      const body = m.message || "";
                      return (
                        <div
                          key={m.id}
                          className={`group/message flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`flex max-w-[min(88%,26rem)] items-end gap-1.5 ${
                              mine ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {deleted ? (
                              <div
                                className={`rounded-2xl border border-dashed px-4 py-2.5 text-sm italic ${
                                  mine
                                    ? "border-brand-200/80 bg-brand-50/90 text-brand-800/70"
                                    : "border-slate-200 bg-slate-100/90 text-slate-500"
                                }`}
                              >
                                This message was deleted
                              </div>
                            ) : (
                              <>
                                <div
                                  className={`px-4 py-2.5 text-[15px] leading-relaxed ${
                                    mine
                                      ? "rounded-2xl rounded-br-md bg-brand-600 text-white shadow-sm shadow-brand-600/15"
                                      : "rounded-2xl rounded-bl-md border border-slate-200/70 bg-white text-slate-800 shadow-sm"
                                  }`}
                                >
                                  {body}
                                </div>
                                <div
                                  className={`mb-1 flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-sm opacity-0 transition group-hover/message:opacity-100 focus-within:opacity-100 ${
                                    mine ? "order-first" : ""
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessage(body)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Copy message"
                                    title="Copy"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={deleteMessageMutation.isPending}
                                    onClick={() => void handleDeleteMessage(m.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                                    aria-label="Delete message"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          <span className="px-1 text-[10px] tabular-nums text-slate-400">
                            {formatTime(m.created_at)}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="shrink-0 border-t border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4"
              >
                {(sendError || draftError) && (
                  <p className="mb-2 text-sm text-red-600">{sendError || draftError}</p>
                )}

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition focus-within:ring-2 focus-within:ring-brand-200/60">
                  {showDraftMenu && (
                    <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-3 py-2">
                      <span className="mr-1 text-[10px] font-medium text-slate-400 uppercase">
                        AI
                      </span>
                      {DRAFT_OPTIONS.map((opt) => {
                        const disabled =
                          drafting ||
                          (opt.needsText && !text.trim()) ||
                          (opt.needsThread && thread.length === 0);
                        return (
                          <button
                            key={opt.task}
                            type="button"
                            disabled={disabled}
                            onClick={() => runMessageDraft(opt.task)}
                            className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80 transition hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-200/80 disabled:opacity-40"
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowDraftMenu(false)}
                        className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Close AI options"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={2}
                      placeholder={`Write to ${partner.firstname}…`}
                      disabled={drafting}
                      className="block w-full resize-none border-0 bg-transparent px-4 pt-3 pb-10 pr-14 text-sm text-ink placeholder:text-slate-400 focus:ring-0 focus:outline-none disabled:opacity-50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />

                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <button
                        type="button"
                        disabled={drafting}
                        onClick={() => setShowDraftMenu((v) => !v)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition ${
                          showDraftMenu || drafting
                            ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200/70"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                        aria-expanded={showDraftMenu}
                      >
                        {drafting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                        )}
                        AI
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={sendMutation.isPending || !text.trim() || drafting}
                      aria-label="Send message"
                      className="absolute bottom-2 right-2 inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-brand-600 px-2.5 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-center text-[10px] text-slate-400 sm:text-left">
                  Enter to send · Shift+Enter for new line
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
