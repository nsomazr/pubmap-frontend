import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import api from "../lib/api";
import { buildEventPath } from "../lib/eventPaths";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicEmptyState } from "../components/layout/PublicEmptyState";
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
      title="Events"
      subtitle="Upcoming gatherings on the research map."
      crumbs={[{ label: "Home", to: "/" }, { label: "Events" }]}
    >
      <GreAdPlacement
        placement="event_sponsor"
        limit={3}
        variant="card"
        rotate
        className="mb-6"
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="gre-skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <PublicEmptyState
          icon={Calendar}
          title="No events scheduled"
          description="Check back soon for upcoming gatherings."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const poster = event.photos?.[0]?.photo ? mediaUrl(event.photos[0].photo) : null;
            const when = formatEventDate(event.date, event.time);
            return (
              <article key={event.id} className="gre-interactive gre-public-card overflow-hidden p-0">
                <div className="relative h-28 overflow-hidden bg-slate-100">
                  {poster ? (
                    <img
                      src={poster}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <DefaultBanner kind="event" seed={event.id} />
                  )}
                  {when && (
                    <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-brand-800">
                      {when}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                    {event.title}
                  </h3>
                  {event.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">{event.description}</p>
                  )}
                  <Link
                    to={buildEventPath(event)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
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
