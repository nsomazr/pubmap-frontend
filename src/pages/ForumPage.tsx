import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { ForumCategoryCard } from "../components/forum/ForumCategoryCard";
import { ForumRecentDiscussions } from "../components/forum/ForumRecentDiscussions";
import { ForumInlineAd, PageAdAside } from "../components/ads/PageAdAside";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicEmptyState } from "../components/layout/PublicEmptyState";
import api from "../lib/api";
import type { Category, SubCategory, Topic } from "../types";

export function ForumPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[] | { results: Category[] }>("/categories/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const { data: subcategories = [], isLoading: subsLoading } = useQuery({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const { data } = await api.get<SubCategory[] | { results: SubCategory[] }>(
        "/subcategories/",
      );
      const list = Array.isArray(data) ? data : (data.results ?? []);
      return list.filter((s) => s.status === "active");
    },
  });

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return subcategories;
    return subcategories.filter((s) => s.category_id === Number(categoryFilter));
  }, [subcategories, categoryFilter]);

  const { data: recentTopics = [] } = useQuery({
    queryKey: ["forum-recent"],
    queryFn: async () => {
      const { data } = await api.get<Topic[] | { results: Topic[] }>("/forum/topics/");
      const list = Array.isArray(data) ? data : (data.results ?? []);
      return list.slice(0, 5);
    },
  });

  const isLoading = catsLoading || subsLoading;
  const adContext =
    categoryFilter !== "all" ? { categoryId: Number(categoryFilter) } : undefined;

  const chipClass = (active: boolean) =>
    `gre-interactive shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-white text-ink shadow-sm ring-1 ring-slate-200"
        : "text-slate-600 hover:bg-white/70 hover:text-ink"
    }`;

  return (
    <PublicPageLayout
      compactHero
      wide
      title="Forum"
      subtitle="Discuss research by field and subfield."
      crumbs={[{ label: "Home", to: "/" }, { label: "Forum" }]}
    >
      <PageAdAside context={adContext}>
        <ForumInlineAd context={adContext} />

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/80 md:flex-wrap md:overflow-visible">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={chipClass(categoryFilter === "all")}
            >
              All fields
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(String(c.id))}
                className={chipClass(categoryFilter === String(c.id))}
              >
                {c.name}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <MessageSquare className="h-4 w-4" />
            {filtered.length} forums
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="gre-skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <PublicEmptyState
            icon={MessageSquare}
            title="No forums in this category"
            description="Try another field or check back later."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((sub, index) => (
              <ForumCategoryCard key={sub.id} sub={sub} priorityImage={index < 6} />
            ))}
          </div>
        )}

        <ForumRecentDiscussions topics={recentTopics} />
      </PageAdAside>
    </PublicPageLayout>
  );
}
