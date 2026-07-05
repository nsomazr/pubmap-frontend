import { useQuery } from "@tanstack/react-query";
import { Calendar, Mail, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { eventApiSegment } from "../lib/eventPaths";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { DefaultBanner } from "../components/ui/DefaultBanner";
import { mediaUrl } from "../lib/mediaUrl";
import type { Event } from "../types";

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Event>(`/events/${eventApiSegment(id!)}/`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <PublicPageLayout
        compactHero
        title="Event"
        crumbs={[{ label: "Home", to: "/" }, { label: "Events", to: "/events" }, { label: "…" }]}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !event) {
    return (
      <PublicPageLayout
        compactHero
        title="Event not found"
        crumbs={[{ label: "Events", to: "/events" }]}
        back={{ to: "/events", label: "All events" }}
      >
        <p className="text-sm text-slate-600">This event could not be found.</p>
      </PublicPageLayout>
    );
  }

  const poster = event.photos?.[0]?.photo ? mediaUrl(event.photos[0].photo) : null;

  return (
    <PublicPageLayout
      compactHero
      title={event.title}
      subtitle={event.location ?? undefined}
      crumbs={[
        { label: "Home", to: "/" },
        { label: "Events", to: "/events" },
        { label: event.title },
      ]}
      back={{ to: "/events", label: "All events" }}
    >
      <div className="gre-public-card overflow-hidden p-0">
        {poster ? (
          <img src={poster} alt="" className="max-h-72 w-full object-cover sm:max-h-80" />
        ) : (
          <div className="h-40 sm:h-48">
            <DefaultBanner kind="event" seed={event.id} />
          </div>
        )}
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            {event.date && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-ink">
                <Calendar className="h-4 w-4 text-brand-600" />
                {event.date}
                {event.time ? ` · ${event.time}` : ""}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                {event.location}
              </span>
            )}
          </div>

          {event.description && (
            <div>
              <h2 className="text-sm font-semibold text-ink">About</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{event.description}</p>
            </div>
          )}

          {event.reg_info && (
            <div>
              <h2 className="text-sm font-semibold text-ink">Registration</h2>
              <p className="mt-2 text-sm text-slate-700">{event.reg_info}</p>
            </div>
          )}

          {event.contact_info && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Mail className="h-4 w-4 text-brand-600" />
                Contact
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                {event.contact_info.includes("@") ? (
                  <a
                    href={`mailto:${event.contact_info}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {event.contact_info}
                  </a>
                ) : (
                  event.contact_info
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </PublicPageLayout>
  );
}
