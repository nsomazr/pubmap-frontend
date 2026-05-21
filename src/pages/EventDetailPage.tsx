import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Mail, MapPin } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api";
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
      const { data } = await api.get<Event>(`/events/${id}/`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <PublicPageLayout title="Event" crumbs={[{ label: "Home", to: "/" }, { label: "Events", to: "/events" }, { label: "…" }]}>
        <p className="text-slate-500">Loading…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !event) {
    return (
      <PublicPageLayout title="Event not found" crumbs={[{ label: "Events", to: "/events" }]}>
        <Link to="/events" className="inline-flex items-center gap-2 text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
      </PublicPageLayout>
    );
  }

  const poster = event.photos?.[0]?.photo ? mediaUrl(event.photos[0].photo) : null;

  return (
    <PublicPageLayout
      compactHero
      accent="blue"
      badge="Event details"
      title={event.title}
      subtitle={event.location}
      crumbs={[
        { label: "Home", to: "/" },
        { label: "Events", to: "/events" },
        { label: event.title },
      ]}
    >
      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        All events
      </Link>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80">
        {poster ? (
          <img src={poster} alt="" className="max-h-80 w-full object-cover sm:max-h-96" />
        ) : (
          <div className="h-48 sm:h-56">
            <DefaultBanner kind="event" seed={event.id} />
          </div>
        )}
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            {event.date && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 font-medium text-brand-700">
                <Calendar className="h-4 w-4" />
                {event.date}
                {event.time ? ` · ${event.time}` : ""}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" />
                {event.location}
              </span>
            )}
          </div>

          {event.description && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                About
              </h2>
              <p className="mt-2 leading-relaxed text-slate-700">{event.description}</p>
            </div>
          )}

          {event.reg_info && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Registration
              </h2>
              <p className="mt-2 text-slate-700">{event.reg_info}</p>
            </div>
          )}

          {event.contact_info && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Mail className="h-4 w-4 text-brand-600" />
                Contact
              </h2>
              <p className="mt-2 text-slate-700">
                {event.contact_info.includes("@") ? (
                  <a
                    href={`mailto:${event.contact_info}`}
                    className="font-medium text-brand-600 hover:underline"
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
