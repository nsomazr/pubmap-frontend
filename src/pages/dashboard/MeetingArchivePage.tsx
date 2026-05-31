import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
import { useCanonicalMeetingUrl } from "../../hooks/useCanonicalMeetingUrl";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatDisplayTile } from "../../components/dashboard/StatDisplayTile";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Textarea } from "../../components/ui/Textarea";
import { useToast } from "../../components/ui/ToastProvider";
import { sanitizeManuscriptHtml } from "../../lib/sanitizeHtml";
import { MeetingReportEditor } from "../../components/meet/MeetingReportEditor";
import { MeetingReportGenerationProgress } from "../../components/meet/MeetingReportGenerationProgress";
import api, { parseApiError } from "../../lib/api";
import { MeetingArchiveParticipants } from "../../components/meet/MeetingArchiveParticipants";
import { MeetingArchiveTranscript } from "../../components/meet/MeetingArchiveTranscript";
import { MeetingGreAssistantPanel } from "../../components/meet/MeetingGreAssistantPanel";
import { MeetingReportPreview } from "../../components/meet/MeetingReportPreview";
import { buildMeetingPath, meetingApiSegment } from "../../lib/meetingPaths";
import { buildForumTopicPath } from "../../lib/forumPaths";
import {
  formatIsoTimestampsInText,
  meetReportToEditorHtml,
  pickMeetReportSource,
} from "../../lib/meetReportContent";
import {
  fetchMeeting,
  formatMeetingDate,
  formatMeetingId,
  formatMeetingDateInTimezone,
  generateMeetingReport,
  saveMeetingReport,
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
  const [reportSeeded, setReportSeeded] = useState(false);
  const [shareToAttendees, setShareToAttendees] = useState(true);
  const [extraEmails, setExtraEmails] = useState("");
  const lastReportSourceRef = useRef("");
  const autoGenerateTriedRef = useRef(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting-archive", id],
    queryFn: () => fetchMeeting(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.summary_status;
      if (status === "pending") return 2000;
      return false;
    },
  });

  useCanonicalMeetingUrl(meeting, "archive");

  const reportGenerating =
    meeting?.status === "ended" &&
    (meeting.summary_status === "pending" || meeting.summary_status === "none");

  const regenerateReport = useMutation({
    mutationFn: () => generateMeetingReport(meeting!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting-archive", id] });
      await queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Generating report",
        description: "GRE is rebuilding the meeting report from the archive.",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Could not start report generation",
        description: parseApiError(error, "Could not generate the meeting report."),
      });
    },
  });

  const saveReportDraft = useMutation({
    mutationFn: () => saveMeetingReport(meeting!.id, reportDraft.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting-archive", id] });
      await queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Report saved",
        description: "Your edits were saved to the archive.",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Could not save report",
        description: parseApiError(error, "Could not save the meeting report."),
      });
    },
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
      if (!meeting) throw new Error("Meeting is not loaded.");
      await api.delete(`/meetings/${meetingApiSegment(meeting)}/`);
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
    if (!meeting?.can_manage || meeting.status !== "ended" || meeting.summary_status !== "none") {
      return;
    }
    if (autoGenerateTriedRef.current) return;
    autoGenerateTriedRef.current = true;
    regenerateReport.mutate();
  }, [meeting?.can_manage, meeting?.id, meeting?.status, meeting?.summary_status]);

  useEffect(() => {
    if (!meeting) return;
    const source = pickMeetReportSource(meeting);
    const sourceKey = `${meeting.id}:${source}:${meeting.summary_status}`;
    if (!source) {
      if (meeting.summary_status !== "pending") {
        setReportDraft("");
        setReportSeeded(false);
      }
      return;
    }
    if (!reportSeeded || lastReportSourceRef.current !== sourceKey) {
      setReportDraft(meetReportToEditorHtml(source));
      setReportSeeded(true);
      lastReportSourceRef.current = sourceKey;
    }
  }, [meeting, reportSeeded]);

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

  const effectiveReport = reportDraft || meetReportToEditorHtml(pickMeetReportSource(meeting));
  const hasDraft = effectiveReport.replace(/<[^>]+>/g, " ").trim().length > 0;
  const reportReady = meeting.summary_status === "ready";
  const reportFailed = meeting.summary_status === "failed";

  const archiveId = formatMeetingId(meeting);
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
              to={buildMeetingPath(meeting)}
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

      <div className="space-y-6">
          <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
            <ArchiveSectionTitle icon={FileText} title="Meeting report" />
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assistant report (host edit before sharing)
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Status:{" "}
                      <span className="font-semibold capitalize text-ink">
                        {meeting.summary_status === "pending"
                          ? "generating"
                          : meeting.summary_status}
                      </span>
                    </p>
                  </div>
                  {meeting.status === "live" && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      End the meeting to generate the report
                    </span>
                  )}
                </div>

                {(reportGenerating || reportFailed) && (
                  <MeetingReportGenerationProgress
                    status={meeting.summary_status}
                    ended={meeting.status === "ended"}
                    messageCount={messageCount}
                    errorMessage={meeting.recording_error}
                    onRetry={() => regenerateReport.mutate()}
                    retrying={regenerateReport.isPending}
                  />
                )}

                <MeetingReportEditor
                  value={reportDraft}
                  onChange={setReportDraft}
                  disabled={reportGenerating}
                  placeholder={
                    reportGenerating
                      ? "Report will load here when generation completes…"
                      : "Write or edit the meeting report before sharing."
                  }
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
                    variant="secondary"
                    loading={saveReportDraft.isPending}
                    disabled={!hasDraft || reportGenerating}
                    onClick={() => saveReportDraft.mutate()}
                  >
                    Save draft
                  </Button>
                  <Button
                    loading={shareReport.isPending}
                    disabled={
                      !hasDraft ||
                      reportGenerating ||
                      (!shareToAttendees && !extraEmails.trim())
                    }
                    onClick={() => shareReport.mutate()}
                  >
                    <Send className="h-4 w-4" />
                    Share report now
                  </Button>
                  {meeting.status === "ended" && !reportGenerating && (
                    <Button
                      variant="ghost"
                      loading={regenerateReport.isPending}
                      onClick={() => regenerateReport.mutate()}
                    >
                      Regenerate
                    </Button>
                  )}
                  <p className="self-center text-xs text-slate-500">
                    Report is never sent automatically.
                  </p>
                </div>
                {hasDraft && reportReady && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Preview
                    </p>
                    <div
                      className="gre-rich text-sm leading-relaxed text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeManuscriptHtml(formatIsoTimestampsInText(effectiveReport)),
                      }}
                    />
                  </div>
                )}
              </div>
            ) : meeting.meeting_minutes || meeting.summary ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <MeetingReportPreview
                  content={meeting.meeting_minutes || meeting.summary || ""}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500 sm:p-5">
                {meeting.status === "ended"
                  ? "The meeting ended, but the archive summary is not ready yet."
                  : "The meeting is still active. The archive summary will appear here after it ends."}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                description="Everyone who joined or was invited."
              />
              <MeetingArchiveParticipants participants={meeting.participants ?? []} />
            </div>

            {(meeting.publication || meeting.forum_topic) && (
              <div className="gre-dashboard-card space-y-4 p-5 sm:p-6 md:col-span-2 xl:col-span-1">
                <ArchiveSectionTitle icon={FileText} title="Related context" />
                <div className="space-y-3">
                  {meeting.publication && (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Paper
                      </p>
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
                        onClick={() =>
                          meeting.forum_topic && navigate(buildForumTopicPath(meeting.forum_topic))
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start">
            <div className="gre-dashboard-card space-y-4 p-5 sm:p-6">
              <ArchiveSectionTitle
                icon={MessageCircle}
                title="Meeting transcript"
                description="Chronological conversation from the live room, grouped by speaker, not a flat list."
              />
              <MeetingArchiveTranscript messages={meeting.chat_messages ?? []} />
            </div>

            <div className="gre-dashboard-card flex flex-col gap-4 p-5 sm:p-6 xl:sticky xl:top-4">
              <ArchiveSectionTitle
                icon={Sparkles}
                title="Chat with GRE Assistant"
                description="Ask follow-up questions about the minutes, decisions, and transcript from this meeting."
              />
              <MeetingGreAssistantPanel meeting={meeting} variant="light" />
            </div>
          </div>
      </div>

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
