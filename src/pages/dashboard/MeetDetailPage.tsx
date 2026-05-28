import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  CircleDot,
  Copy,
  Disc3,
  FileText,
  MessagesSquare,
  Pencil,
  Radio,
  Sparkles,
  Trash2,
  ExternalLink,
  Users,
  Video,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatDisplayTile } from "../../components/dashboard/StatDisplayTile";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import api, { parseApiError } from "../../lib/api";
import {
  fetchMeeting,
  formatMeetingId,
  formatMeetingDateInTimezone,
  formatMeetingScheduleLines,
  meetingCalendarDownloadUrl,
  MEETING_TYPE_LABELS,
  MEETING_VISIBILITY_LABELS,
  respondMeetingInvite,
} from "../../lib/meetings";
import { MeetHostToolsPanel } from "../../components/meet/MeetHostToolsPanel";
import { MeetingArchiveParticipants } from "../../components/meet/MeetingArchiveParticipants";
import { MeetingGreAssistantPanel } from "../../components/meet/MeetingGreAssistantPanel";
import { FormattedAssistantText } from "../../lib/formatAssistantText";
import { userFullName } from "../../lib/userDisplay";
import { buildMeetingPath, meetingApiSegment } from "../../lib/meetingPaths";
import { buildForumTopicPath } from "../../lib/forumPaths";
import { buildPublicationPath } from "../../lib/publicationPaths";

function statusValueClass(status: string) {
  if (status === "live") return "text-teal-700";
  if (status === "ended") return "text-slate-700";
  if (status === "cancelled") return "text-red-700";
  return "text-ink";
}

function DetailSectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-brand-700">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MeetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => fetchMeeting(id!),
    enabled: !!id,
  });

  const endMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingApiSegment(id!)}/end/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Meeting ended",
        description: "The archive is now available for review.",
      });
      navigate(buildMeetingPath(meeting ?? id!, "archive"));
    },
    onError: (error) => {
      toast.error({
        title: "Could not end meeting",
        description: parseApiError(error, "Could not end the meeting."),
      });
    },
  });

  const respondInvite = useMutation({
    mutationFn: (response: "accept" | "decline") => respondMeetingInvite(Number(id), response),
    onSuccess: async (payload) => {
      await queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success({
        title: "Invitation updated",
        description: payload.detail,
      });
    },
    onError: (error) => {
      toast.error({
        title: "Could not update invitation",
        description: parseApiError(error, "Could not update your invitation response."),
      });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: () => api.delete(`/meetings/${meetingApiSegment(id!)}/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.removeQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Meeting deleted",
        description: "The hosted meeting was permanently removed.",
      });
      navigate("/dashboard/meetings?scope=mine");
    },
    onError: (error) => {
      toast.error({
        title: "Could not delete meeting",
        description: parseApiError(error, "Could not delete this meeting."),
      });
    },
  });

  const canManage = !!meeting?.can_manage;
  const isHost = meeting?.host_id === user?.id;

  const copyLink = async () => {
    if (!meeting?.meeting_link) return;
    try {
      await navigator.clipboard.writeText(meeting.meeting_link);
      toast.success({
        title: "Meeting link copied",
        description: "The share link was copied to your clipboard.",
      });
    } catch {
      window.prompt("Copy meeting link", meeting.meeting_link);
    }
  };

  if (isLoading || !meeting) {
    return (
      <div className="animate-fade-up space-y-6">
        <div className="gre-skeleton h-24 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="gre-skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="gre-skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const archiveId = formatMeetingId(meeting);
  const messageCount = meeting.chat_messages?.length ?? 0;
  const participantCount = meeting.participants?.length ?? meeting.participant_count ?? 0;
  const showArchiveLink = meeting.status !== "cancelled";
  const hasArchiveContent =
    messageCount > 0 ||
    Boolean(meeting.summary?.trim()) ||
    Boolean(meeting.meeting_minutes?.trim()) ||
    Boolean(meeting.recording_url);
  const schedule = formatMeetingScheduleLines(meeting.scheduled_at, meeting.scheduled_timezone);
  const hostName = meeting.host ? userFullName(meeting.host) : "—";
  const descriptionText = meeting.description?.trim();
  const showDescription =
    descriptionText && !/^nothing\.?$/i.test(descriptionText);

  const headerActions: ReactNode = (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <Link
        to="/dashboard/meetings"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to meetings
      </Link>
      {!canManage && meeting.participant_invite_status === "invited" && (
        <>
          <Button loading={respondInvite.isPending} onClick={() => respondInvite.mutate("accept")}>
            Accept invite
          </Button>
          <Button
            variant="secondary"
            loading={respondInvite.isPending}
            onClick={() => respondInvite.mutate("decline")}
          >
            Decline
          </Button>
        </>
      )}
      {meeting.can_join && meeting.status !== "ended" && meeting.status !== "cancelled" && (
        <Link to={`/meet/${meeting.join_slug}`}>
          <Button>
            {canManage && meeting.status === "scheduled" ? (
              <>
                <Radio className="h-4 w-4" />
                Start and join
              </>
            ) : meeting.status === "live" ? (
              <>
                <Radio className="h-4 w-4" />
                Join live room
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Join room
              </>
            )}
          </Button>
        </Link>
      )}
      <Button variant="secondary" onClick={copyLink}>
        <Copy className="h-4 w-4" />
        Copy link
      </Button>
    </div>
  );

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        variant="clean"
        title={meeting.title}
        description={`${archiveId} · ${MEETING_TYPE_LABELS[meeting.meeting_type]} · ${meeting.category_name} / ${meeting.sub_category_name}`}
        action={headerActions}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatDisplayTile label="Meeting ID" value={archiveId} />
        <StatDisplayTile
          label="Status"
          value={
            <span className="inline-flex items-center gap-1.5 capitalize">
              {meeting.status === "live" && (
                <CircleDot className="h-4 w-4 animate-pulse text-teal-600" />
              )}
              {meeting.status}
            </span>
          }
          valueClassName={statusValueClass(meeting.status)}
        />
        <StatDisplayTile label="Participants" value={participantCount} />
        <StatDisplayTile label="Messages" value={messageCount} />
      </section>

      <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
        <DetailSectionTitle
          icon={Calendar}
          title="Session overview"
          description="Schedule, host, and room actions for this meeting."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">When</p>
            <p className="mt-2 text-sm font-semibold text-ink">{schedule.when}</p>
            <p className="mt-1 text-sm text-slate-600">{schedule.zone}</p>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{schedule.iana}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Host</p>
            <p className="mt-2 text-sm font-semibold text-ink">{hostName}</p>
            <p className="mt-2 text-xs text-slate-500">
              {MEETING_VISIBILITY_LABELS[meeting.visibility]}
            </p>
          </div>
        </div>

        {showDescription && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{descriptionText}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {!canManage && meeting.participant_invite_status === "accepted" && (
            <a href={meetingCalendarDownloadUrl(meeting.id)}>
              <Button variant="secondary">
                <CalendarPlus className="h-4 w-4" />
                Add to calendar
              </Button>
            </a>
          )}
          {showArchiveLink && (
            <Link to={buildMeetingPath(meeting, "archive")}>
              <Button variant="secondary">
                <FileText className="h-4 w-4" />
                Open archive
              </Button>
            </Link>
          )}
          {canManage && meeting.status !== "ended" && (
            <Link to={buildMeetingPath(meeting, "edit")}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Edit meeting
              </Button>
            </Link>
          )}
          {(canManage && meeting.status === "scheduled") || (canManage && meeting.status === "ended") ? (
            <Button
              variant="danger"
              loading={deleteMeeting.isPending}
              onClick={() => setConfirmCancelOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
          {canManage && meeting.status === "live" && (
            <Button variant="danger" loading={endMeeting.isPending} onClick={() => setConfirmEndOpen(true)}>
              End meeting
            </Button>
          )}
        </div>
      </div>

      <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <DetailSectionTitle
            icon={FileText}
            title="Archive record"
            description="Transcript, AI summary, minutes, and recording."
          />
          {showArchiveLink && (
            <Link
              to={buildMeetingPath(meeting, "archive")}
              className="w-full shrink-0 sm:w-auto sm:pt-1"
            >
              <Button className="w-full sm:w-auto">
                <MessagesSquare className="h-4 w-4" />
                Open archive
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
            <MessagesSquare className="h-3.5 w-3.5 text-slate-500" />
            {messageCount} message{messageCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200/80">
            <Sparkles className="h-3.5 w-3.5 text-slate-500" />
            Summary: {meeting.summary_status}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200/80">
            <Disc3 className="h-3.5 w-3.5 text-slate-500" />
            Recording: {meeting.recording_status}
          </span>
        </div>

        {meeting.meeting_minutes ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Minutes preview
            </p>
            <div className="mt-2 max-h-48 overflow-y-auto text-sm leading-relaxed text-slate-700">
              <FormattedAssistantText content={meeting.meeting_minutes} />
            </div>
          </div>
        ) : meeting.summary ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Summary preview
            </p>
            <p className="mt-2 line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {meeting.summary}
            </p>
          </div>
        ) : !hasArchiveContent ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-sm text-slate-600">
            {meeting.status === "cancelled"
              ? "This meeting was cancelled — no archive was created."
              : meeting.status === "ended"
                ? "The meeting ended. Open the archive to check when the summary and recording are ready."
                : "End the meeting to generate the transcript, summary, and recording in the archive."}
          </p>
        ) : null}

        {meeting.recording_url && (
          <a
            href={meeting.recording_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Open recording file
          </a>
        )}
        {meeting.recording_error && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {meeting.recording_error}
          </p>
        )}
      </div>

      <div
        className={`grid gap-6 items-start ${
          meeting.publication || meeting.forum_topic
            ? "lg:grid-cols-2 xl:grid-cols-3"
            : "lg:grid-cols-2"
        }`}
      >
        <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
          <DetailSectionTitle
            icon={Sparkles}
            title="Host tools"
            description="Room defaults for mic, video, and screen share."
          />
          {isHost && meeting.status === "cancelled" ? (
            <p className="text-sm text-slate-500">
              This meeting is cancelled. Create a new session to reschedule.
            </p>
          ) : (
            <MeetHostToolsPanel meeting={meeting} canManage={canManage} variant="light" />
          )}
        </div>

        <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
          <DetailSectionTitle
            icon={Users}
            title="Participants"
            description="Everyone invited or joined this session."
          />
          <MeetingArchiveParticipants participants={meeting.participants ?? []} />
        </div>

        {(meeting.publication || meeting.forum_topic) && (
          <div className="gre-dashboard-card space-y-4 p-5 sm:p-6 lg:col-span-2 xl:col-span-1">
            <DetailSectionTitle icon={FileText} title="Related context" />
            <div className="space-y-3">
              {meeting.publication && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paper</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink">
                    {meeting.publication.title}
                  </p>
                  <Button
                    className="mt-3"
                    variant="ghost"
                    onClick={() =>
                      navigate(
                        buildPublicationPath(meeting.publication?.id, meeting.publication?.encoded_id)
                      )
                    }
                  >
                    Open publication
                  </Button>
                </div>
              )}
              {meeting.forum_topic && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Discussion
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink">
                    {meeting.forum_topic.topic}
                  </p>
                  <Button
                    className="mt-3"
                    variant="ghost"
                    onClick={() =>
                      meeting.forum_topic &&
                      navigate(buildForumTopicPath(meeting.forum_topic))
                    }
                  >
                    Open discussion
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {(meeting.status === "ended" || meeting.summary_status === "ready") && (
        <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
          <DetailSectionTitle
            icon={Sparkles}
            title="GRE Assistant"
            description="Ask about minutes, decisions, and the meeting transcript."
          />
          <MeetingGreAssistantPanel meeting={meeting} compact variant="light" />
        </div>
      )}

      <ConfirmDialog
        open={confirmCancelOpen}
        title="Delete this meeting?"
        description="This will permanently remove the hosted meeting and cannot be undone."
        confirmLabel="Delete meeting"
        cancelLabel="Keep meeting"
        tone="danger"
        loading={deleteMeeting.isPending}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={() => {
          deleteMeeting.mutate();
          setConfirmCancelOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmEndOpen}
        title="End this meeting?"
        description="This will close the live room and finalize the GRE archive for this session."
        confirmLabel="End meeting"
        cancelLabel="Keep meeting live"
        tone="danger"
        loading={endMeeting.isPending}
        onClose={() => setConfirmEndOpen(false)}
        onConfirm={() => {
          endMeeting.mutate();
          setConfirmEndOpen(false);
        }}
      />
    </div>
  );
}
