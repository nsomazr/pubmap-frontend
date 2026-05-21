import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/api";
import type { Category } from "../../types";

export function CategoriesPage() {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data } = await api.get<Category[] | { results: Category[] }>("/categories/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/categories/", { name, status: "active" }),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
    },
  });

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Categories" description="Research categories and subcategories." />
      <form
        className="gre-card flex flex-wrap items-end gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createMutation.mutate();
        }}
      >
        <Input label="New category" value={name} onChange={(e) => setName(e.target.value)} className="min-w-[200px]" />
        <Button type="submit" loading={createMutation.isPending}>
          Add category
        </Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat.id} className="gre-card p-5">
            <h3 className="font-semibold text-ink">{cat.name}</h3>
            <p className="mt-1 text-xs text-slate-500">{cat.status}</p>
            {cat.sub_categories && cat.sub_categories.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {cat.sub_categories.map((s) => (
                  <li key={s.id}>· {s.name}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
