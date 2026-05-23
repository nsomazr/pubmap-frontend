import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ExternalLink,
  FolderTree,
  Layers,
  Map,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { SubcategoryVisual } from "../../components/taxonomy/SubcategoryVisual";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/api";
import { greStatBgBrand, greStatBgTeal } from "../../lib/greTheme";
import { resolveCategoryVisual } from "../../lib/taxonomyVisuals";
import type { Category } from "../../types";

function invalidateTaxonomy(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
  queryClient.invalidateQueries({ queryKey: ["categories"] });
  queryClient.invalidateQueries({ queryKey: ["subcategories"] });
}

function StatusPill({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        active
          ? "bg-teal-50 text-teal-800 ring-teal-200/80"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {status || "unknown"}
    </span>
  );
}

function CategoryCard({
  category,
  subDraft,
  onSubDraftChange,
  onAddSubcategory,
  addingSub,
}: {
  category: Category;
  subDraft: string;
  onSubDraftChange: (value: string) => void;
  onAddSubcategory: () => void;
  addingSub: boolean;
}) {
  const subs = category.sub_categories ?? [];
  const visual = category.visual ?? resolveCategoryVisual(category.name);

  return (
    <article className="gre-card flex flex-col overflow-hidden">
      <div className="flex items-start gap-2.5 border-b border-slate-100 bg-gradient-to-br from-brand-50/50 to-teal-50/30 px-4 py-3">
        <SubcategoryVisual visual={visual} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-base font-semibold text-ink">{category.name}</h3>
            <StatusPill status={category.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {subs.length} subcategor{subs.length === 1 ? "y" : "ies"} · used on map & forum
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 py-3">
        {subs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-4 text-center text-xs text-slate-500">
            No subcategories yet. Add one below.
          </p>
        ) : (
          <p className="max-h-36 overflow-y-auto text-xs leading-6">
            {subs.map((sub, index) => (
              <span key={sub.id}>
                {index > 0 && <span className="text-slate-300"> · </span>}
                <span
                  className={`font-medium ${
                    index % 2 === 0 ? "text-brand-700" : "text-teal-700"
                  }`}
                >
                  {sub.name}
                </span>
              </span>
            ))}
          </p>
        )}
      </div>

      <form
        className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (subDraft.trim()) onAddSubcategory();
        }}
      >
        <input
          type="text"
          value={subDraft}
          onChange={(e) => onSubDraftChange(e.target.value)}
          placeholder="New subcategory name…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <Button
          type="submit"
          variant="secondary"
          className="!px-2.5 !py-1.5 !text-xs"
          loading={addingSub}
          disabled={!subDraft.trim()}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>
    </article>
  );
}

export function CategoriesPage() {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [subDrafts, setSubDrafts] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data } = await api.get<Category[] | { results: Category[] }>("/categories/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const stats = useMemo(() => {
    const subTotal = categories.reduce((n, c) => n + (c.sub_categories?.length ?? 0), 0);
    const active = categories.filter((c) => c.status === "active").length;
    return { categories: categories.length, subcategories: subTotal, active };
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.sub_categories?.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [categories, query]);

  const createCategoryMutation = useMutation({
    mutationFn: () => api.post("/categories/", { name: name.trim(), status: "active" }),
    onSuccess: () => {
      setName("");
      setFormError("");
      invalidateTaxonomy(queryClient);
    },
    onError: () => setFormError("Could not create category. It may already exist."),
  });

  const createSubMutation = useMutation({
    mutationFn: ({ categoryId, subName }: { categoryId: number; subName: string }) =>
      api.post("/subcategories/", {
        name: subName.trim(),
        category_id: categoryId,
        status: "active",
      }),
    onSuccess: (_data, vars) => {
      setSubDrafts((prev) => ({ ...prev, [vars.categoryId]: "" }));
      setFormError("");
      invalidateTaxonomy(queryClient);
    },
    onError: () => setFormError("Could not add subcategory. Check the name and try again."),
  });

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Categories"
        description="Manage the research taxonomy used on the map, publications, and forum. Each category groups related subcategories."
        action={
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200"
          >
            <ExternalLink className="h-4 w-4" />
            View on map
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 gre-stagger">
        <div className={`gre-card bg-gradient-to-br ${greStatBgBrand} p-5`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <FolderTree className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-ink">{stats.categories}</p>
              <p className="text-xs font-medium text-slate-600">Categories</p>
            </div>
          </div>
        </div>
        <div className={`gre-card bg-gradient-to-br ${greStatBgTeal} p-5`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-ink">{stats.subcategories}</p>
              <p className="text-xs font-medium text-slate-600">Subcategories</p>
            </div>
          </div>
        </div>
        <div className="gre-card bg-gradient-to-br from-brand-50 to-teal-50/40 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-brand-600 shadow-sm">
              <Map className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-ink">{stats.active}</p>
              <p className="text-xs font-medium text-slate-600">Active on map</p>
            </div>
          </div>
        </div>
      </div>

      <section className="gre-card space-y-5 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Plus className="h-5 w-5 text-brand-600" />
          New category
        </h2>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setFormError("");
            if (name.trim()) createCategoryMutation.mutate();
          }}
        >
          <Input
            label="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Geology, Environmental Science…"
            className="flex-1"
          />
          <Button type="submit" loading={createCategoryMutation.isPending} className="sm:mb-0">
            Add category
          </Button>
        </form>
        {formError && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900 ring-1 ring-brand-200">
            {formError}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <BookOpen className="h-5 w-5 text-brand-600" />
            Taxonomy
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories or subcategories…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="gre-skeleton h-64 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={query ? "No matches" : "No categories yet"}
            description={
              query
                ? "Try a different search term or clear the filter."
                : "Create your first research category above. Subcategories can be added inside each card."
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 gre-stagger">
            {filtered.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                subDraft={subDrafts[cat.id] ?? ""}
                onSubDraftChange={(value) =>
                  setSubDrafts((prev) => ({ ...prev, [cat.id]: value }))
                }
                onAddSubcategory={() => {
                  const subName = (subDrafts[cat.id] ?? "").trim();
                  if (!subName) return;
                  createSubMutation.mutate({ categoryId: cat.id, subName });
                }}
                addingSub={
                  createSubMutation.isPending &&
                  createSubMutation.variables?.categoryId === cat.id
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
