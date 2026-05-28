import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PageBackLink } from "../components/ui/PageBackLink";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { useAuth } from "../context/AuthContext";
import { DefaultBanner } from "../components/ui/DefaultBanner";
import { greFormPanelClass } from "../lib/formStyles";
import { resolveSubcategoryFromModel } from "../lib/taxonomyVisuals";
import { SubcategoryVisual } from "../components/taxonomy/SubcategoryVisual";
import api from "../lib/api";
import type { SubCategory, Topic } from "../types";

export function ForumCategoryPage() {
  const { id } = useParams<{ id: string }>();
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

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["forum-topics", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Topic[] | { results: Topic[] }>("/forum/topics/", {
        params: { sub_category: id },
      });
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

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

  return (
    <PublicPageLayout
      compactHero
      wide
      accent="blue"
      badge={sub?.field_name || sub?.category_name}
      title={sub?.name ?? "Forum"}
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageBackLink to="/forum" label="All forums" />
        {user && (
          <Button type="button" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            New topic
          </Button>
        )}
      </div>

      {showForm && user && (
        <form
          className={`${greFormPanelClass} mb-8`}
          onSubmit={(e) => {
            e.preventDefault();
            setPostError("");
            if (topicTitle.trim() && topicContent.trim()) createMutation.mutate();
          }}
        >
          {postError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {postError}
            </p>
          )}
          <Input
            label="Topic title"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            required
          />
          <Textarea
            label="Content"
            value={topicContent}
            onChange={(e) => setTopicContent(e.target.value)}
            rows={4}
            required
          />
          <Button type="submit" loading={createMutation.isPending}>
            Post topic
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-slate-500">Loading topics…</p>
      ) : topics.length === 0 ? (
        <p className="rounded-3xl bg-white p-12 text-center text-slate-500 ring-1 ring-slate-200/80">
          No discussions yet.
          {user ? " Start the first topic above." : " Sign in to start a discussion."}
        </p>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={`/forum/topic/${topic.id}`}
              className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <DefaultBanner kind="forum" seed={topic.id} compact />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-ink sm:text-[15px]">{topic.topic}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 sm:text-sm">{topic.content}</p>
                <p className="mt-1.5 text-[11px] text-slate-400 sm:text-xs">
                  {topic.replies_count ?? 0} replies · {topic.views_count ?? 0} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
}
