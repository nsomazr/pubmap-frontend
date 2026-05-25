import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Search, UserCog, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { isPlatformAdmin } from "../../lib/userAccess";
import type { Category, CategoryManagerRow, User } from "../../types";

type ManagerAssignment = CategoryManagerRow & {
  sub_category_id: number;
  sub_category_name: string;
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
  const [subcategoryId, setSubcategoryId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    affiliation: "",
  });
  const [error, setError] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data } = await api.get<Category[] | { results: Category[] }>("/categories/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const subcategories = useMemo(
    () =>
      categories.flatMap((category) =>
        (category.sub_categories ?? []).map((subcategory) => ({
          ...subcategory,
          category_name: category.name,
        }))
      ),
    [categories]
  );

  const filteredSubcategories = useMemo(() => {
    if (!categoryFilter) return subcategories;
    return subcategories.filter((subcategory) => String(subcategory.category_id) === categoryFilter);
  }, [categoryFilter, subcategories]);

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ["all-subcategory-managers"],
    queryFn: async () => {
      const { data } = await api.get<{ managers: ManagerAssignment[] }>("/subcategories/all-managers/");
      return data.managers ?? [];
    },
  });

  const { data: userResults = [], isFetching: isSearchingUsers } = useQuery({
    queryKey: ["manager-user-search", userSearch],
    queryFn: async () => {
      const { data } = await api.get<User[] | { results: User[] }>("/users/", {
        params: { role: 2, status: 1, q: userSearch.trim() },
      });
      return Array.isArray(data) ? data : (data.results ?? []);
    },
    enabled: userSearch.trim().length >= 2,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return managers.filter((row) => {
      if (categoryFilter && String(row.category_id) !== categoryFilter) return false;
      if (!q) return true;
      return (
        row.full_name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.category_name.toLowerCase().includes(q) ||
        row.sub_category_name.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, managers, query]);

  const assignExistingMutation = useMutation({
    mutationFn: async () => {
      if (!subcategoryId || !selectedUser?.id) throw new Error("missing manager selection");
      await api.post(`/subcategories/${subcategoryId}/managers/assign/`, { user_id: selectedUser.id });
    },
    onSuccess: () => {
      setError("");
      setSelectedUser(null);
      setUserSearch("");
      queryClient.invalidateQueries({ queryKey: ["all-subcategory-managers"] });
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["manager-user-search"] });
    },
    onError: () => setError("Could not assign that user as manager for this subcategory."),
  });

  const createManagerMutation = useMutation({
    mutationFn: async () => {
      if (!subcategoryId) throw new Error("missing subcategory");
      await api.post(`/subcategories/${subcategoryId}/managers/create-user/`, {
        firstname: createForm.firstname.trim(),
        lastname: createForm.lastname.trim(),
        email: createForm.email.trim(),
        affiliation: createForm.affiliation.trim(),
      });
    },
    onSuccess: () => {
      setError("");
      setCreateForm({ firstname: "", lastname: "", email: "", affiliation: "" });
      queryClient.invalidateQueries({ queryKey: ["all-subcategory-managers"] });
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["users-admin"] });
    },
    onError: () => setError("Could not create and assign the manager. Check the details and try again."),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ subcategoryId: sid, userId }: { subcategoryId: number; userId: number }) =>
      api.post(`/subcategories/${sid}/managers/remove/`, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-subcategory-managers"] });
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
    },
  });

  const selectedSubcategory = useMemo(
    () => subcategories.find((subcategory) => String(subcategory.id) === subcategoryId) ?? null,
    [subcategories, subcategoryId]
  );

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Managers"
        description="Assign and remove subcategory managers who review submissions for specific research fields."
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

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Select
            label="Subcategory"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
          >
            <option value="">Select subcategory…</option>
            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={String(subcategory.id)}>
                {subcategory.category_name} / {subcategory.name}
              </option>
            ))}
          </Select>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {selectedSubcategory ? (
              <>
                <p className="font-semibold text-ink">{selectedSubcategory.name}</p>
                <p className="mt-1">{selectedSubcategory.category_name}</p>
              </>
            ) : (
              <p>Select the subcategory this manager should review.</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <form
            className="rounded-2xl border border-slate-200 bg-white p-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (subcategoryId && selectedUser?.id) assignExistingMutation.mutate();
            }}
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ink">Assign an existing user</h3>
              <p className="mt-1 text-sm text-slate-500">
                Search active researchers, then assign the selected user to this subcategory.
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Search user</span>
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Name, email, or affiliation"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-2">
              {selectedUser ? (
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl bg-white px-3 py-3 text-left ring-1 ring-brand-200"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">
                      {selectedUser.full_name || `${selectedUser.firstname} ${selectedUser.lastname}`}
                    </span>
                    <span className="block truncate text-sm text-slate-500">{selectedUser.email}</span>
                    <span className="block truncate text-xs text-brand-700">
                      {selectedUser.affiliation || "No affiliation"}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Selected</span>
                </button>
              ) : userSearch.trim().length < 2 ? (
                <p className="px-2 py-3 text-sm text-slate-500">Type at least 2 characters to search.</p>
              ) : isSearchingUsers ? (
                <p className="px-2 py-3 text-sm text-slate-500">Searching users…</p>
              ) : userResults.length === 0 ? (
                <p className="px-2 py-3 text-sm text-slate-500">No active users matched your search.</p>
              ) : (
                <div className="space-y-2">
                  {userResults.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedUser(candidate)}
                      className="block w-full rounded-xl bg-white px-3 py-3 text-left transition hover:ring-1 hover:ring-brand-200"
                    >
                      <span className="block font-semibold text-ink">
                        {candidate.full_name || `${candidate.firstname} ${candidate.lastname}`}
                      </span>
                      <span className="block truncate text-sm text-slate-500">{candidate.email}</span>
                      <span className="block truncate text-xs text-brand-700">
                        {candidate.affiliation || "No affiliation"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                loading={assignExistingMutation.isPending}
                disabled={!subcategoryId || !selectedUser}
              >
                Assign existing user
              </Button>
            </div>
          </form>

          <form
            className="rounded-2xl border border-slate-200 bg-white p-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (subcategoryId && createForm.firstname && createForm.lastname && createForm.email) {
                createManagerMutation.mutate();
              }
            }}
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">Create a new manager user</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add the user here and assign them to the selected subcategory in one step.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">First name</span>
                <input
                  type="text"
                  value={createForm.firstname}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, firstname: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Last name</span>
                <input
                  type="text"
                  value={createForm.lastname}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, lastname: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="researcher@university.ac.tz"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Affiliation</span>
                <input
                  type="text"
                  value={createForm.affiliation}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, affiliation: e.target.value }))
                  }
                  placeholder="Institution or affiliation"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                loading={createManagerMutation.isPending}
                disabled={
                  !subcategoryId ||
                  !createForm.firstname.trim() ||
                  !createForm.lastname.trim() ||
                  !createForm.email.trim()
                }
              >
                Create and assign
              </Button>
            </div>
          </form>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-slate-500">
          Managers can access the review queue only for their assigned subcategories. Platform admins
          already have full review access.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <UserCog className="h-5 w-5 text-brand-600" />
            Subcategory managers
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, field…"
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
                  key={`${row.sub_category_id}-${row.user_id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{row.full_name || row.email}</p>
                    <p className="text-sm text-slate-500">{row.email}</p>
                    <p className="mt-1 text-xs font-medium text-brand-700">
                      {row.category_name} / {row.sub_category_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      removeMutation.mutate({
                        subcategoryId: row.sub_category_id,
                        userId: row.user_id,
                      })
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
