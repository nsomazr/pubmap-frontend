import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { ForumCategoryCard } from "../components/forum/ForumCategoryCard";
import { SubcategoryVisual } from "../components/taxonomy/SubcategoryVisual";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { resolveSubcategoryFromModel, resolveSubcategoryVisual } from "../lib/taxonomyVisuals";
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

  const subVisualById = useMemo(() => {
    const map = new Map<number, ReturnType<typeof resolveSubcategoryFromModel>>();
    for (const sub of subcategories) {
      const visual = resolveSubcategoryFromModel(sub);
      if (visual) map.set(sub.id, visual);
    }
    return map;
  }, [subcategories]);

  const { data: recentTopics = [] } = useQuery({
    queryKey: ["forum-recent"],
    queryFn: async () => {
      const { data } = await api.get<Topic[] | { results: Topic[] }>("/forum/topics/");
      const list = Array.isArray(data) ? data : (data.results ?? []);
      return list.slice(0, 3);
    },
  });

  const isLoading = catsLoading || subsLoading;

  return (
    <PublicPageLayout
      compactHero
      wide
      accent="blue"
      badge="Discussions"
      title="Forum Discussions"
      crumbs={[{ label: "Home", to: "/" }, { label: "Forum" }]}
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`gre-interactive shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              categoryFilter === "all"
                ? "gre-gradient-bar text-white shadow-md shadow-brand-600/25"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-200"
            }`}
          >
            All fields
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(String(c.id))}
              className={`gre-interactive shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                categoryFilter === String(c.id)
                  ? "gre-gradient-bar text-white shadow-md shadow-brand-600/25"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <MessageSquare className="h-4 w-4 text-brand-600" />
          {filtered.length} forums available
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="gre-skeleton h-[5.5rem]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-brand-300" />
          <p className="mt-3 font-medium text-slate-600">No forums in this category</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 gre-stagger">
          {filtered.map((sub, index) => (
            <ForumCategoryCard key={sub.id} sub={sub} priorityImage={index < 6} />
          ))}
        </div>
      )}

      {recentTopics.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-ink">Recent discussions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest topics across all research areas.
          </p>
          <ul className="gre-card mt-4 divide-y divide-slate-100 overflow-hidden p-0">
            {recentTopics.map((t) => {
              const subVisual =
                subVisualById.get(t.sub_category_id) ??
                resolveSubcategoryVisual(t.sub_category_name || t.subfield_name);
              return (
              <li key={t.id}>
                <Link
                  to={`/forum/topic/${t.id}`}
                  className="gre-interactive flex items-center gap-3 px-4 py-4 hover:bg-brand-50/50 sm:gap-4 sm:px-5"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80">
                    {subVisual ? (
                      <SubcategoryVisual
                        visual={subVisual}
                        size="md"
                        fit="contain"
                        clip={false}
                        className="!h-12 !w-12 !rounded-xl"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center bg-brand-50 text-sm font-bold text-brand-700">
                        {(t.sub_category_name || "GR").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{t.topic}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {t.sub_category_name || t.subfield_name}
                      {t.author?.full_name && ` · ${t.author.full_name}`}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
                    {t.replies_count ?? 0} replies · {t.views_count ?? 0} views
                  </span>
                </Link>
              </li>
            );
            })}
          </ul>
        </section>
      )}
    </PublicPageLayout>
  );
}
