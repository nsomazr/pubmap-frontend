import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink, Radio, Video } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { fetchMeeting, formatMeetingDate, MEETING_TYPE_LABELS, MEETING_VISIBILITY_LABELS } from "../../lib/meetings";
import { buildPublicationPath } from "../../lib/publicationPaths";

export function MeetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => fetchMeeting(id!),
    enabled: !!id,
  });

  const startMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${id}/start/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meeting", id] }),
  });

  const endMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${id}/end/`, { host_notes: meeting?.host_notes || "" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meeting", id] }),
  });

  const canManage = !!meeting?.can_manage;
  const isHost = meeting?.host_id === user?.id;

  const copyLink = async () => {
    if (!meeting?.meeting_link) return;
    try {
      await navigator.clipboard.writeText(meeting.meeting_link);
    } catch {
      window.prompt("Copy meeting link", meeting.meeting_link);
    }
  };

  if (isLoading || !meeting) {
    return <div className="gre-skeleton h-72 rounded-2xl" />;
  }

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title={meeting.title}
        description={`${MEETING_TYPE_LABELS[meeting.meeting_type]} · ${meeting.category_name} / ${meeting.sub_category_name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/meetings" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="gre-card space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
              {meeting.status}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              {MEETING_VISIBILITY_LABELS[meeting.visibility]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1">
              {meeting.participant_count ?? 0} participant{(meeting.participant_count ?? 0) === 1 ? "" : "s"}
            </span>
          </div>

          {meeting.description && (
            <p className="text-sm leading-relaxed text-slate-600">{meeting.description}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
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
            {canManage && meeting.status === "live" && (
              <Button variant="danger" loading={endMeeting.isPending} onClick={() => endMeeting.mutate()}>
                End meeting
              </Button>
            )}
          </div>

          {(meeting.recording_status !== "none" || meeting.summary_status !== "none") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recording</p>
                <p className="mt-2 text-sm text-ink">{meeting.recording_status}</p>
                {meeting.recording_error && (
                  <p className="mt-2 text-xs text-red-600">{meeting.recording_error}</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                <p className="mt-2 text-sm text-ink">{meeting.summary_status}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="gre-card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-ink">Host controls</h2>
          {!canManage ? (
            <p className="text-sm text-slate-500">Only the host or an admin can manage this meeting.</p>
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
                  Recording, mute-all, participant removal, and end-for-everyone actions run from the embedded Jitsi room.
                </p>
              )}
            </div>
          )}
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="gre-card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-ink">Meeting archive</h2>
          {meeting.summary ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{meeting.summary}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {meeting.status === "ended"
                ? "Summary generation has not completed yet."
                : "The archive summary will appear here after the meeting ends."}
            </p>
          )}

          {meeting.recording_url && (
            <div className="space-y-3">
              <h3 className="font-semibold text-ink">Recording</h3>
              <video controls className="w-full rounded-2xl bg-black">
                <source src={meeting.recording_url} />
              </video>
            </div>
          )}

          {!!meeting.chat_messages?.length && (
            <div className="space-y-3">
              <h3 className="font-semibold text-ink">Archived chat</h3>
              <div className="space-y-2">
                {meeting.chat_messages.map((message) => (
                  <div key={message.id} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {message.sender?.full_name ||
                        `${message.sender?.firstname ?? ""} ${message.sender?.lastname ?? ""}`.trim() ||
                        message.sender?.email}
                      {" · "}
                      {message.message_type}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{message.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="gre-card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-ink">Participants</h2>
          <div className="space-y-3">
            {(meeting.participants ?? []).map((participant) => (
              <div key={participant.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
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

          {(meeting.publication || meeting.forum_topic) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-ink">Related context</h3>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Discussion</p>
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
    </div>
  );
}
