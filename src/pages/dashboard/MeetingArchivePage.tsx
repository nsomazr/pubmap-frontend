import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileText, MessagesSquare, Users, Video } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { fetchMeeting, formatMeetingDate, formatMeetingId } from "../../lib/meetings";
import { buildPublicationPath } from "../../lib/publicationPaths";

function formatMessageTime(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function MeetingArchivePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting-archive", id],
    queryFn: () => fetchMeeting(id!),
    enabled: !!id,
  });

  if (isLoading || !meeting) {
    return <div className="gre-skeleton h-72 rounded-2xl" />;
  }

  const archiveId = formatMeetingId(meeting.id);
  const messageCount = meeting.chat_messages?.length ?? 0;
  const participantCount = meeting.participants?.length ?? meeting.participant_count ?? 0;

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title={`${meeting.title} archive`}
        description={`${archiveId} · ${meeting.category_name} / ${meeting.sub_category_name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/dashboard/meetings/${meeting.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to meeting
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="gre-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting ID</p>
          <p className="mt-2 text-base font-semibold text-ink">{archiveId}</p>
        </div>
        <div className="gre-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-2 text-base font-semibold capitalize text-ink">{meeting.status}</p>
        </div>
        <div className="gre-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Messages</p>
          <p className="mt-2 text-base font-semibold text-ink">{messageCount}</p>
        </div>
        <div className="gre-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Participants</p>
          <p className="mt-2 text-base font-semibold text-ink">{participantCount}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="gre-card space-y-4 p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-ink">Archive summary</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scheduled
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {formatMeetingDate(meeting.scheduled_at)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ended
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {meeting.ended_at ? formatMeetingDate(meeting.ended_at) : "Meeting still active"}
                </p>
              </div>
            </div>

            {meeting.summary ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {meeting.summary}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                {meeting.status === "ended"
                  ? "The meeting ended, but the archive summary is not ready yet."
                  : "The meeting is still active. The archive summary will appear here after it ends."}
              </div>
            )}
          </div>

          <div className="gre-card space-y-4 p-6">
            <div className="flex items-center gap-2">
              <MessagesSquare className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-ink">Message transcript</h2>
            </div>
            {messageCount === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                No archived messages yet.
              </div>
            ) : (
              <div className="space-y-3">
                {meeting.chat_messages?.map((message, index) => (
                  <article
                    key={message.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {message.sender?.full_name ||
                            `${message.sender?.firstname ?? ""} ${message.sender?.lastname ?? ""}`.trim() ||
                            message.sender?.email ||
                            "Participant"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Message {index + 1} · {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                        {message.message_type}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                      {message.message}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="gre-card space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-ink">Recording</h2>
            </div>
            {meeting.recording_url ? (
              <>
                <video controls className="w-full rounded-2xl bg-black">
                  <source src={meeting.recording_url} />
                </video>
                <a href={meeting.recording_url} target="_blank" rel="noreferrer">
                  <Button className="w-full" variant="secondary">
                    <ExternalLink className="h-4 w-4" />
                    Open recording
                  </Button>
                </a>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                {meeting.recording_status === "ready"
                  ? "Recording is marked ready, but no URL is available yet."
                  : "No recording is attached to this archive yet."}
              </p>
            )}
          </div>

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
    </div>
  );
}
