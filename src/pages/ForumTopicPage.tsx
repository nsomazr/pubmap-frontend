import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ForumReplyThread } from "../components/forum/ForumReplyThread";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { DefaultBanner } from "../components/ui/DefaultBanner";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import type { Topic, TopicReply } from "../types";

export function ForumTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [postError, setPostError] = useState("");
  const queryClient = useQueryClient();

  const { data: topic, isLoading, isError } = useQuery({
    queryKey: ["forum-topic", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Topic>(`/forum/topics/${id}/`);
      return data;
    },
  });

  const {
    data: replies = [],
    isError: repliesError,
    refetch: refetchReplies,
  } = useQuery({
    queryKey: ["forum-replies", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<
        TopicReply[] | { results: TopicReply[]; count?: number }
      >("/forum/replies/", { params: { topic: id } });
      if (Array.isArray(data)) return data;
      return data.results ?? [];
    },
  });

  const replyTotal = replies.length > 0 ? replies.length : (topic?.replies_count ?? 0);

  const replyMutation = useMutation({
    mutationFn: ({
      content,
      parentReplyId,
    }: {
      content: string;
      parentReplyId?: number;
    }) =>
      api.post("/forum/replies/", {
        content,
        topic_id: Number(id),
        ...(parentReplyId != null ? { parent_reply_id: parentReplyId } : {}),
      }),
    onSuccess: () => {
      setReply("");
      setPostError("");
      queryClient.invalidateQueries({ queryKey: ["forum-replies", id] });
      queryClient.invalidateQueries({ queryKey: ["forum-topic", id] });
    },
    onError: (err: { response?: { data?: Record<string, unknown> } }) => {
      const data = err.response?.data;
      const detail =
        typeof data?.detail === "string"
          ? data.detail
          : Array.isArray(data?.content)
            ? String(data.content[0])
            : "Could not post your reply. Please try again.";
      setPostError(detail);
    },
  });

  if (isLoading) {
    return (
      <PublicPageLayout title="Discussion" crumbs={[{ label: "Forum", to: "/forum" }]}>
        <p className="text-slate-500">Loading…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !topic) {
    return (
      <PublicPageLayout title="Topic not found">
        <Link to="/forum" className="inline-flex items-center gap-2 text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout
      compactHero
      accent="blue"
      badge="Discussion"
      title={topic.topic}
      subtitle={topic.sub_category_name}
      crumbs={[
        { label: "Forum", to: "/forum" },
        ...(topic.sub_category_id
          ? [
              {
                label: topic.sub_category_name ?? "Category",
                to: `/forum/category/${topic.sub_category_id}`,
              },
            ]
          : []),
        { label: "Discussion" },
      ]}
    >
      <Link
        to={topic.sub_category_id ? `/forum/category/${topic.sub_category_id}` : "/forum"}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <article className="mb-8 overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.1)] ring-1 ring-slate-200/80">
        <div className="h-24 sm:h-28">
          <DefaultBanner kind="forum" seed={topic.id} />
        </div>
        <div className="p-6 sm:p-8">
          {topic.author && (
            <p className="text-sm font-medium text-brand-600">
              {topic.author.full_name ??
                `${topic.author.firstname} ${topic.author.lastname}`.trim()}
            </p>
          )}
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700">{topic.content}</p>
          <p className="mt-4 text-xs text-slate-400">
            {topic.views_count ?? 0} views · {replyTotal} replies
          </p>
        </div>
      </article>

      {postError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {postError}
        </p>
      )}

      <ForumReplyThread
        replies={replies}
        totalCount={replyTotal}
        loadError={repliesError}
        onRetryLoad={() => refetchReplies()}
        canReply={Boolean(user)}
        posting={replyMutation.isPending}
        onSubmitReply={(content, parentReplyId) => {
          setPostError("");
          replyMutation.mutate({ content, parentReplyId });
        }}
        topLevelDraft={reply}
        onTopLevelDraftChange={setReply}
        onTopLevelSubmit={() => {
          if (reply.trim()) {
            setPostError("");
            replyMutation.mutate({ content: reply.trim() });
          }
        }}
      />

      {!user && (
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
    </PublicPageLayout>
  );
}
