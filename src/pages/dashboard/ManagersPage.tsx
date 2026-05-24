import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Search, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { isPlatformAdmin } from "../../lib/userAccess";
import type { Category, CategoryManagerRow } from "../../types";

type ManagerAssignment = CategoryManagerRow & {
  category_id: number;
  category_name: string;
};

export function ManagersPage() {
  const { user } = useAuth();
  const isAdmin = isPlatformAdmin(user);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || "";
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState(categoryFilter);
  const [error, setError] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data } = await api.get<Category[] | { results: Category[] }>("/categories/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ["all-category-managers"],
    queryFn: async () => {
      const { data } = await api.get<{ managers: ManagerAssignment[] }>("/categories/all-managers/");
      return data.managers ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return managers.filter((row) => {
      if (categoryId && String(row.category_id) !== categoryId) return false;
      if (!q) return true;
      return (
        row.full_name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.category_name.toLowerCase().includes(q)
      );
    });
  }, [managers, query, categoryId]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!categoryId) throw new Error("missing category");
      await api.post(`/categories/${categoryId}/managers/assign/`, { email: email.trim() });
    },
    onSuccess: () => {
      setEmail("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["all-category-managers"] });
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["category-managers"] });
    },
    onError: () => setError("Could not assign manager. Check the email and category."),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ categoryId: cid, userId }: { categoryId: number; userId: number }) =>
      api.post(`/categories/${cid}/managers/remove/`, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-category-managers"] });
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["category-managers"] });
    },
  });

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Managers"
        description="Assign and remove category managers who review submissions for specific research fields."
        action={
          <Link
            to="/dashboard/categories"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200"
          >
            <ClipboardList className="h-4 w-4" />
            Categories
          </Link>
        }
      />

      <section className="gre-card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Plus className="h-5 w-5 text-brand-600" />
          Assign manager
        </h2>
        <form
          className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (email.trim() && categoryId) assignMutation.mutate();
          }}
        >
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select category…</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </Select>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Manager email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="researcher@university.ac.tz"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <div className="flex items-end">
            <Button
              type="submit"
              loading={assignMutation.isPending}
              disabled={!email.trim() || !categoryId}
            >
              Assign
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-slate-500">
          Managers can access the review queue for their assigned categories only. Platform admins
          already have full review access.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <UserCog className="h-5 w-5 text-brand-600" />
            Category managers
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, category…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="gre-skeleton h-48 rounded-2xl" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No managers found"
            description="Assign a manager above, or adjust your search filter."
          />
        ) : (
          <div className="gre-card overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{row.full_name || row.email}</p>
                    <p className="text-sm text-slate-500">{row.email}</p>
                    <p className="mt-1 text-xs font-medium text-brand-700">{row.category_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      removeMutation.mutate({ categoryId: row.category_id, userId: row.user_id })
                    }
                    className="text-sm font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
