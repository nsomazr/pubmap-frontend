import { useQuery } from "@tanstack/react-query";
import { Calendar, CalendarCheck, FileText, Radio, Video } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";
import { usePageParam } from "../../hooks/usePageParam";
import {
  fetchMeetings,
  formatMeetingDate,
  formatMeetingId,
  MEETING_TYPE_LABELS,
} from "../../lib/meetings";
import { DEFAULT_PAGE_SIZE } from "../../lib/pagination";
import type { MeetSession } from "../../types";

const tabs = [
  { id: "upcoming", label: "Upcoming", icon: Calendar },
  { id: "live", label: "Live", icon: Radio },
  { id: "mine", label: "Hosted", icon: Video },
  { id: "archived", label: "Reports & archive", icon: CalendarCheck },
] as const;

type MeetScope = (typeof tabs)[number]["id"];

const SCOPE_HINTS: Record<MeetScope, string> = {
  upcoming: "Scheduled research sessions on GRE.",
  live: "Sessions broadcasting right now — join from here.",
  mine: "Active meetings you host or manage.",
  archived: "Ended sessions you hosted or attended — open reports and recordings here.",
};

function meetingDescription(text?: string | null) {
  const value = text?.trim();
  if (!value || /^nothing\.?$/i.test(value)) return null;
  return value;
}

function MeetingStatusBadge({ meeting }: { meeting: MeetSession }) {
  const isArchived = meeting.status === "ended";
  const isCancelled = meeting.status === "cancelled";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        meeting.status === "live"
          ? "bg-red-50 text-red-700 ring-1 ring-red-100"
          : isCancelled
            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
            : isArchived
              ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
              : "bg-brand-50 text-brand-800 ring-1 ring-brand-100"
      }`}
    >
      {meeting.status === "live"
        ? "Live"
        : isCancelled
          ? "Cancelled"
          : isArchived
            ? "Archived"
            : formatMeetingDate(meeting.scheduled_at)}
    </span>
  );
}

function MeetingRow({ meeting }: { meeting: MeetSession }) {
  const isArchived = meeting.status === "ended";
  const isCancelled = meeting.status === "cancelled";
  const description = meetingDescription(meeting.description);
  const roomLabel =
    meeting.status === "live"
      ? "Open live room"
      : meeting.can_manage && meeting.status === "scheduled"
        ? "Start & join"
        : "Join room";
  const archiveId = formatMeetingId(meeting.id);
  const participants = meeting.participant_count ?? 0;
  const hasReport = Boolean(
    meeting.meeting_minutes?.trim() ||
      meeting.summary?.trim() ||
      meeting.minutes_email_sent_at
  );

  return (
    <article className="group flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3.5">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full sm:mt-0 ${
            meeting.status === "live"
              ? "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.25)]"
              : isCancelled
                ? "bg-amber-400"
                : isArchived
                  ? "bg-slate-300"
                  : "bg-brand-500"
          }`}
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
              {MEETING_TYPE_LABELS[meeting.meeting_type]}
            </p>
            <MeetingStatusBadge meeting={meeting} />
          </div>

          <h3 className="mt-0.5 truncate text-base font-semibold text-ink group-hover:text-brand-800">
            {meeting.title}
          </h3>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {meeting.category_name} / {meeting.sub_category_name}
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-mono text-[11px] text-slate-400">{archiveId}</span>
          </p>

          {description && (
            <p className="mt-1 line-clamp-1 text-sm text-slate-600">{description}</p>
          )}

          {isCancelled && (
            <p className="mt-1 text-xs text-amber-700">Cancelled — not available in archive.</p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {participants} participant{participants === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
              {meeting.visibility.replace(/_/g, " ")}
            </span>
            {meeting.summary_status === "ready" && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                Summary
              </span>
            )}
            {meeting.recording_status === "ready" && (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                Recording
              </span>
            )}
            {isArchived && hasReport && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                Report
              </span>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 flex-wrap justify-end gap-1.5 sm:flex sm:max-w-[11rem]">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {participants} participant{participants === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
            {meeting.visibility.replace(/_/g, " ")}
          </span>
          {meeting.summary_status === "ready" && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Summary
            </span>
          )}
          {meeting.recording_status === "ready" && (
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
              Recording
            </span>
          )}
          {isArchived && hasReport && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              Report
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {!isArchived && !isCancelled && meeting.can_join && (
          <Link to={`/meet/${meeting.join_slug}`}>
            <Button className="!px-3 !py-2 text-xs">{roomLabel}</Button>
          </Link>
        )}
        <Link to={`/dashboard/meetings/${meeting.id}`}>
          <Button variant="secondary" className="!px-3 !py-2 text-xs">
            Details
          </Button>
        </Link>
        {isArchived && (
          <Link to={`/dashboard/meetings/${meeting.id}/archive`}>
            <Button
              variant={hasReport ? "primary" : "secondary"}
              className="!px-3 !py-2 text-xs"
            >
              {hasReport ? (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Open report
                </>
              ) : (
                "Archive"
              )}
            </Button>
          </Link>
        )}
        {meeting.can_manage && !isArchived && !isCancelled && (
          <Link
            to={`/dashboard/meetings/${meeting.id}/edit`}
            className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-700"
          >
            Edit
          </Link>
        )}
      </div>
    </article>
  );
}

export function MeetingsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const scope = (searchParams.get("scope") || "upcoming") as MeetScope;
  const { page, setPage } = usePageParam([scope]);

  const selectScope = (id: MeetScope) => {
    setSearchParams({ scope: id });
    setPage(1);
  };

  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ["meetings", scope, page],
    queryFn: () => fetchMeetings({ scope, page, page_size: DEFAULT_PAGE_SIZE }),
  });

  const meetings = meetingsData?.results ?? [];
  const meetingsTotal = meetingsData?.count ?? 0;
  const liveCount = meetings.filter((meeting) => meeting.status === "live").length;

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        variant="premium"
        title="GRE Meet"
        description="Host and join research sessions, live rooms, and archives."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/meetings/new">
              <Button>Create meeting</Button>
            </Link>
            {liveCount > 0 && scope !== "live" && (
              <Link to="/dashboard/meetings?scope=live">
                <Button variant="secondary" className="!px-3 !py-2 text-xs">
                  {liveCount} live now
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100/90 p-1.5 ring-1 ring-slate-200/70">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = scope === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectScope(id)}
              aria-pressed={isActive}
              className={`gre-interactive inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                isActive ? "gre-meet-tab--active" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-brand-700" : "text-slate-500"}`} />
              {label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-slate-500">{SCOPE_HINTS[scope]}</p>

      <section>
        {isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="gre-skeleton h-20 border-b border-slate-100 last:border-0"
              />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
            <Video className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-2 font-semibold text-ink">No meetings in this view</p>
            <p className="mt-1 text-sm text-slate-500">
              {user?.firstname
                ? `${user.firstname}, schedule a GRE Meet for your research community.`
                : "Schedule a GRE Meet for your research community."}
            </p>
            <Link to="/dashboard/meetings/new" className="mt-4 inline-block">
              <Button>Create meeting</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <ul className="divide-y divide-slate-100">
                {meetings.map((meeting) => (
                  <li key={meeting.id}>
                    <MeetingRow meeting={meeting} />
                  </li>
                ))}
              </ul>
            </div>
            <Pagination
              page={page}
              totalCount={meetingsTotal}
              onPageChange={setPage}
              itemLabel="meetings"
              className="mt-4"
            />
          </>
        )}
      </section>
    </div>
  );
}
