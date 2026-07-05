import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ForumReplyThread } from "../components/forum/ForumReplyThread";
import { ForumInlineAd, PageAdAside } from "../components/ads/PageAdAside";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PageBackLink } from "../components/ui/PageBackLink";
import { DefaultBanner } from "../components/ui/DefaultBanner";
import { UserAvatar } from "../components/ui/UserAvatar";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { buildLoginPath } from "../lib/authRedirect";
import { buildForumTopicPath, forumTopicApiSegment } from "../lib/forumPaths";
import type { Topic, TopicReply } from "../types";

export function ForumTopicPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [postError, setPostError] = useState("");
  const queryClient = useQueryClient();

  const { data: topic, isLoading, isError } = useQuery({
    queryKey: ["forum-topic", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Topic>(`/forum/topics/${forumTopicApiSegment(id!)}/`);
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
      >("/forum/replies/", { params: { topic: forumTopicApiSegment(id!) } });
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
        topic_id: topic?.id ?? Number(id),
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
      <PublicPageLayout title="Topic not found" back={{ to: "/forum", label: "Back to forum" }}>
        <p className="text-slate-600">This discussion could not be found.</p>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout
      compactHero
      title={topic.topic}
      subtitle={topic.sub_category_name ?? undefined}
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
      back={{
        to: topic.sub_category_id ? `/forum/category/${topic.sub_category_id}` : "/forum",
      }}
    >
      <PageAdAside context={{ subCategoryId: topic.sub_category_id }}>
        <ForumInlineAd context={{ subCategoryId: topic.sub_category_id }} />
      <article className="gre-public-card mb-6 overflow-hidden p-0">
        <div className="h-20 sm:h-24">
          <DefaultBanner kind="forum" seed={topic.id} />
        </div>
        <div className="p-5 sm:p-6">
          {topic.author && (
            <div className="flex items-center gap-3">
              <UserAvatar user={topic.author} size="sm" className="border-2" />
              <p className="text-sm font-medium text-brand-600">
                {topic.author.full_name ??
                  `${topic.author.firstname} ${topic.author.lastname}`.trim()}
              </p>
            </div>
          )}
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700">{topic.content}</p>
          <p className="mt-4 text-xs text-slate-400">
            {topic.views_count ?? 0} views · {replyTotal} replies
          </p>
        </div>
      </article>

      {postError && (
        <p className="gre-public-card mb-4 border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700">
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
          <Link
            to={buildLoginPath(`${location.pathname}${location.search}`)}
            className="font-medium text-brand-600 hover:underline"
          >
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
      </PageAdAside>
    </PublicPageLayout>
  );
}
