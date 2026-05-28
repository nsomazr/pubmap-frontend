import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatDisplayTile } from "../../components/dashboard/StatDisplayTile";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Textarea } from "../../components/ui/Textarea";
import { useToast } from "../../components/ui/ToastProvider";
import api, { parseApiError } from "../../lib/api";
import { MeetingArchiveParticipants } from "../../components/meet/MeetingArchiveParticipants";
import { MeetingArchiveTranscript } from "../../components/meet/MeetingArchiveTranscript";
import { MeetingGreAssistantPanel } from "../../components/meet/MeetingGreAssistantPanel";
import { FormattedAssistantText } from "../../lib/formatAssistantText";
import {
  fetchMeeting,
  formatMeetingDate,
  formatMeetingId,
  formatMeetingDateInTimezone,
  shareMeetingMinutes,
} from "../../lib/meetings";
import { buildPublicationPath } from "../../lib/publicationPaths";

function statusValueClass(status: string) {
  if (status === "live") return "text-teal-700";
  if (status === "ended") return "text-slate-700";
  if (status === "cancelled") return "text-red-700";
  return "text-ink";
}

function ArchiveSectionTitle({
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

export function MeetingArchivePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [reportDraft, setReportDraft] = useState("");
  const [shareToAttendees, setShareToAttendees] = useState(true);
  const [extraEmails, setExtraEmails] = useState("");

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting-archive", id],
    queryFn: () => fetchMeeting(id!),
    enabled: !!id,
  });

  const shareReport = useMutation({
    mutationFn: async () => {
      if (!meeting?.id) throw new Error("Meeting is unavailable.");
      const emails = Array.from(
        new Set(
          extraEmails
            .split(/[\n,;]+/)
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean)
        )
      );
      return shareMeetingMinutes(meeting.id, {
        report: reportDraft.trim(),
        include_attendees: shareToAttendees,
        emails,
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      await queryClient.invalidateQueries({ queryKey: ["meeting-archive", id] });
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success({
        title: "Report shared",
        description:
          data.failed > 0
            ? `${data.sent} sent, ${data.failed} failed.`
            : `${data.sent} report emails sent.`,
      });
    },
    onError: (error) => {
      toast.error({
        title: "Could not share report",
        description: parseApiError(error, "Could not share the meeting report."),
      });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async () => {
      await api.delete(`/meetings/${id}/`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.removeQueries({ queryKey: ["meeting", id] });
      queryClient.removeQueries({ queryKey: ["meeting-archive", id] });
      toast.success({
        title: "Archived meeting deleted",
        description: "The meeting archive and saved transcript were removed.",
      });
      navigate("/dashboard/meetings?scope=archived");
    },
    onError: (error) => {
      toast.error({
        title: "Could not delete archive",
        description: parseApiError(error, "Could not delete this archived meeting."),
      });
    },
  });

  useEffect(() => {
    if (!meeting) return;
    setReportDraft(meeting.meeting_minutes || meeting.summary || "");
  }, [meeting?.id, meeting?.meeting_minutes, meeting?.summary]);

  if (isLoading || !meeting) {
    return (
      <div className="animate-fade-up space-y-6">
        <div className="gre-skeleton h-24 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="gre-skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="gre-skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  const effectiveReport = reportDraft || meeting.meeting_minutes || meeting.summary || "";
  const hasDraft = effectiveReport.trim().length > 0;

  const archiveId = formatMeetingId(meeting.id);
  const messageCount = meeting.chat_messages?.length ?? 0;
  const participantCount = meeting.participants?.length ?? meeting.participant_count ?? 0;

  const downloadSummary = () => {
    const parts = [
      `${meeting.title} archive`,
      `Meeting ID: ${archiveId}`,
      `Status: ${meeting.status}`,
      `Scheduled: ${formatMeetingDate(meeting.scheduled_at)}`,
      `Ended: ${meeting.ended_at ? formatMeetingDate(meeting.ended_at) : "N/A"}`,
      "",
      "Summary",
      "-------",
      (meeting.summary || "Summary not available yet.").trim(),
      "",
      "Meeting minutes",
      "---------------",
      (meeting.meeting_minutes || meeting.summary || "Minutes not available yet.").trim(),
    ];
    const blob = new Blob([parts.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${archiveId.toLowerCase()}-summary.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success({
      title: "Summary downloaded",
      description: "The meeting summary was downloaded as a text file.",
    });
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title={`${meeting.title} archive`}
        description={`${archiveId} · ${meeting.category_name} / ${meeting.sub_category_name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/dashboard/meetings/${meeting.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to meeting
            </Link>
            <Button variant="secondary" onClick={downloadSummary}>
              <Download className="h-4 w-4" />
              Download summary
            </Button>
            {meeting.can_manage && (
              <Button
                variant="danger"
                loading={deleteMeeting.isPending}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete archive
              </Button>
            )}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatDisplayTile label="Meeting ID" value={archiveId} />
        <StatDisplayTile
          label="Status"
          value={meeting.status}
          valueClassName={`capitalize ${statusValueClass(meeting.status)}`}
        />
        <StatDisplayTile label="Messages" value={messageCount} />
        <StatDisplayTile label="Participants" value={participantCount} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
            <ArchiveSectionTitle icon={FileText} title="Archive summary" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scheduled
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {formatMeetingDateInTimezone(meeting.scheduled_at, meeting.scheduled_timezone)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ended
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {meeting.ended_at ? formatMeetingDate(meeting.ended_at) : "Meeting still active"}
                </p>
              </div>
            </div>

            {meeting.can_manage ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assistant report (host edit before sharing)
                </p>
                <Textarea
                  value={reportDraft}
                  onChange={(event) => setReportDraft(event.target.value)}
                  rows={10}
                  placeholder={meeting.meeting_minutes || meeting.summary || "Report will appear here after meeting ends."}
                />
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={shareToAttendees}
                    onChange={(event) => setShareToAttendees(event.target.checked)}
                  />
                  Share to attendees who joined
                </label>
                <Textarea
                  label="Add extra emails (optional)"
                  value={extraEmails}
                  onChange={(event) => setExtraEmails(event.target.value)}
                  rows={3}
                  placeholder={"name1@email.com\nname2@email.com"}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    loading={shareReport.isPending}
                    disabled={!hasDraft || (!shareToAttendees && !extraEmails.trim())}
                    onClick={() => shareReport.mutate()}
                  >
                    <Send className="h-4 w-4" />
                    Share report now
                  </Button>
                  <p className="self-center text-xs text-slate-500">
                    Report is never sent automatically.
                  </p>
                </div>
                {hasDraft && (
                  <div className="rounded-xl bg-white p-4 text-sm leading-relaxed text-slate-700">
                    <FormattedAssistantText content={effectiveReport} />
                  </div>
                )}
              </div>
            ) : meeting.meeting_minutes ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Full meeting minutes
                </p>
                <div className="mt-3 text-sm leading-relaxed text-slate-700">
                  <FormattedAssistantText content={meeting.meeting_minutes} />
                </div>
              </div>
            ) : meeting.summary ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {meeting.summary}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500 sm:p-5">
                {meeting.status === "ended"
                  ? "The meeting ended, but the archive summary is not ready yet."
                  : "The meeting is still active. The archive summary will appear here after it ends."}
              </div>
            )}
          </div>

          <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
            <ArchiveSectionTitle
              icon={MessageCircle}
              title="Meeting transcript"
              description="Chronological conversation from the live room — grouped by speaker, not a flat list."
            />
            <MeetingArchiveTranscript messages={meeting.chat_messages ?? []} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="gre-dashboard-card flex flex-col gap-4 p-5 sm:p-6">
            <ArchiveSectionTitle
              icon={Sparkles}
              title="Chat with GRE Assistant"
              description="Ask follow-up questions about the minutes, decisions, and transcript from this meeting."
            />
            <MeetingGreAssistantPanel meeting={meeting} variant="light" />
          </div>

          <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
            <ArchiveSectionTitle icon={Video} title="Recording" />
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

          <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
            <ArchiveSectionTitle
              icon={Users}
              title="Participants"
              description="Compact roster with search and grouped sections when the list grows."
            />
            <MeetingArchiveParticipants participants={meeting.participants ?? []} />
          </div>

          {(meeting.publication || meeting.forum_topic) && (
            <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
              <ArchiveSectionTitle icon={FileText} title="Related context" />
              {meeting.publication && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
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
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
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
        open={confirmDeleteOpen}
        title="Delete archived meeting?"
        description="This will permanently remove the archived meeting, saved messages, and related archive data."
        confirmLabel="Delete archive"
        cancelLabel="Keep archive"
        tone="danger"
        loading={deleteMeeting.isPending}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          deleteMeeting.mutate();
          setConfirmDeleteOpen(false);
        }}
      />
    </div>
  );
}
