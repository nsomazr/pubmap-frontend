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
import { PaperLogoUploadField } from "../../components/admin/PaperLogoUploadField";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { SubcategoryVisual } from "../../components/taxonomy/SubcategoryVisual";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/api";
import {
  greAccountStatDraft,
  greAccountStatPending,
  greAccountStatPublished,
} from "../../lib/greTheme";
import { resolveCategoryVisual } from "../../lib/taxonomyVisuals";
import { isPlatformAdmin } from "../../lib/userAccess";
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

function CategoryManagersLink({ categoryId, count }: { categoryId: number; count: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-xs">
      <span className="text-slate-500">
        {count} manager{count === 1 ? "" : "s"} assigned
      </span>
      <Link
        to={`/dashboard/managers?category=${categoryId}`}
        className="font-semibold text-brand-700 hover:underline"
      >
        Manage managers
      </Link>
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
    <article className="border-b border-slate-100 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <SubcategoryVisual visual={visual} size="md" className="!h-11 !w-11 shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-ink">{category.name}</h3>
              <StatusPill status={category.status} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {subs.length} subfield{subs.length === 1 ? "" : "s"} · map & forum
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 sm:px-5">
        {subs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-center text-xs text-slate-500">
            No subfields yet — add one below.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {subs.map((sub) => (
              <li
                key={sub.id}
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-xs ring-1 ring-slate-200/80"
              >
                <SubcategoryVisual
                  visual={
                    sub.visual ?? { name: sub.name, icon_key: "layers", accent_color: "#3b5bdb" }
                  }
                  size="xs"
                  className="!h-7 !w-7"
                />
                <span className="truncate font-medium text-slate-700">{sub.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="border-t border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (subDraft.trim()) onAddSubcategory();
        }}
      >
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Add subfield
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_auto] lg:items-end">
          <Input
            label="Subfield name"
            value={subDraft}
            onChange={(e) => onSubDraftChange(e.target.value)}
            placeholder="e.g. Geochemistry, Petrology…"
          />
          <PaperLogoUploadField
            label="Paper logo"
            file={subIconFile}
            onChange={onSubIconChange}
            compact
          />
          <Button
            type="submit"
            className="w-full sm:w-auto lg:mb-0.5"
            loading={addingSub}
            disabled={!subDraft.trim()}
          >
            <Plus className="h-4 w-4" />
            Add subfield
          </Button>
        </div>
      </form>

      <CategoryManagersLink categoryId={category.id} count={category.manager_count ?? 0} />
    </article>
  );
}

export function CategoriesPage() {
  const { user } = useAuth();
  if (!isPlatformAdmin(user)) return <Navigate to="/dashboard" replace />;

  const [name, setName] = useState("");
  const [categoryLogo, setCategoryLogo] = useState<File | null>(null);
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
    mutationFn: async () => {
      const { data } = await api.post<{ id: number }>("/categories/", {
        name: name.trim(),
        status: "active",
      });
      if (categoryLogo) {
        const form = new FormData();
        form.append("icon", categoryLogo);
        await api.post(`/categories/${data.id}/upload_icon/`, form);
      }
      return data;
    },
    onSuccess: () => {
      setName("");
      setCategoryLogo(null);
      setFormError("");
      invalidateTaxonomy(queryClient);
    },
    onError: () => setFormError("Could not create field. It may already exist."),
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
    onError: () => setFormError("Could not add subfield. Check the name and try again."),
  });

  const statItems = [
    { label: "Fields", value: stats.categories, icon: FolderTree, color: greAccountStatPending.color },
    {
      label: "Subfields",
      value: stats.subcategories,
      icon: Layers,
      color: greAccountStatPublished.color,
    },
    { label: "Active", value: stats.active, icon: Map, color: greAccountStatDraft.color },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Fields"
        description="Manage research fields and subfields used on the map, forum, and publications."
        action={
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200"
          >
            <ExternalLink className="h-4 w-4" />
            View on map
          </Link>
        }
      />

      <div className="flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex flex-1 items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className={`text-lg font-bold tabular-nums leading-none ${color}`}>{value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Plus className="h-4 w-4 text-brand-600" />
            New field
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Create a top-level research field, then add subfields in the taxonomy list below.
          </p>
        </div>
        <form
          className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)_auto] lg:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setFormError("");
            if (name.trim()) createCategoryMutation.mutate();
          }}
        >
          <Input
            label="Field name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Geology, Environmental Science…"
          />
          <PaperLogoUploadField
            label="Field logo"
            file={categoryLogo}
            onChange={setCategoryLogo}
            compact
          />
          <Button
            type="submit"
            className="w-full lg:mb-0.5"
            loading={createCategoryMutation.isPending}
          >
            Add field
          </Button>
        </form>
        {formError && (
          <p className="border-t border-slate-100 px-4 py-2.5 text-sm text-brand-800 sm:px-5">
            {formError}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BookOpen className="h-4 w-4 text-brand-600" />
              Taxonomy
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filtered.length} field{filtered.length === 1 ? "" : "s"}
              {query.trim() ? " matching search" : ""}
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fields or subfields…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2].map((i) => (
              <div key={i} className="gre-skeleton h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FolderTree}
              title={query ? "No matches" : "No fields yet"}
              description={
                query
                  ? "Try a different search term or clear the filter."
                  : "Create your first research field above, then add subfields inside it."
              }
            />
          </div>
        ) : (
          <div>
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
