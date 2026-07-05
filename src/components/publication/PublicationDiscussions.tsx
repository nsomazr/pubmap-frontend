import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { InputWithSendAddon, TextareaWithSendAddon } from "../ui/FieldSendAddon";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { RankedNameLabel } from "../rankings/RankedNameLabel";
import { UserAvatar } from "../ui/UserAvatar";
import type { PublicationCoAuthors, PublicationConversation } from "../../types";
import { discussionAuthorRoleLabel } from "../../lib/publicationAuthors";
import { buildLoginPath } from "../../lib/authRedirect";
import { PublicationPageSection } from "./PublicationPageSection";
import { grePaperSectionHeadingClass } from "../../lib/publicationPageStyles";

interface Props {
  publicationId: number;
  coAuthors?: PublicationCoAuthors | null;
  authorUserId?: number | null;
}

function authorName(user?: { firstname?: string; lastname?: string; full_name?: string }) {
  if (!user) return "Researcher";
  return user.full_name?.trim() || `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || "Researcher";
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function AuthorRoleBadge({ role }: { role: string | null }) {
  if (!role) return null;
  const isLead = role === "Lead author";
  const isMember = role === "Member";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        isLead
          ? "bg-brand-50 text-brand-800 ring-brand-200/80"
          : isMember
            ? "bg-slate-100 text-slate-600 ring-slate-200/80"
            : "bg-teal-50 text-teal-800 ring-teal-200/80"
      }`}
    >
      {role}
    </span>
  );
}

export function PublicationDiscussions({ publicationId, coAuthors, authorUserId }: Props) {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyOpenFor, setReplyOpenFor] = useState<Record<number, boolean>>({});

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["pub-conversations", publicationId],
    queryFn: async () => {
      const { data } = await api.get<PublicationConversation[] | { results: PublicationConversation[] }>(
        "/conversations/",
        { params: { publication_id: publicationId } }
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const postThread = useMutation({
    mutationFn: () =>
      api.post("/conversations/", { comment: newComment.trim(), publication_id: publicationId }),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["pub-conversations", publicationId] });
    },
  });

  const postReply = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: number; text: string }) =>
      api.post("/replies/", { reply: text, conversation_id: conversationId }),
    onSuccess: (_, vars) => {
      setReplyDrafts((d) => ({ ...d, [vars.conversationId]: "" }));
      setReplyOpenFor((o) => ({ ...o, [vars.conversationId]: false }));
      queryClient.invalidateQueries({ queryKey: ["pub-conversations", publicationId] });
    },
  });

  return (
    <PublicationPageSection
      id="discussion"
      title="Discussion"
      icon={MessageSquare}
      description={
        <>
          {threads.length} thread{threads.length === 1 ? "" : "s"} on this study
        </>
      }
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading discussions…</p>
      ) : (
        <div className="space-y-5">
          {threads.map((thread) => {
            const threadRole = discussionAuthorRoleLabel(thread.user, coAuthors, {
              authorUserId,
            });
            return (
              <article
                key={thread.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar user={thread.user} size="sm" className="border-2" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <RankedNameLabel
                        name={authorName(thread.user)}
                        nameClassName="text-sm font-semibold text-ink"
                        ranking={thread.user?.ranking}
                        registered={Boolean(thread.user?.id)}
                        compact
                        showBadges={false}
                      />
                      <AuthorRoleBadge role={threadRole} />
                    </div>
                    {thread.created_at && (
                      <p className="text-xs text-slate-400">{formatWhen(thread.created_at)}</p>
                    )}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {thread.comment}
                </p>

                {(thread.replies ?? []).length > 0 && (
                  <ul className="mt-4 space-y-3 border-l-2 border-brand-100 pl-4">
                    {thread.replies!.map((r) => {
                      const replyRole = discussionAuthorRoleLabel(r.user, coAuthors, {
                        authorUserId,
                      });
                      return (
                        <li key={r.id} className="flex gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
                          <UserAvatar user={r.user} size="sm" className="h-8 w-8 border text-[10px]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <RankedNameLabel
                                name={authorName(r.user)}
                                nameClassName="text-xs font-semibold text-slate-600"
                                ranking={r.user?.ranking}
                                registered={Boolean(r.user?.id)}
                                compact
                                showBadges={false}
                              />
                              <AuthorRoleBadge role={replyRole} />
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{r.reply}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {user ? (
                  replyOpenFor[thread.id] ? (
                    <div className="mt-4 space-y-2">
                      <InputWithSendAddon
                        value={replyDrafts[thread.id] ?? ""}
                        onChange={(value) =>
                          setReplyDrafts((d) => ({ ...d, [thread.id]: value }))
                        }
                        onSubmit={() => {
                          const text = (replyDrafts[thread.id] ?? "").trim();
                          if (text) postReply.mutate({ conversationId: thread.id, text });
                        }}
                        placeholder="Write a response…"
                        loading={postReply.isPending}
                        submitAriaLabel="Post response"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setReplyOpenFor((o) => ({ ...o, [thread.id]: false }));
                          setReplyDrafts((d) => ({ ...d, [thread.id]: "" }));
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyOpenFor((o) => ({ ...o, [thread.id]: true }))}
                      className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Reply
                    </button>
                  )
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {user ? (
        <div className="border-t border-slate-100 pt-6">
          <p className={`mb-2 ${grePaperSectionHeadingClass}`}>Start a discussion</p>
          <TextareaWithSendAddon
            value={newComment}
            onChange={setNewComment}
            onSubmit={() => {
              if (newComment.trim()) postThread.mutate();
            }}
            rows={3}
            placeholder="What would you like to discuss about this study?"
            loading={postThread.isPending}
            submitAriaLabel="Post discussion"
          />
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link
            to={buildLoginPath(`${location.pathname}${location.search}`)}
            className="font-semibold text-brand-600 hover:underline"
          >
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
    </PublicationPageSection>
  );
}
