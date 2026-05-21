import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import api from "../../lib/api";

interface Ad {
  id: number;
  title: string;
  image: string;
  link: string;
  location: string;
  status: string;
}

export function AdsPage() {
  const [form, setForm] = useState({ title: "", image: "", link: "", location: "home", status: "active" });
  const queryClient = useQueryClient();

  const { data: ads = [] } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data } = await api.get<Ad[] | { results: Ad[] }>("/ads/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/ads/", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      setForm({ title: "", image: "", link: "", location: "home", status: "active" });
    },
  });

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader title="Advertisements" description="Promotional banners across the site." />
      <form
        className="gre-card grid gap-4 p-6 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <Input label="Link URL" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <Select label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
          <option value="home">Home</option>
          <option value="about">About</option>
          <option value="contact">Contact</option>
        </Select>
        <Button type="submit" loading={createMutation.isPending}>
          Add advertisement
        </Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        {ads.map((ad) => (
          <div key={ad.id} className="gre-card overflow-hidden">
            {ad.image && <img src={ad.image} alt="" className="h-32 w-full object-cover" />}
            <div className="p-4">
              <p className="font-medium">{ad.title}</p>
              <p className="text-xs text-slate-500">{ad.location} · {ad.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
