import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, LogIn, Search, UserCog, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { ActionsMenu } from "../../components/ui/ActionsMenu";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { RequiredFieldsLegend } from "../../components/ui/RequiredField";
import { Select } from "../../components/ui/Select";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";
import api, { parseApiError } from "../../lib/api";
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
  const confirm = useConfirm();
  const toast = useToast();
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
  const [assignMode, setAssignMode] = useState<"existing" | "create">("create");

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

  useEffect(() => {
    if (subcategoryId && filteredSubcategories.some((sub) => String(sub.id) === subcategoryId)) {
      return;
    }
    if (filteredSubcategories.length > 0) {
      setSubcategoryId(String(filteredSubcategories[0].id));
    } else {
      setSubcategoryId("");
    }
  }, [filteredSubcategories, subcategoryId]);

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
        params: { status: 1, q: userSearch.trim() },
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
      toast.success({ title: "Manager assigned." });
    },
    onError: (err) =>
      setError(parseApiError(err, "Could not assign that user as manager for this subfield.")),
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
      toast.success({ title: "Manager created and assigned." });
    },
    onError: (err) =>
      setError(parseApiError(err, "Could not create and assign the manager.")),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ subcategoryId: sid, userId }: { subcategoryId: number; userId: number }) =>
      api.post(`/subcategories/${sid}/managers/remove/`, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-subcategory-managers"] });
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      toast.success({ title: "Manager removed." });
    },
    onError: (err) => toast.error({ title: parseApiError(err, "Could not remove manager.") }),
  });

  const selectedSubcategory = useMemo(
    () => subcategories.find((subcategory) => String(subcategory.id) === subcategoryId) ?? null,
    [subcategories, subcategoryId]
  );

  const subfieldsWithManagers = useMemo(() => {
    const ids = new Set(managers.map((row) => row.sub_category_id));
    return ids.size;
  }, [managers]);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleRemove = async (row: ManagerAssignment) => {
    const ok = await confirm({
      title: "Remove manager?",
      description: `Remove ${row.full_name || row.email} from ${row.sub_category_name}? They will lose access to that review queue.`,
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    removeMutation.mutate({ subcategoryId: row.sub_category_id, userId: row.user_id });
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Managers"
        description="Assign reviewers to subfields. Managers sign in with the same GRE account flow as authors."
        action={
          <Link
            to="/dashboard/categories"
            className="inline-flex items-center gap-2 rounded-xl border border-gre-border bg-gre-panel px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200"
          >
            <ClipboardList className="h-4 w-4" />
            Fields
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Managers", value: managers.length, icon: Users },
          { label: "Subfields covered", value: subfieldsWithManagers, icon: UserCog },
          { label: "Available subfields", value: filteredSubcategories.length, icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="gre-stat-tile px-4 py-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="gre-callout-muted px-4 py-3 text-sm text-slate-600">
        <p className="flex items-start gap-2">
          <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>
            Managers sign in at{" "}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>{" "}
            with the assigned email and a one-time verification code, then open{" "}
            <strong className="font-semibold text-ink">Review queue</strong> for their subfield.
          </span>
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <section className="gre-panel">
          <div className="gre-panel__head px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Assign manager</h2>
            <p className="mt-1 text-xs text-slate-500">
              Pick a subfield, then create a new reviewer or assign someone who already has a GRE
              account.
            </p>
          </div>
          <div className="gre-panel__body p-5">
          <RequiredFieldsLegend className="mb-3" />

          <div className="space-y-4">
            <Select
              label="Subfield"
              value={subcategoryId}
              required
              onChange={(e) => setSubcategoryId(e.target.value)}
            >
              <option value="">Select subfield…</option>
              {filteredSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={String(subcategory.id)}>
                  {subcategory.category_name} · {subcategory.name}
                </option>
              ))}
            </Select>

            {selectedSubcategory ? (
              <p className="rounded-lg bg-brand-50/60 px-3 py-2 text-xs text-brand-900 ring-1 ring-brand-100">
                Review queue for{" "}
                <span className="font-semibold">{selectedSubcategory.category_name}</span>
                {" / "}
                <span className="font-semibold">{selectedSubcategory.name}</span>
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gre-panel-muted p-1 ring-1 ring-gre-border">
              <button
                type="button"
                onClick={() => setAssignMode("create")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  assignMode === "create"
                    ? "bg-gre-panel text-ink shadow-sm ring-1 ring-gre-border"
                    : "text-slate-600 hover:text-ink"
                }`}
              >
                New manager
              </button>
              <button
                type="button"
                onClick={() => setAssignMode("existing")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  assignMode === "existing"
                    ? "bg-gre-panel text-ink shadow-sm ring-1 ring-gre-border"
                    : "text-slate-600 hover:text-ink"
                }`}
              >
                Existing user
              </button>
            </div>

            {assignMode === "create" ? (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  if (
                    subcategoryId &&
                    createForm.firstname &&
                    createForm.lastname &&
                    createForm.email
                  ) {
                    createManagerMutation.mutate();
                  }
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="text"
                    label="First name"
                    value={createForm.firstname}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, firstname: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="text"
                    label="Last name"
                    value={createForm.lastname}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, lastname: e.target.value }))
                    }
                    required
                  />
                </div>
                <Input
                  type="email"
                  label="Email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="researcher@university.ac.tz"
                  required
                />
                <Input
                  type="text"
                  label="Affiliation"
                  value={createForm.affiliation}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, affiliation: e.target.value }))
                  }
                  placeholder="Institution or affiliation"
                />
                <Button
                  type="submit"
                  className="w-full"
                  loading={createManagerMutation.isPending}
                  disabled={
                    !subcategoryId ||
                    !createForm.firstname.trim() ||
                    !createForm.lastname.trim() ||
                    !createForm.email.trim()
                  }
                >
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Create and assign
                </Button>
              </form>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  if (subcategoryId && selectedUser?.id) assignExistingMutation.mutate();
                }}
              >
                <Input
                  type="search"
                  label="Search user"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Name, email, or affiliation"
                  required
                />

                <div className="max-h-52 overflow-y-auto rounded-xl border border-gre-border bg-gre-panel-muted">
                  {selectedUser ? (
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-gre-panel"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          {selectedUser.full_name ||
                            `${selectedUser.firstname} ${selectedUser.lastname}`}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {selectedUser.email}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                        Selected
                      </span>
                    </button>
                  ) : userSearch.trim().length < 2 ? (
                    <p className="px-3 py-4 text-xs text-slate-500">
                      Type at least 2 characters to search active users.
                    </p>
                  ) : isSearchingUsers ? (
                    <p className="px-3 py-4 text-xs text-slate-500">Searching…</p>
                  ) : userResults.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-slate-500">No users matched your search.</p>
                  ) : (
                    <ul className="divide-y divide-gre-border">
                      {userResults.map((candidate) => (
                        <li key={candidate.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(candidate)}
                            className="block w-full px-3 py-3 text-left transition hover:bg-gre-panel"
                          >
                            <span className="block text-sm font-semibold text-ink">
                              {candidate.full_name ||
                                `${candidate.firstname} ${candidate.lastname}`}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {candidate.email}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={assignExistingMutation.isPending}
                  disabled={!subcategoryId || !selectedUser}
                >
                  Assign to subfield
                </Button>
              </form>
            )}

            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
          </div>
        </section>

        <section className="gre-panel min-w-0">
          <div className="gre-panel__head flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Current assignments</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {filtered.length} manager{filtered.length === 1 ? "" : "s"}
                {categoryFilter ? " in this field" : ""}
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, subfield…"
                className="w-full rounded-lg border border-gre-border py-2 pl-9 pr-3 text-sm gre-field focus:border-brand-500 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <div className="gre-panel__body">
          {isLoading ? (
            <div className="gre-skeleton m-5 h-48 rounded-xl" />
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UserCog}
                title="No managers yet"
                description="Assign a manager using the form on the left."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gre-panel-muted text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Manager</th>
                    <th className="px-5 py-2.5 font-semibold">Subfield</th>
                    <th className="w-12 px-2 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gre-border">
                  {filtered.map((row) => (
                    <tr key={`${row.sub_category_id}-${row.user_id}`} className="hover:bg-gre-panel-muted/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{row.full_name || row.email}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{row.sub_category_name}</p>
                        <p className="text-xs text-slate-500">{row.category_name}</p>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <ActionsMenu
                          ariaLabel={`Actions for ${row.full_name || row.email}`}
                          items={[
                            {
                              id: "remove",
                              label: "Remove assignment",
                              tone: "danger",
                              onSelect: () => handleRemove(row),
                              disabled: removeMutation.isPending,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </section>
      </div>
    </div>
  );
}
