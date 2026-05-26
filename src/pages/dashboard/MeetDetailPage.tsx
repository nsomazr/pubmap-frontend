import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  Clock3,
  Copy,
  Trash2,
  ExternalLink,
  FileText,
  MessagesSquare,
  Radio,
  Users,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import api, { parseApiError } from "../../lib/api";
import {
  fetchMeeting,
  formatMeetingDate,
  formatMeetingId,
  MEETING_TYPE_LABELS,
  MEETING_VISIBILITY_LABELS,
} from "../../lib/meetings";
import { buildPublicationPath } from "../../lib/publicationPaths";

export function MeetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => fetchMeeting(id!),
    enabled: !!id,
  });

  const startMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${id}/start/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Meeting started",
        description: "Participants can now enter the live room.",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Could not start meeting",
        description: parseApiError(error, "Could not start the meeting."),
      });
    },
  });

  const endMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${id}/end/`, { host_notes: meeting?.host_notes || "" }),
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

  const cancelMeeting = useMutation({
    mutationFn: () => api.delete(`/meetings/${id}/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success({
        title: "Meeting cancelled",
        description: "Cancelled meetings stay out of the archive.",
      });
      navigate("/dashboard/meetings?scope=cancelled");
    },
    onError: (error) => {
      toast.error({
        title: "Could not cancel meeting",
        description: parseApiError(error, "Could not cancel the meeting."),
      });
    },
  });

  const deleteCancelledMeeting = useMutation({
    mutationFn: () => api.delete(`/meetings/${id}/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.removeQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Cancelled meeting deleted",
        description: "The cancelled meeting was permanently removed.",
      });
      navigate("/dashboard/meetings?scope=cancelled");
    },
    onError: (error) => {
      toast.error({
        title: "Could not delete meeting",
        description: parseApiError(error, "Could not delete this cancelled meeting."),
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
  const canOpenArchive =
    meeting.status === "ended" ||
    messageCount > 0 ||
    Boolean(meeting.summary) ||
    Boolean(meeting.recording_url);

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title={meeting.title}
        description={`${archiveId} · ${MEETING_TYPE_LABELS[meeting.meeting_type]} · ${meeting.category_name} / ${meeting.sub_category_name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/meetings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="gre-card space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700 capitalize">
              {meeting.status}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              {MEETING_VISIBILITY_LABELS[meeting.visibility]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              {participantCount} participant{participantCount === 1 ? "" : "s"}
            </span>
          </div>

          {meeting.description && (
            <p className="text-sm leading-relaxed text-slate-600">{meeting.description}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting ID</p>
              <p className="mt-2 text-sm font-semibold text-ink">{archiveId}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</p>
              <p className="mt-2 text-sm font-semibold text-ink">{formatMeetingDate(meeting.scheduled_at)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Host</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {meeting.host?.full_name ||
                  `${meeting.host?.firstname ?? ""} ${meeting.host?.lastname ?? ""}`.trim() ||
                  meeting.host?.email}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Archive</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {meeting.status === "ended"
                  ? "Ready for review"
                  : meeting.status === "cancelled"
                    ? "No archive is created for cancelled meetings"
                    : "Builds only after you end a live meeting"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {meeting.can_join && meeting.status !== "ended" && meeting.status !== "cancelled" && (
              <Link to={`/meet/${meeting.join_slug}`}>
                <Button>
                  {meeting.status === "live" ? (
                    <>
                      <Radio className="h-4 w-4" />
                      Open live room
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
            {canOpenArchive && (
              <Link to={`/dashboard/meetings/${meeting.id}/archive`}>
                <Button variant="secondary">
                  <FileText className="h-4 w-4" />
                  Open archive
                </Button>
              </Link>
            )}
            {canManage && meeting.status !== "ended" && (
              <Link to={`/dashboard/meetings/${meeting.id}/edit`}>
                <Button variant="ghost">Edit meeting</Button>
              </Link>
            )}
            {canManage && meeting.status === "scheduled" && (
              <Button loading={startMeeting.isPending} onClick={() => startMeeting.mutate()}>
                Start meeting
              </Button>
            )}
            {canManage && meeting.status === "scheduled" && (
              <Button
                variant="danger"
                loading={cancelMeeting.isPending}
                onClick={() => setConfirmCancelOpen(true)}
              >
                <Ban className="h-4 w-4" />
                Cancel meeting
              </Button>
            )}
            {canManage && meeting.status === "cancelled" && (
              <Button
                variant="danger"
                loading={deleteCancelledMeeting.isPending}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete meeting
              </Button>
            )}
            {canManage && meeting.status === "live" && (
              <Button
                variant="danger"
                loading={endMeeting.isPending}
                onClick={() => setConfirmEndOpen(true)}
              >
                End meeting
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="gre-card space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-ink">Session status</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recording</p>
                <p className="mt-1 text-sm font-medium capitalize text-ink">{meeting.recording_status}</p>
                {meeting.recording_error && (
                  <p className="mt-2 text-xs text-red-600">{meeting.recording_error}</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                <p className="mt-1 text-sm font-medium capitalize text-ink">{meeting.summary_status}</p>
              </div>
            </div>
          </div>

          <div className="gre-card space-y-4 p-6">
            <h2 className="text-lg font-semibold text-ink">Host tools</h2>
            {!canManage ? (
              <p className="text-sm text-slate-500">
                Only the host or an admin can manage this meeting.
              </p>
            ) : (
              <div className="space-y-3">
                {meeting.status === "live" && (
                  <Link to={`/meet/${meeting.join_slug}`}>
                    <Button className="w-full" variant="secondary">
                      Open live room controls
                    </Button>
                  </Link>
                )}
                {meeting.recording_url && (
                  <a href={meeting.recording_url} target="_blank" rel="noreferrer">
                    <Button className="w-full" variant="secondary">
                      <ExternalLink className="h-4 w-4" />
                      Open recording
                    </Button>
                  </a>
                )}
                {isHost && meeting.status === "cancelled" && (
                  <p className="text-sm text-slate-500">
                    This meeting is cancelled. Create a new session if you want to reschedule it.
                  </p>
                )}
                {meeting.status === "live" && (
                  <p className="text-sm text-slate-500">
                    Recording, mute-all, participant removal, and end-for-everyone actions run
                    from the embedded Jitsi room.
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="gre-card space-y-5 p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-ink">Archive record</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Transcript messages
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{messageCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary status
              </p>
              <p className="mt-2 text-lg font-semibold capitalize text-ink">{meeting.summary_status}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recording status
              </p>
              <p className="mt-2 text-lg font-semibold capitalize text-ink">
                {meeting.recording_status}
              </p>
            </div>
          </div>

          {meeting.summary ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary preview
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {meeting.summary}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
              {meeting.status === "cancelled"
                ? "This meeting was cancelled before completion, so no archive summary will be generated."
                : meeting.status === "ended"
                ? "The meeting ended, but the archive summary is not ready yet."
                : "When the meeting ends, the archive page will show the full transcript, summary, and recording."}
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Archive entry
                </p>
                <p className="mt-1 text-base font-semibold text-ink">{archiveId}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Open a dedicated page to review all saved meeting messages.
                </p>
              </div>
              <Link to={`/dashboard/meetings/${meeting.id}/archive`}>
                <Button>
                  <MessagesSquare className="h-4 w-4" />
                  Open full archive
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="gre-card space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-ink">Participants</h2>
            </div>
            <div className="space-y-3">
              {(meeting.participants ?? []).map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <p className="font-semibold text-ink">
                    {participant.user?.full_name ||
                      `${participant.user?.firstname ?? ""} ${participant.user?.lastname ?? ""}`.trim() ||
                      participant.user?.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {participant.role} · {participant.invite_status}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {(meeting.publication || meeting.forum_topic) && (
            <div className="gre-card space-y-4 p-6">
              <h2 className="text-lg font-semibold text-ink">Related context</h2>
              {meeting.publication && (
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paper</p>
                  <p className="mt-1 font-semibold text-ink">{meeting.publication.title}</p>
                  <Button
                    className="mt-3"
                    variant="ghost"
                    onClick={() =>
                      navigate(
                        buildPublicationPath(
                          meeting.publication?.id,
                          meeting.publication?.encoded_id
                        )
                      )
                    }
                  >
                    Open publication
                  </Button>
                </div>
              )}
              {meeting.forum_topic && (
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Discussion
                  </p>
                  <p className="mt-1 font-semibold text-ink">{meeting.forum_topic.topic}</p>
                  <Button
                    className="mt-3"
                    variant="ghost"
                    onClick={() => navigate(`/forum/topic/${meeting.forum_topic?.id}`)}
                  >
                    Open discussion
                  </Button>
                </div>
              )}
            </div>
          )}
        </aside>
      </section>

      <ConfirmDialog
        open={confirmCancelOpen}
        title="Cancel this meeting?"
        description="Cancelled meetings do not create an archive and cannot be joined."
        confirmLabel="Cancel meeting"
        cancelLabel="Keep meeting"
        tone="danger"
        loading={cancelMeeting.isPending}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={() => {
          cancelMeeting.mutate();
          setConfirmCancelOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this cancelled meeting?"
        description="This will permanently remove the cancelled meeting and any saved participant or message data."
        confirmLabel="Delete meeting"
        cancelLabel="Keep meeting"
        tone="danger"
        loading={deleteCancelledMeeting.isPending}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          deleteCancelledMeeting.mutate();
          setConfirmDeleteOpen(false);
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
