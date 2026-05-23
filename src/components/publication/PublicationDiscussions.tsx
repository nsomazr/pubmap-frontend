import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Reply, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { ResearcherRankInline } from "../rankings/ResearcherRankInline";
import { UserAvatar } from "../ui/UserAvatar";
import type { PublicationConversation } from "../../types";

interface Props {
  publicationId: number;
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

export function PublicationDiscussions({ publicationId }: Props) {
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
      <p className="mt-1 text-sm text-slate-500">
        Ask questions or share feedback on this publication. Replies are stored with your account.
      </p>

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">Loading discussion…</p>
      ) : (
        <div className="mt-6 space-y-5">
          {threads.map((thread) => (
            <article
              key={thread.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <UserAvatar user={thread.user} size="sm" className="border-2" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{authorName(thread.user)}</p>
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
                  {thread.replies!.map((r) => (
                    <li key={r.id} className="flex gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">
                      <UserAvatar user={r.user} size="sm" className="h-8 w-8 border text-[10px]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-600">{authorName(r.user)}</p>
                        <ResearcherRankInline ranking={r.user?.ranking} compact showBadges={false} />
                        <p className="mt-1 text-sm text-slate-600">{r.reply}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {user ? (
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = (replyDrafts[thread.id] ?? "").trim();
                    if (text) postReply.mutate({ conversationId: thread.id, text });
                  }}
                >
                  <input
                    type="text"
                    value={replyDrafts[thread.id] ?? ""}
                    onChange={(e) =>
                      setReplyDrafts((d) => ({ ...d, [thread.id]: e.target.value }))
                    }
                    placeholder="Write a reply…"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <Button type="submit" variant="secondary" className="shrink-0 px-3">
                    <Reply className="h-4 w-4" />
                  </Button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {user ? (
        <form
          className="mt-8 space-y-3 border-t border-slate-100 pt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (newComment.trim()) postThread.mutate();
          }}
        >
          <Textarea
            label="Start a conversation"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="What would you like to discuss about this study?"
          />
          <Button type="submit" loading={postThread.isPending}>
            <Send className="h-4 w-4" />
            Post comment
          </Button>
        </form>
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
