import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GreAdAnalyticsPanel } from "../../components/ads/GreAdAnalyticsPanel";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import api from "../../lib/api";
import { AD_PLACEMENTS, type AdPlacement } from "../../lib/ads";

interface Ad {
  id: number;
  title: string;
  image: string;
  link: string;
  location: string;
  placement: AdPlacement;
  status: string;
  gre_meta?: {
    sponsor_label?: string;
    description?: string;
    sort_order?: number;
    publication_id?: number | null;
  } | null;
}

const EMPTY_FORM = {
  title: "",
  image: "",
  link: "",
  location: "sidebar" as AdPlacement,
  status: "active",
  sponsor_label: "Sponsored",
  description: "",
  sort_order: "0",
  publication_id: "",
};

export function AdsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: ads = [] } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data } = await api.get<Ad[] | { results: Ad[] }>("/ads/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/ads/", {
        title: form.title,
        image: form.image,
        link: form.link,
        location: form.location,
        status: form.status,
        sponsor_label: form.sponsor_label,
        description: form.description,
        sort_order: Number(form.sort_order) || 0,
        publication_id: form.publication_id ? Number(form.publication_id) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads", "analytics"] });
      setForm(EMPTY_FORM);
    },
  });

  const selectedPlacement = AD_PLACEMENTS.find((p) => p.value === form.location);

  return (
    <div className="animate-fade-up space-y-10">
      <PageHeader
        title="Advertisements"
      />

      <GreAdAnalyticsPanel days={30} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Placements</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ads live in side rails and banner zones so reading flow is never interrupted.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AD_PLACEMENTS.map((placement) => (
            <article key={placement.value} className="gre-card p-4">
              <p className="font-semibold text-ink">{placement.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{placement.hint}</p>
              <p className="mt-3 text-[11px] font-mono text-brand-700">{placement.value}</p>
            </article>
          ))}
        </div>
      </section>

      <form
        className="gre-card grid gap-4 p-6 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">Create advertisement</h2>
          {selectedPlacement && (
            <p className="mt-1 text-sm text-slate-500">{selectedPlacement.hint}</p>
          )}
        </div>
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <Input
          label="Image URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />
        <Input
          label="Link URL"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="/events or https://…"
        />
        <Select
          label="Placement"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value as AdPlacement })}
        >
          {AD_PLACEMENTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
        <Input
          label="Sponsor label"
          value={form.sponsor_label}
          onChange={(e) => setForm({ ...form, sponsor_label: e.target.value })}
          placeholder="Sponsored"
        />
        <Input
          label="Sort order"
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
        />
        <Input
          label="Publication ID (optional, for sponsored publications)"
          value={form.publication_id}
          onChange={(e) => setForm({ ...form, publication_id: e.target.value })}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <div className="lg:col-span-2">
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="lg:col-span-2">
          <Button type="submit" loading={createMutation.isPending}>
            Add advertisement
          </Button>
        </div>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Active inventory</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <div key={ad.id} className="gre-card overflow-hidden">
              {ad.image && <img src={ad.image} alt="" className="h-32 w-full object-cover" />}
              <div className="space-y-2 p-4">
                <p className="font-medium text-ink">{ad.title}</p>
                <p className="text-xs text-slate-500">
                  {(ad.placement || ad.location).replace(/_/g, " ")} · {ad.status}
                </p>
                {ad.gre_meta?.description && (
                  <p className="line-clamp-2 text-xs text-slate-500">{ad.gre_meta.description}</p>
                )}
                <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  {ad.gre_meta?.sponsor_label || "Sponsored"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
