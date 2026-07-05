import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ForumNewTopicForm } from "../components/forum/ForumNewTopicForm";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicEmptyState } from "../components/layout/PublicEmptyState";
import { PageBackLink } from "../components/ui/PageBackLink";
import { ForumInlineAd, PageAdAside } from "../components/ads/PageAdAside";
import { useAuth } from "../context/AuthContext";
import { resolveSubcategoryFromModel } from "../lib/taxonomyVisuals";
import { SubcategoryVisual } from "../components/taxonomy/SubcategoryVisual";
import { Pagination } from "../components/ui/Pagination";
import { usePageParam } from "../hooks/usePageParam";
import api from "../lib/api";
import { buildLoginPath } from "../lib/authRedirect";
import { buildForumTopicPath } from "../lib/forumPaths";
import { DEFAULT_PAGE_SIZE, unwrapPaginated, type Paginated } from "../lib/pagination";
import type { SubCategory, Topic } from "../types";

export function ForumCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicContent, setTopicContent] = useState("");
  const [postError, setPostError] = useState("");
  const queryClient = useQueryClient();

  const { data: sub } = useQuery({
    queryKey: ["subcategory", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<SubCategory>(`/subcategories/${id}/`);
      return data;
    },
  });

  const { page, setPage } = usePageParam([id]);

  const { data: topicsData, isLoading } = useQuery({
    queryKey: ["forum-topics", id, page],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get("/forum/topics/", {
        params: { sub_category: id, page, page_size: DEFAULT_PAGE_SIZE },
      });
      return unwrapPaginated<Topic>(data as Topic[] | Paginated<Topic>);
    },
  });

  const topics = topicsData?.results ?? [];
  const topicsTotal = topicsData?.count ?? 0;

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/forum/topics/", {
        topic: topicTitle,
        content: topicContent,
        sub_category_id: Number(id),
      }),
    onSuccess: () => {
      setTopicTitle("");
      setTopicContent("");
      setShowForm(false);
      setPostError("");
      queryClient.invalidateQueries({ queryKey: ["forum-topics", id] });
      queryClient.invalidateQueries({ queryKey: ["forum-recent"] });
    },
    onError: (err: { response?: { data?: Record<string, string[] | string> } }) => {
      const data = err.response?.data;
      const first =
        (typeof data?.detail === "string" && data.detail) ||
        (Array.isArray(data?.sub_category_id) && data.sub_category_id[0]) ||
        (Array.isArray(data?.topic) && data.topic[0]) ||
        (Array.isArray(data?.content) && data.content[0]) ||
        "Could not create topic. Please try again.";
      setPostError(first);
    },
  });

  const adContext = sub
    ? { subCategoryId: sub.id, categoryId: sub.category_id ?? undefined }
    : id
      ? { subCategoryId: Number(id) }
      : undefined;

  return (
    <PublicPageLayout
      compactHero
      wide
      title={sub?.name ?? "Forum"}
      subtitle={sub?.category_name ?? undefined}
      heroVisual={(() => {
        const visual = sub ? resolveSubcategoryFromModel(sub) : null;
        return visual ? (
          <SubcategoryVisual
            visual={visual}
            size="lg"
            fit="contain"
            clip={false}
            shadow={false}
            className="!h-16 !w-16 !rounded-none sm:!h-20 sm:!w-20"
            title={sub?.name}
          />
        ) : null;
      })()}
      crumbs={[
        { label: "Home", to: "/" },
        { label: "Forum", to: "/forum" },
        { label: sub?.name ?? "Subfield" },
      ]}
    >
      <PageAdAside context={adContext}>
        <ForumInlineAd context={adContext} />

        <PageBackLink to="/forum" label="All forums" className="mb-5" />

        {user ? (
          <ForumNewTopicForm
            open={showForm}
            onToggle={() => setShowForm((value) => !value)}
            title={topicTitle}
            content={topicContent}
            onTitleChange={setTopicTitle}
            onContentChange={setTopicContent}
            posting={createMutation.isPending}
            error={postError}
            onSubmit={() => {
              setPostError("");
              if (topicTitle.trim() && topicContent.trim()) createMutation.mutate();
            }}
          />
        ) : (
          <p className="mb-5 text-sm text-slate-500">
            <Link
              to={buildLoginPath(`${location.pathname}${location.search}`)}
              className="font-medium text-brand-700 hover:underline"
            >
              Sign in
            </Link>{" "}
            to start a topic.
          </p>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="gre-skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <PublicEmptyState
            icon={MessageSquare}
            title="No discussions yet"
            description={user ? "Open New topic above to post the first one." : "Sign in to start a discussion."}
            action={
              !user ? (
                <Link
                  to={buildLoginPath(`${location.pathname}${location.search}`)}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Sign in
                </Link>
              ) : !showForm ? (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  New topic
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-2">
            {topics.map((topic) => {
              const replies = topic.replies_count ?? 0;
              const views = topic.views_count ?? 0;
              const author =
                topic.author?.full_name?.trim() ||
                [topic.author?.firstname, topic.author?.lastname].filter(Boolean).join(" ").trim();

              return (
                <li key={topic.id}>
                  <Link
                    to={buildForumTopicPath(topic)}
                    className="gre-interactive group block rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand-800">
                          {topic.topic}
                        </h3>
                        {topic.content ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{topic.content}</p>
                        ) : null}
                        {author ? (
                          <p className="mt-1 text-xs text-slate-400">{author}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right text-[11px] font-medium tabular-nums text-slate-500">
                        <p>
                          {replies} {replies === 1 ? "reply" : "replies"}
                        </p>
                        <p className="mt-0.5 text-slate-400">{views} views</p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {!isLoading && topicsTotal > 0 && (
          <Pagination
            page={page}
            totalCount={topicsTotal}
            onPageChange={setPage}
            itemLabel="topics"
            className="mt-6"
          />
        )}
      </PageAdAside>
    </PublicPageLayout>
  );
}
