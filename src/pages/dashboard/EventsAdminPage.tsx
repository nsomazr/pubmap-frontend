import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isPlatformAdmin } from "../../lib/userAccess";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { DefaultBanner } from "../../components/ui/DefaultBanner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Pagination } from "../../components/ui/Pagination";
import { usePageParam } from "../../hooks/usePageParam";
import api from "../../lib/api";
import { greFormArtCardClass } from "../../lib/formStyles";
import { buildEventPath } from "../../lib/eventPaths";
import { DEFAULT_PAGE_SIZE, unwrapPaginated, type Paginated } from "../../lib/pagination";
import { mediaUrl } from "../../lib/mediaUrl";
import type { Event } from "../../types";

const emptyForm = {
  title: "",
  location: "",
  description: "",
  date: "",
  time: "09:00",
  reg_info: "",
  contact_info: "",
  poster_url: "",
};

export function EventsAdminPage() {
  const { user } = useAuth();
  if (!isPlatformAdmin(user)) return <Navigate to="/dashboard" replace />;

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { page, setPage } = usePageParam();

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["events-admin", page],
    queryFn: async () => {
      const { data } = await api.get("/events/", {
        params: { page, page_size: DEFAULT_PAGE_SIZE },
      });
      return unwrapPaginated<Event>(data as Event[] | Paginated<Event>);
    },
  });

  const events = eventsData?.results ?? [];
  const eventsTotal = eventsData?.count ?? 0;

  const createMutation = useMutation({
    mutationFn: () => api.post("/events/", form),
    onSuccess: () => {
      setForm(emptyForm);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["events-admin"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => setError("Could not create event. Check required fields and try again."),
  });

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Events"
        action={
          <Link
            to="/events"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-brand-200"
          >
            <ExternalLink className="h-4 w-4" />
            View public page
          </Link>
        }
      />

      <form
        className={`${greFormArtCardClass} space-y-6`}
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          createMutation.mutate();
        }}
      >
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Plus className="h-5 w-5 text-brand-600" />
          New event
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="City, venue, or online"
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            placeholder="09:00"
          />
          <div className="sm:col-span-2">
            <Input
              label="Poster image URL (optional)"
              value={form.poster_url}
              onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
              placeholder="https://… or leave empty for default banner"
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Registration info"
              value={form.reg_info}
              onChange={(e) => setForm({ ...form, reg_info: e.target.value })}
              rows={2}
              placeholder="How to register, deadlines, fees…"
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Contact"
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
              placeholder="Email or phone"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Button type="submit" loading={createMutation.isPending}>
          Create event
        </Button>
      </form>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Published events ({events.length})
        </h2>
        {isLoading ? (
          <p className="text-slate-500">Loading…</p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-500">
            <Calendar className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3">No events yet. Create one using the form above.</p>
            {import.meta.env.DEV ? (
              <p className="mt-2 text-xs text-slate-400">
                <code className="rounded bg-slate-100 px-1.5 py-0.5">
                  python manage.py seed_sample_data --force
                </code>
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((ev) => {
              const poster = ev.photos?.[0]?.photo ? mediaUrl(ev.photos[0].photo) : null;
              return (
                <article
                  key={ev.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  <div className="relative h-28">
                    {poster ? (
                      <img src={poster} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <DefaultBanner kind="event" seed={ev.id} />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-ink">{ev.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {ev.date}
                      {ev.time ? ` · ${ev.time}` : ""}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                    <Link
                      to={buildEventPath(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex text-xs font-semibold text-brand-600 hover:underline"
                    >
                      View on site
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!isLoading && eventsTotal > 0 && (
          <Pagination
            page={page}
            totalCount={eventsTotal}
            onPageChange={setPage}
            itemLabel="events"
            className="mt-6"
          />
        )}
      </section>
    </div>
  );
}
