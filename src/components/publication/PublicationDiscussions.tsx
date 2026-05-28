import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Reply } from "lucide-react";
import { InputWithSendAddon, TextareaWithSendAddon } from "../ui/FieldSendAddon";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { ResearcherRankInline } from "../rankings/ResearcherRankInline";
import { UserAvatar } from "../ui/UserAvatar";
import type { CoAuthorPerson, PublicationCoAuthors, PublicationConversation } from "../../types";

interface Props {
  publicationId: number;
  coAuthors?: PublicationCoAuthors | null;
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

function authorRoleLabel(
  user?: { id?: number; email?: string },
  coAuthors?: PublicationCoAuthors | null
): string | null {
  if (!user || !coAuthors?.team?.length) return null;
  const email = (user.email || "").trim().toLowerCase();
  const match = coAuthors.team.find(
    (person: CoAuthorPerson) =>
      (user.id && person.user_id === user.id) ||
      (email && (person.email || "").trim().toLowerCase() === email)
  );
  const role = (match?.role || "").trim();
  if (!role) return null;
  if (/^lead/i.test(role)) return "Lead author";
  if (/^co-?author/i.test(role)) return "Co-author";
  return role;
}

function AuthorRoleBadge({ role }: { role: string | null }) {
  if (!role) return null;
  const isLead = role === "Lead author";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        isLead
          ? "bg-brand-50 text-brand-800 ring-brand-200/80"
          : "bg-teal-50 text-teal-800 ring-teal-200/80"
      }`}
    >
      {role}
    </span>
  );
}

export function PublicationDiscussions({ publicationId, coAuthors }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});

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
      queryClient.invalidateQueries({ queryKey: ["pub-conversations", publicationId] });
    },
  });

  return (
    <section className="rounded-3xl bg-white ring-1 ring-slate-200/80 sm:p-8 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <MessageSquare className="h-5 w-5 text-brand-600" />
        Discussion
        <span className="text-sm font-normal text-slate-400">({threads.length})</span>
      </h2>

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">Loading discussions…</p>
      ) : (
        <div className="mt-6 space-y-5">
          {threads.map((thread) => {
            const threadRole = authorRoleLabel(thread.user, coAuthors);
            return (
              <article
                key={thread.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar user={thread.user} size="sm" className="border-2" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{authorName(thread.user)}</p>
                      <AuthorRoleBadge role={threadRole} />
                    </div>
                    <div className="mt-1">
                      <ResearcherRankInline ranking={thread.user?.ranking} compact showBadges={false} />
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
                      const replyRole = authorRoleLabel(r.user, coAuthors);
                      return (
                        <li key={r.id} className="flex gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
                          <UserAvatar user={r.user} size="sm" className="h-8 w-8 border text-[10px]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-semibold text-slate-600">{authorName(r.user)}</p>
                              <AuthorRoleBadge role={replyRole} />
                            </div>
                            <ResearcherRankInline ranking={r.user?.ranking} compact showBadges={false} />
                            <p className="mt-1 text-sm text-slate-600">{r.reply}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {user ? (
                  <InputWithSendAddon
                    className="mt-4"
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
                    icon={Reply}
                    submitAriaLabel="Post response"
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {user ? (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">Start a discussion</p>
          <TextareaWithSendAddon
            value={newComment}
            onChange={setNewComment}
            onSubmit={() => {
              if (newComment.trim()) postThread.mutate();
            }}
            rows={3}
            placeholder="What would you like to discuss about this study?"
            loading={postThread.isPending}
            submitLabel="Post"
            submitAriaLabel="Post discussion"
          />
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
    </section>
  );
}
