import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import api from "../lib/api";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { DefaultBanner } from "../components/ui/DefaultBanner";
import { mediaUrl } from "../lib/mediaUrl";
import type { Event } from "../types";

function formatEventDate(date?: string, time?: string) {
  if (!date) return null;
  try {
    const d = new Date(date);
    const formatted = d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return time ? `${formatted} · ${time}` : formatted;
  } catch {
    return time ? `${date} · ${time}` : date;
  }
}

export function EventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await api.get<Event[] | { results: Event[] }>("/events/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  return (
    <PublicPageLayout
      compactHero
      wide
      accent="blue"
      badge="Community"
      title="Available Events"
      crumbs={[{ label: "Home", to: "/" }, { label: "Events" }]}
    >
      <GreAdPlacement
        placement="institutional_banner"
        limit={1}
        variant="banner"
        className="mb-8"
      />

      <GreAdPlacement
        placement="event_sponsor"
        limit={6}
        variant="card"
        rotate
        className="mb-8"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <Calendar className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-600">No events scheduled yet</p>
          <p className="mt-1 text-sm text-slate-400">Check back soon for upcoming gatherings.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => {
            const poster = event.photos?.[0]?.photo
              ? mediaUrl(event.photos[0].photo)
              : null;
            return (
              <article
                key={event.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200/80"
              >
                <div className="relative h-32 overflow-hidden sm:h-36">
                  {poster ? (
                    <img
                      src={poster}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <DefaultBanner kind="event" seed={event.id} />
                  )}
                  {event.date && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-brand-800 shadow-sm backdrop-blur">
                      {formatEventDate(event.date, event.time)}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-amber-800">
                    {event.title}
                  </h3>
                  {event.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                      <span className="line-clamp-1">{event.location}</span>
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {event.description}
                    </p>
                  )}
                  <Link
                    to={`/events/${event.id}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition group-hover:gap-1.5"
                  >
                    View details
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PublicPageLayout>
  );
}
