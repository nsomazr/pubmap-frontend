import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldOff, UserCheck, UserX } from "lucide-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import api from "../../lib/api";
import type { User } from "../../types";

export function AuthorsPage() {
  const { user } = useAuth();
  if (user?.role_id !== 1) return <Navigate to="/dashboard" replace />;

  const [params, setParams] = useSearchParams({ status: "1", role: "2" });
  const status = params.get("status") ?? "1";
  const role = params.get("role") ?? "2";
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-admin", status, role],
    queryFn: async () => {
      const { data } = await api.get<User[] | { results: User[] }>("/users/", {
        params: { role, status },
      });
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "deactivate" | "activate" }) =>
      api.post(`/users/${id}/${action}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users-admin"] }),
  });

  const roleChange = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "make_admin" | "remove_admin" }) =>
      api.post(`/users/${id}/${action}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users-admin"] }),
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="User management"
        description="Authors, admins, and account status. Changes are stored in the database immediately."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/60">
          {[
            { value: "2", label: "Authors" },
            { value: "1", label: "Admins" },
          ].map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setParams({ role: r.value, status })}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                role === r.value ? "bg-white text-brand-600 shadow-sm" : "text-slate-600"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/60">
          {[
            { value: "1", label: "Active" },
            { value: "0", label: "Deactivated" },
          ].map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setParams({ role, status: s.value })}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                status === s.value ? "bg-white text-brand-600 shadow-sm" : "text-slate-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : users.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-500">
          No users in this list.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Affiliation</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    {a.firstname} {a.lastname}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.email}</td>
                  <td className="px-4 py-3 text-slate-500">{a.affiliation || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {a.role_id === 1 ? "Admin" : "Author"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {a.status === 1 ? (
                        <Button
                          variant="ghost"
                          onClick={() => toggle.mutate({ id: a.id, action: "deactivate" })}
                        >
                          <UserX className="h-4 w-4" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => toggle.mutate({ id: a.id, action: "activate" })}
                        >
                          <UserCheck className="h-4 w-4" />
                          Activate
                        </Button>
                      )}
                      {a.role_id === 2 ? (
                        <Button
                          variant="ghost"
                          onClick={() => roleChange.mutate({ id: a.id, action: "make_admin" })}
                        >
                          <Shield className="h-4 w-4" />
                          Make admin
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => roleChange.mutate({ id: a.id, action: "remove_admin" })}
                        >
                          <ShieldOff className="h-4 w-4" />
                          Remove admin
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
