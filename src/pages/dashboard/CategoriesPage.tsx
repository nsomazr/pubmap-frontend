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
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { SubcategoryVisual } from "../../components/taxonomy/SubcategoryVisual";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/api";
import { greStatBgBrand, greStatBgTeal } from "../../lib/greTheme";
import { resolveCategoryVisual } from "../../lib/taxonomyVisuals";
import { isPlatformAdmin } from "../../lib/userAccess";
import type { Category, CategoryManagerRow } from "../../types";

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

function CategoryManagersSection({ categoryId }: { categoryId: number }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ["category-managers", categoryId],
    queryFn: async () => {
      const { data } = await api.get<{ managers: CategoryManagerRow[] }>(
        `/categories/${categoryId}/managers/`
      );
      return data.managers ?? [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      api.post(`/categories/${categoryId}/managers/assign/`, { email: email.trim() }),
    onSuccess: () => {
      setEmail("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["category-managers", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
    },
    onError: () => setError("Could not assign manager. Check the email and try again."),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) =>
      api.post(`/categories/${categoryId}/managers/remove/`, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-managers", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
    },
  });

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category managers</p>
      <p className="mt-1 text-xs text-slate-500">
        Managers can review pending submissions only for this category.
      </p>
      {isLoading ? (
        <p className="mt-2 text-xs text-slate-400">Loading managers…</p>
      ) : managers.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">No managers assigned yet.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {managers.map((manager) => (
            <li
              key={manager.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs"
            >
              <span className="min-w-0 truncate">
                <span className="font-medium text-slate-700">{manager.full_name || manager.email}</span>
                <span className="text-slate-400"> · {manager.email}</span>
              </span>
              <button
                type="button"
                onClick={() => removeMutation.mutate(manager.user_id)}
                className="shrink-0 font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          if (email.trim()) assignMutation.mutate();
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Manager email…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
        />
        <Button
          type="submit"
          variant="secondary"
          className="!px-2.5 !py-1.5 !text-xs"
          loading={assignMutation.isPending}
          disabled={!email.trim()}
        >
          Assign
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function CategoryCard({
  category,
  subDraft,
  subIconFile,
  onSubDraftChange,
  onSubIconChange,
  onAddSubcategory,
  addingSub,
}: {
  category: Category;
  subDraft: string;
  subIconFile: File | null;
  onSubDraftChange: (value: string) => void;
  onSubIconChange: (file: File | null) => void;
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
          <ul className="max-h-44 space-y-2 overflow-y-auto">
            {subs.map((sub) => (
              <li key={sub.id} className="flex items-center gap-2 text-xs">
                <SubcategoryVisual
                  visual={sub.visual ?? { name: sub.name, icon_key: "layers", accent_color: "#3b5bdb" }}
                  size="xs"
                />
                <span className="font-medium text-slate-700">{sub.name}</span>
              </li>
            ))}
          </ul>
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
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-200">
          Logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(e) => onSubIconChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {subIconFile && (
          <span className="max-w-[88px] truncate text-[10px] text-brand-700" title={subIconFile.name}>
            {subIconFile.name}
          </span>
        )}
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

      <CategoryManagersSection categoryId={category.id} />
    </article>
  );
}

export function CategoriesPage() {
  const { user } = useAuth();
  if (!isPlatformAdmin(user)) return <Navigate to="/dashboard" replace />;

  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [subDrafts, setSubDrafts] = useState<Record<number, string>>({});
  const [subIconDrafts, setSubIconDrafts] = useState<Record<number, File | null>>({});
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
    mutationFn: async ({
      categoryId,
      subName,
      iconFile,
    }: {
      categoryId: number;
      subName: string;
      iconFile?: File | null;
    }) => {
      const { data } = await api.post<{ id: number }>("/subcategories/", {
        name: subName.trim(),
        category_id: categoryId,
        status: "active",
      });
      if (iconFile) {
        const form = new FormData();
        form.append("icon", iconFile);
        await api.post(`/subcategories/${data.id}/upload_icon/`, form);
      }
      return data;
    },
    onSuccess: (_data, vars) => {
      setSubDrafts((prev) => ({ ...prev, [vars.categoryId]: "" }));
      setSubIconDrafts((prev) => ({ ...prev, [vars.categoryId]: null }));
      setFormError("");
      invalidateTaxonomy(queryClient);
    },
    onError: () => setFormError("Could not add subcategory. Check the name and try again."),
  });

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Categories"
        description="Manage the research taxonomy and assign category managers who review submissions for each field."
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
                subIconFile={subIconDrafts[cat.id] ?? null}
                onSubDraftChange={(value) =>
                  setSubDrafts((prev) => ({ ...prev, [cat.id]: value }))
                }
                onSubIconChange={(file) =>
                  setSubIconDrafts((prev) => ({ ...prev, [cat.id]: file }))
                }
                onAddSubcategory={() => {
                  const subName = (subDrafts[cat.id] ?? "").trim();
                  if (!subName) return;
                  createSubMutation.mutate({
                    categoryId: cat.id,
                    subName,
                    iconFile: subIconDrafts[cat.id],
                  });
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
