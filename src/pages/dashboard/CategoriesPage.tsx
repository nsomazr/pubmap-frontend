import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ExternalLink, FolderTree, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PaperLogoUploadField } from "../../components/admin/PaperLogoUploadField";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { SubcategoryVisual } from "../../components/taxonomy/SubcategoryVisual";
import { ActionsMenu } from "../../components/ui/ActionsMenu";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/ToastProvider";
import api, { parseApiError } from "../../lib/api";
import { resolveCategoryVisual } from "../../lib/taxonomyVisuals";
import { isPlatformAdmin } from "../../lib/userAccess";
import type { Category, SubCategory } from "../../types";

function invalidateTaxonomy(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
  queryClient.invalidateQueries({ queryKey: ["categories"] });
  queryClient.invalidateQueries({ queryKey: ["subcategories"] });
}

function filterSubcategories(subs: SubCategory[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return subs;
  return subs.filter((sub) => sub.name.toLowerCase().includes(q));
}

function FieldDetailPanel({
  category,
  searchQuery,
  subDraft,
  subIconFile,
  addOpen,
  onToggleAdd,
  onSubDraftChange,
  onSubIconChange,
  onAddSubcategory,
  addingSub,
  onManageFieldManagers,
  onToggleFieldStatus,
  onDeleteField,
  onToggleSubfieldStatus,
  onDeleteSubfield,
  fieldActionPending,
  subfieldActionId,
}: {
  category: Category;
  searchQuery: string;
  subDraft: string;
  subIconFile: File | null;
  addOpen: boolean;
  onToggleAdd: () => void;
  onSubDraftChange: (value: string) => void;
  onSubIconChange: (file: File | null) => void;
  onAddSubcategory: () => void;
  addingSub: boolean;
  onManageFieldManagers: () => void;
  onToggleFieldStatus: () => void;
  onDeleteField: () => void;
  onToggleSubfieldStatus: (sub: SubCategory) => void;
  onDeleteSubfield: (sub: SubCategory) => void;
  fieldActionPending?: boolean;
  subfieldActionId?: number | null;
}) {
  const visual = category.visual ?? resolveCategoryVisual(category.name);
  const managerCount = category.manager_count ?? 0;
  const isActive = category.status === "active";
  const allSubs = category.sub_categories ?? [];
  const subs = filterSubcategories(allSubs, searchQuery);
  const searchActive = Boolean(searchQuery.trim());

  return (
    <div className="flex min-h-[22rem] flex-col">
      <div className="gre-panel__head border-b border-gre-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <SubcategoryVisual visual={visual} size="md" className="!h-11 !w-11 shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{category.name}</h2>
                {isActive ? (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-100">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                    Inactive
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {allSubs.length} subfield{allSubs.length === 1 ? "" : "s"}
                {" · "}
                {managerCount} manager{managerCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <ActionsMenu
            ariaLabel={`Actions for ${category.name}`}
            buttonClassName={fieldActionPending ? "opacity-50" : ""}
            items={[
              {
                id: "managers",
                label: "Manage managers",
                onSelect: onManageFieldManagers,
              },
              {
                id: "status",
                label: isActive ? "Deactivate field" : "Activate field",
                onSelect: onToggleFieldStatus,
                disabled: fieldActionPending,
              },
              {
                id: "delete",
                label: "Delete field",
                tone: "danger",
                onSelect: onDeleteField,
                disabled: fieldActionPending,
              },
            ]}
          />
        </div>
      </div>

      <div className="gre-panel__body flex flex-1 flex-col px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Subfields
            {searchActive && subs.length !== allSubs.length ? (
              <span className="ml-2 normal-case font-medium text-slate-500">
                ({subs.length} match{subs.length === 1 ? "" : "es"})
              </span>
            ) : null}
          </h3>
          <button
            type="button"
            onClick={onToggleAdd}
            className="gre-interactive inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            {addOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {addOpen ? "Cancel" : "Add subfield"}
          </button>
        </div>

        {addOpen ? (
          <form
            className="mb-4 space-y-3 rounded-xl border border-brand-100 bg-brand-50/30 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (subDraft.trim()) onAddSubcategory();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,12rem)_auto] lg:items-end">
              <Input
                label="Subfield name"
                value={subDraft}
                onChange={(e) => onSubDraftChange(e.target.value)}
                placeholder="e.g. Geochemistry"
              />
              <PaperLogoUploadField
                label="Logo (optional)"
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
                Add subfield
              </Button>
            </div>
          </form>
        ) : null}

        {allSubs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gre-border bg-gre-panel-muted px-6 py-10 text-center">
            <div>
              <p className="text-sm font-medium text-slate-600">No subfields yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Add the first subfield for {category.name}.
              </p>
              {!addOpen ? (
                <button
                  type="button"
                  onClick={onToggleAdd}
                  className="gre-interactive mt-4 inline-flex items-center gap-1 rounded-lg border border-gre-border bg-gre-panel px-3 py-2 text-xs font-semibold text-brand-700 hover:border-brand-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add subfield
                </button>
              ) : null}
            </div>
          </div>
        ) : subs.length === 0 ? (
          <p className="rounded-xl bg-gre-panel-muted px-4 py-8 text-center text-sm text-slate-500">
            No subfields match your search in this field.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gre-border">
            <table className="min-w-full text-sm">
              <thead className="bg-gre-panel-muted text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Name</th>
                  <th className="hidden w-24 px-4 py-2.5 font-semibold sm:table-cell">Status</th>
                  <th className="w-12 px-2 py-2.5 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gre-border">
                {subs.map((sub) => {
                  const accent =
                    sub.visual?.accent_color ??
                    resolveCategoryVisual(sub.name).accent_color;
                  const subActive = sub.status === "active";
                  const subPending = subfieldActionId === sub.id;
                  return (
                    <tr key={sub.id} className="bg-gre-panel hover:bg-gre-panel-muted/60">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: accent }}
                            aria-hidden
                          />
                          <span className="font-medium text-ink">{sub.name}</span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            subActive
                              ? "bg-teal-50 text-teal-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {subActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <ActionsMenu
                          ariaLabel={`Actions for ${sub.name}`}
                          align="right"
                          buttonClassName={subPending ? "opacity-50" : ""}
                          items={[
                            {
                              id: "status",
                              label: subActive ? "Deactivate subfield" : "Activate subfield",
                              onSelect: () => onToggleSubfieldStatus(sub),
                              disabled: subPending,
                            },
                            {
                              id: "delete",
                              label: "Delete subfield",
                              tone: "danger",
                              onSelect: () => onDeleteSubfield(sub),
                              disabled: subPending,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function CategoriesPage() {
  const { user } = useAuth();
  if (!isPlatformAdmin(user)) return <Navigate to="/dashboard" replace />;

  const [name, setName] = useState("");
  const [categoryLogo, setCategoryLogo] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subDrafts, setSubDrafts] = useState<Record<number, string>>({});
  const [subIconDrafts, setSubIconDrafts] = useState<Record<number, File | null>>({});
  const [expandAddFor, setExpandAddFor] = useState<number | null>(null);
  const [showNewField, setShowNewField] = useState(false);
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();

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

  const selectedCategory = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((c) => c.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

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
    onSuccess: (data) => {
      setName("");
      setCategoryLogo(null);
      setFormError("");
      setShowNewField(false);
      setSelectedId(data.id);
      invalidateTaxonomy(queryClient);
    },
    onError: () => setFormError("Could not create field."),
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
      setExpandAddFor(null);
      setFormError("");
      invalidateTaxonomy(queryClient);
    },
    onError: () => setFormError("Could not add subfield."),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/categories/${id}/`, { status });
    },
    onSuccess: () => {
      setFormError("");
      invalidateTaxonomy(queryClient);
      toast.success({ title: "Field updated." });
    },
    onError: (err) => setFormError(parseApiError(err, "Could not update field.")),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}/`);
    },
    onSuccess: (_data, id) => {
      setFormError("");
      if (selectedId === id) setSelectedId(null);
      invalidateTaxonomy(queryClient);
      toast.success({ title: "Field deleted." });
    },
    onError: (err) => setFormError(parseApiError(err, "Could not delete field.")),
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/subcategories/${id}/`, { status });
    },
    onSuccess: () => {
      setFormError("");
      invalidateTaxonomy(queryClient);
      toast.success({ title: "Subfield updated." });
    },
    onError: (err) => setFormError(parseApiError(err, "Could not update subfield.")),
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/subcategories/${id}/`);
    },
    onSuccess: () => {
      setFormError("");
      invalidateTaxonomy(queryClient);
      toast.success({ title: "Subfield deleted." });
    },
    onError: (err) => setFormError(parseApiError(err, "Could not delete subfield.")),
  });

  const fieldActionPending =
    updateCategoryMutation.isPending || deleteCategoryMutation.isPending;
  const subfieldActionId =
    updateSubcategoryMutation.isPending || deleteSubcategoryMutation.isPending
      ? updateSubcategoryMutation.variables?.id ??
        deleteSubcategoryMutation.variables ??
        null
      : null;

  const handleToggleFieldStatus = async (category: Category) => {
    const nextStatus = category.status === "active" ? "inactive" : "active";
    const verb = nextStatus === "active" ? "activate" : "deactivate";
    const ok = await confirm({
      title: nextStatus === "active" ? "Activate field?" : "Deactivate field?",
      description:
        nextStatus === "active"
          ? `${category.name} will appear in pickers and on the public map again.`
          : `${category.name} will be hidden from pickers and the public map. Existing publications are not removed.`,
      confirmLabel: nextStatus === "active" ? "Activate" : "Deactivate",
    });
    if (!ok) return;
    updateCategoryMutation.mutate({ id: category.id, status: nextStatus });
  };

  const handleDeleteField = async (category: Category) => {
    const ok = await confirm({
      title: "Delete field?",
      description: `Permanently delete ${category.name} and its subfields? This only works when no publications or forum topics use them.`,
      confirmLabel: "Delete field",
      tone: "danger",
    });
    if (!ok) return;
    deleteCategoryMutation.mutate(category.id);
  };

  const handleToggleSubfieldStatus = async (sub: SubCategory) => {
    const nextStatus = sub.status === "active" ? "inactive" : "active";
    const ok = await confirm({
      title: nextStatus === "active" ? "Activate subfield?" : "Deactivate subfield?",
      description:
        nextStatus === "active"
          ? `${sub.name} will appear in pickers again.`
          : `${sub.name} will be hidden from pickers. Existing publications are not removed.`,
      confirmLabel: nextStatus === "active" ? "Activate" : "Deactivate",
    });
    if (!ok) return;
    updateSubcategoryMutation.mutate({ id: sub.id, status: nextStatus });
  };

  const handleDeleteSubfield = async (sub: SubCategory) => {
    const ok = await confirm({
      title: "Delete subfield?",
      description: `Permanently delete ${sub.name}? This only works when no publications or forum topics use it.`,
      confirmLabel: "Delete subfield",
      tone: "danger",
    });
    if (!ok) return;
    deleteSubcategoryMutation.mutate(sub.id);
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Fields"
        description="Organize research areas and their subfields. Select a field to view or add subfields."
        action={
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="gre-interactive inline-flex items-center gap-2 rounded-lg border border-gre-border px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-200 hover:text-brand-700"
          >
            <ExternalLink className="h-4 w-4" />
            View map
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Fields", value: stats.categories },
          { label: "Subfields", value: stats.subcategories },
          { label: "Active fields", value: stats.active },
        ].map((item) => (
          <div
            key={item.label}
            className="gre-stat-tile px-4 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="gre-panel overflow-hidden">
        <div className="gre-panel__head flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fields or subfields…"
              className="w-full rounded-lg border border-gre-border py-2 pl-9 pr-3 text-sm gre-field focus:border-brand-500 focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowNewField((open) => !open)}
            className="gre-interactive inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {showNewField ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            New field
          </button>
        </div>

        {showNewField ? (
          <form
            className="border-b border-gre-border bg-gre-panel-muted px-4 py-4 sm:px-5"
            onSubmit={(e) => {
              e.preventDefault();
              setFormError("");
              if (name.trim()) createCategoryMutation.mutate();
            }}
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,14rem)_auto] lg:items-end">
              <Input
                label="Field name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Geology"
              />
              <PaperLogoUploadField
                label="Logo (optional)"
                file={categoryLogo}
                onChange={setCategoryLogo}
                compact
              />
              <Button
                type="submit"
                className="w-full lg:mb-0.5"
                loading={createCategoryMutation.isPending}
              >
                Create field
              </Button>
            </div>
          </form>
        ) : null}

        {formError ? (
          <p className="border-b border-gre-border px-4 py-2 text-sm text-brand-800 sm:px-5">
            {formError}
          </p>
        ) : null}

        <div className="gre-panel__body">
        {isLoading ? (
          <div className="grid lg:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)]">
            <div className="space-y-2 border-b border-gre-border p-4 lg:border-b-0 lg:border-r">
              {[1, 2, 3].map((i) => (
                <div key={i} className="gre-skeleton h-14 rounded-lg" />
              ))}
            </div>
            <div className="gre-skeleton m-4 h-64 rounded-xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FolderTree}
              title={query ? "No matches" : "No fields yet"}
              description={query ? "Try another search." : "Create a field to get started."}
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)]">
            <nav
              className="border-b border-gre-border lg:border-b-0 lg:border-r"
              aria-label="Fields"
            >
              <ul className="divide-y divide-gre-border lg:divide-y-0 lg:p-2">
                {filtered.map((cat) => {
                  const visual = cat.visual ?? resolveCategoryVisual(cat.name);
                  const subCount = cat.sub_categories?.length ?? 0;
                  const selected = cat.id === selectedId;
                  return (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(cat.id);
                          setExpandAddFor(null);
                        }}
                        className={`gre-interactive flex w-full items-center gap-3 px-4 py-3 text-left transition lg:rounded-xl lg:px-3 ${
                          selected
                            ? "bg-brand-50 lg:ring-1 lg:ring-brand-200"
                            : "hover:bg-gre-panel-muted"
                        }`}
                      >
                        <SubcategoryVisual
                          visual={visual}
                          size="sm"
                          className="!h-9 !w-9 shrink-0"
                          shadow={false}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-semibold ${
                              selected ? "text-brand-900" : "text-ink"
                            }`}
                          >
                            {cat.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {subCount} subfield{subCount === 1 ? "" : "s"}
                            {cat.status !== "active" ? " · Inactive" : ""}
                          </span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 ${
                            selected ? "text-brand-600" : "text-slate-300"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="min-w-0">
              {selectedCategory ? (
                <FieldDetailPanel
                  category={selectedCategory}
                  searchQuery={query}
                  subDraft={subDrafts[selectedCategory.id] ?? ""}
                  subIconFile={subIconDrafts[selectedCategory.id] ?? null}
                  addOpen={expandAddFor === selectedCategory.id}
                  onToggleAdd={() =>
                    setExpandAddFor((current) =>
                      current === selectedCategory.id ? null : selectedCategory.id
                    )
                  }
                  onSubDraftChange={(value) =>
                    setSubDrafts((prev) => ({ ...prev, [selectedCategory.id]: value }))
                  }
                  onSubIconChange={(file) =>
                    setSubIconDrafts((prev) => ({ ...prev, [selectedCategory.id]: file }))
                  }
                  onAddSubcategory={() => {
                    const subName = (subDrafts[selectedCategory.id] ?? "").trim();
                    if (!subName) return;
                    createSubMutation.mutate({
                      categoryId: selectedCategory.id,
                      subName,
                      iconFile: subIconDrafts[selectedCategory.id],
                    });
                  }}
                  addingSub={
                    createSubMutation.isPending &&
                    createSubMutation.variables?.categoryId === selectedCategory.id
                  }
                  onManageFieldManagers={() =>
                    navigate(`/dashboard/managers?category=${selectedCategory.id}`)
                  }
                  onToggleFieldStatus={() => handleToggleFieldStatus(selectedCategory)}
                  onDeleteField={() => handleDeleteField(selectedCategory)}
                  onToggleSubfieldStatus={handleToggleSubfieldStatus}
                  onDeleteSubfield={handleDeleteSubfield}
                  fieldActionPending={fieldActionPending}
                  subfieldActionId={subfieldActionId}
                />
              ) : (
                <div className="flex h-full min-h-[16rem] items-center justify-center p-8 text-sm text-slate-500">
                  Select a field to manage its subfields.
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
