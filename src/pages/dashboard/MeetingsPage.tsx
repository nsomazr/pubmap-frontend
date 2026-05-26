import { useQuery } from "@tanstack/react-query";
import { Calendar, Radio, Video } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { fetchMeetings, formatMeetingDate, formatMeetingId, MEETING_TYPE_LABELS } from "../../lib/meetings";
import type { MeetSession } from "../../types";

const tabs = [
  { id: "upcoming", label: "Upcoming", icon: Calendar },
  { id: "live", label: "Live", icon: Radio },
  { id: "mine", label: "My meetings", icon: Video },
  { id: "archived", label: "Archived", icon: Calendar },
] as const;

function MeetingCard({ meeting }: { meeting: MeetSession }) {
  const isArchived = meeting.status === "ended";
  const roomLabel = meeting.status === "live" ? "Open live room" : "Join room";
  const archiveId = formatMeetingId(meeting.id);

  return (
    <article className="gre-card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {MEETING_TYPE_LABELS[meeting.meeting_type]}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{meeting.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {meeting.category_name} / {meeting.sub_category_name}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-400">{archiveId}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            meeting.status === "live"
              ? "bg-red-50 text-red-700"
              : isArchived
                ? "bg-slate-100 text-slate-600"
                : "bg-brand-50 text-brand-700"
          }`}
        >
          {meeting.status === "live"
            ? "Live"
            : isArchived
              ? "Archived"
              : formatMeetingDate(meeting.scheduled_at)}
        </span>
      </div>

      {meeting.description && (
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{meeting.description}</p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {meeting.participant_count ?? 0} participant{(meeting.participant_count ?? 0) === 1 ? "" : "s"}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{meeting.visibility.replace(/_/g, " ")}</span>
        {meeting.summary_status === "ready" && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Summary ready</span>
        )}
        {meeting.recording_status === "ready" && (
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-700">Recording ready</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!isArchived && meeting.can_join && (
          <Link to={`/meet/${meeting.join_slug}`}>
            <Button>{roomLabel}</Button>
          </Link>
        )}
        <Link to={`/dashboard/meetings/${meeting.id}`}>
          <Button variant="secondary">View details</Button>
        </Link>
        {isArchived && (
          <Link to={`/dashboard/meetings/${meeting.id}/archive`}>
            <Button>Open archive</Button>
          </Link>
        )}
        {meeting.can_manage && !isArchived && (
          <Link to={`/dashboard/meetings/${meeting.id}/edit`}>
            <Button variant="ghost">Edit</Button>
          </Link>
        )}
      </div>
    </article>
  );
}

export function MeetingsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const scope = (searchParams.get("scope") || "upcoming") as (typeof tabs)[number]["id"];

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings", scope],
    queryFn: () => fetchMeetings({ scope }),
  });

  const liveCount = meetings.filter((meeting) => meeting.status === "live").length;

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="GRE Meet"
        description="Research-native meetings for paper discussions, workshops, presentations, and live collaboration inside GRE."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/meetings/new">
              <Button>Create meeting</Button>
            </Link>
            {liveCount > 0 && (
              <Link to="/dashboard/meetings?scope=live">
                <Button variant="secondary">View live rooms</Button>
              </Link>
            )}
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSearchParams({ scope: id })}
            className={`gre-card flex items-center gap-3 p-4 text-left transition ${
              scope === id ? "ring-2 ring-brand-200 bg-brand-50/60" : "hover:ring-1 hover:ring-slate-200"
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-slate-200">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-ink">{label}</p>
              <p className="text-xs text-slate-500">
                {id === "mine" ? "Meetings you host" : id === "archived" ? "Past recordings and summaries" : "Research sessions on GRE"}
              </p>
            </div>
          </button>
        ))}
      </section>

      <section className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="gre-skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="gre-card rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <Video className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-ink">No meetings in this view yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {user?.firstname ? `${user.firstname}, create the first GRE Meet session for your research community.` : "Create the first GRE Meet session for your research community."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
