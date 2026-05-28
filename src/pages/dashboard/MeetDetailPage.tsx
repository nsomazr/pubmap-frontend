import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  CircleDot,
  Copy,
  Disc3,
  FileText,
  Hash,
  MessagesSquare,
  Pencil,
  Radio,
  Sparkles,
  Trash2,
  ExternalLink,
  User,
  Users,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import {
  GrePremiumHero,
  GrePremiumPill,
  greBtnOnDarkPrimary,
  greBtnOnDarkSecondary,
} from "../../components/ui/GrePremiumHero";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import api, { parseApiError } from "../../lib/api";
import {
  fetchMeeting,
  formatMeetingDate,
  formatMeetingId,
  formatMeetingScheduleLines,
  meetingCalendarDownloadUrl,
  MEETING_TYPE_LABELS,
  MEETING_VISIBILITY_LABELS,
  respondMeetingInvite,
} from "../../lib/meetings";
import { MeetHostToolsPanel } from "../../components/meet/MeetHostToolsPanel";
import { MeetingGreAssistantPanel } from "../../components/meet/MeetingGreAssistantPanel";
import { FormattedAssistantText } from "../../lib/formatAssistantText";
import { buildPublicationPath } from "../../lib/publicationPaths";

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
    mutationFn: () => api.post(`/meetings/${id}/end/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Meeting ended",
        description: "The archive is now available for review.",
      });
      navigate(`/dashboard/meetings/${id}/archive`);
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
    mutationFn: () => api.delete(`/meetings/${id}/`),
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
    return <div className="gre-skeleton h-72 rounded-2xl" />;
  }

  const archiveId = formatMeetingId(meeting.id);
  const messageCount = meeting.chat_messages?.length ?? 0;
  const participantCount = meeting.participants?.length ?? meeting.participant_count ?? 0;
  const showArchiveLink = meeting.status !== "cancelled";
  const hasArchiveContent =
    messageCount > 0 ||
    Boolean(meeting.summary?.trim()) ||
    Boolean(meeting.meeting_minutes?.trim()) ||
    Boolean(meeting.recording_url);
  const schedule = formatMeetingScheduleLines(meeting.scheduled_at, meeting.scheduled_timezone);
  const hostName =
    meeting.host?.full_name ||
    `${meeting.host?.firstname ?? ""} ${meeting.host?.lastname ?? ""}`.trim() ||
    meeting.host?.email ||
    "—";
  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          variant="default"
          title={meeting.title}
          description={`${archiveId} · ${MEETING_TYPE_LABELS[meeting.meeting_type]} · ${meeting.category_name} / ${meeting.sub_category_name}`}
        />
        <Link
          to="/dashboard/meetings"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to meetings
        </Link>
      </div>

      <GrePremiumHero
        icon={Calendar}
        title={schedule.when}
        meta={
          <>
            {schedule.zone}
            <span className="mx-2 text-white/30">·</span>
            <span className="font-mono text-xs text-white/55">{schedule.iana}</span>
          </>
        }
        badges={
          <>
            <GrePremiumPill active>
              {meeting.status === "live" ? <CircleDot className="h-3 w-3 animate-pulse" /> : null}
              {meeting.status}
            </GrePremiumPill>
            <GrePremiumPill>{MEETING_VISIBILITY_LABELS[meeting.visibility]}</GrePremiumPill>
            <GrePremiumPill>
              {participantCount} participant{participantCount === 1 ? "" : "s"}
            </GrePremiumPill>
          </>
        }
        actions={
          <>
            {!canManage && meeting.participant_invite_status === "invited" && (
              <>
                <Button
                  variant="secondary"
                  className={greBtnOnDarkPrimary}
                  loading={respondInvite.isPending}
                  onClick={() => respondInvite.mutate("accept")}
                >
                  Accept invite
                </Button>
                <Button
                  variant="ghost"
                  className="!text-white hover:!bg-white/10"
                  loading={respondInvite.isPending}
                  onClick={() => respondInvite.mutate("decline")}
                >
                  Decline
                </Button>
              </>
            )}
            {meeting.can_join && meeting.status !== "ended" && meeting.status !== "cancelled" && (
              <Link to={`/meet/${meeting.join_slug}`}>
                <Button variant="secondary" className={greBtnOnDarkPrimary}>
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
            <Button variant="secondary" className={greBtnOnDarkSecondary} onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
          </>
        }
        footer={
          <>
            {meeting.description && (
              <p className="mb-5 max-w-3xl text-sm leading-relaxed text-slate-600">{meeting.description}</p>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
                <Hash className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Meeting ID</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{archiveId}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Host</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{hostName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Archive</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">
                    {meeting.status === "ended"
                      ? "Ready for review"
                      : meeting.status === "cancelled"
                        ? "Not created"
                        : "After you end the meeting"}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
              {!canManage && meeting.participant_invite_status === "accepted" && (
                <a href={meetingCalendarDownloadUrl(meeting.id)}>
                  <Button variant="secondary">
                    <CalendarPlus className="h-4 w-4" />
                    Add to calendar
                  </Button>
                </a>
              )}
              {showArchiveLink && (
                <Link to={`/dashboard/meetings/${meeting.id}/archive`}>
                  <Button variant="secondary">
                    <FileText className="h-4 w-4" />
                    Open archive
                  </Button>
                </Link>
              )}
              {canManage && meeting.status !== "ended" && (
                <Link to={`/dashboard/meetings/${meeting.id}/edit`}>
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
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-ink">Archive record</h2>
                  <p className="text-sm text-slate-500">
                    Transcript, AI summary, minutes, and recording
                  </p>
                </div>
              </div>
              {showArchiveLink && (
                <Link
                  to={`/dashboard/meetings/${meeting.id}/archive`}
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Button className="w-full sm:w-auto">
                    <MessagesSquare className="h-4 w-4" />
                    Open archive
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <MessagesSquare className="h-3.5 w-3.5 text-slate-500" />
                {messageCount} message{messageCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                Summary: {meeting.summary_status}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-700">
                <Disc3 className="h-3.5 w-3.5 text-slate-500" />
                Recording: {meeting.recording_status}
              </span>
            </div>

            {meeting.meeting_minutes ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Minutes preview
                </p>
                <div className="mt-2 max-h-48 overflow-y-auto text-sm leading-relaxed text-slate-700">
                  <FormattedAssistantText content={meeting.meeting_minutes} />
                </div>
              </div>
            ) : meeting.summary ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Summary preview
                </p>
                <p className="mt-2 line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {meeting.summary}
                </p>
              </div>
            ) : !hasArchiveContent ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
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
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Open recording file
              </a>
            )}
            {meeting.recording_error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {meeting.recording_error}
              </p>
            )}
          </div>

          {(meeting.status === "ended" || meeting.summary_status === "ready") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-ink">GRE Assistant</h2>
              </div>
              <p className="mb-4 text-sm text-slate-500">
                Ask questions about the meeting minutes and summary from your dashboard.
              </p>
              <MeetingGreAssistantPanel meeting={meeting} compact />
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-ink">Host tools</h2>
            <p className="mt-1 text-xs text-slate-500">Room defaults for microphones, video, and screen share</p>
            <div className="mt-4">
              {isHost && meeting.status === "cancelled" ? (
                <p className="text-sm text-slate-500">
                  This meeting is cancelled. Create a new session to reschedule.
                </p>
              ) : (
                <MeetHostToolsPanel meeting={meeting} canManage={canManage} variant="light" />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-ink">Participants</h2>
            </div>
            <ul className="mt-4 space-y-2">
              {(meeting.participants ?? []).map((participant) => (
                <li
                  key={participant.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {participant.user?.full_name ||
                        `${participant.user?.firstname ?? ""} ${participant.user?.lastname ?? ""}`.trim() ||
                        participant.user?.email}
                    </p>
                    <p className="text-xs capitalize text-slate-500">
                      {participant.role} · {participant.invite_status}
                    </p>
                  </div>
                </li>
              ))}
              {(meeting.participants?.length ?? 0) === 0 && (
                <li className="text-sm text-slate-500">No participants listed yet.</li>
              )}
            </ul>
          </div>

          {(meeting.publication || meeting.forum_topic) && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-ink">Related context</h2>
              <div className="mt-4 space-y-3">
                {meeting.publication && (
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paper</p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-ink">{meeting.publication.title}</p>
                    <Button
                      className="mt-3 h-8 px-0 text-brand-700"
                      variant="ghost"
                      onClick={() =>
                        navigate(
                          buildPublicationPath(meeting.publication?.id, meeting.publication?.encoded_id)
                        )
                      }
                    >
                      Open publication →
                    </Button>
                  </div>
                )}
                {meeting.forum_topic && (
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Discussion</p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-ink">{meeting.forum_topic.topic}</p>
                    <Button
                      className="mt-3 h-8 px-0 text-brand-700"
                      variant="ghost"
                      onClick={() => navigate(`/forum/topic/${meeting.forum_topic?.id}`)}
                    >
                      Open discussion →
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </section>

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
