import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, LogOut, Radio, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { useToast } from "../ui/ToastProvider";
import { buildMeetingPath } from "../../lib/meetingPaths";
import { endMeetingSession } from "../../lib/meetings";
import api, { parseApiError } from "../../lib/api";
import { userFullName } from "../../lib/userDisplay";
import type { MeetSession } from "../../types";

type Props = {
  meeting: MeetSession;
  showAdminBadge?: boolean;
  compact?: boolean;
};

export function MeetingQuickActions({ meeting, showAdminBadge, compact }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const endMeeting = useMutation({
    mutationFn: () => endMeetingSession(meeting),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      await queryClient.invalidateQueries({ queryKey: ["meeting", meeting.encoded_id] });
      await queryClient.invalidateQueries({ queryKey: ["meeting", String(meeting.id)] });
      await queryClient.invalidateQueries({ queryKey: ["meeting-archive", meeting.encoded_id] });
      toast.success({
        title: "Meeting ended",
        description: "Archive report generation has started.",
      });
      navigate(buildMeetingPath(meeting, "archive"));
    },
    onError: (error) => {
      toast.error({
        title: "Could not end meeting",
        description: parseApiError(error, "Could not end this meeting."),
      });
    },
  });

  const isArchived = meeting.status === "ended";
  const isCancelled = meeting.status === "cancelled";
  const isLive = meeting.status === "live";
  const hasReport = Boolean(
    meeting.meeting_minutes?.trim() || meeting.summary?.trim() || meeting.minutes_email_sent_at
  );

  if (!meeting.can_manage && !meeting.can_join) {
    return null;
  }

  const btnClass = compact ? "!px-2.5 !py-1.5 text-[11px]" : "!px-3 !py-2 text-xs";

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      {showAdminBadge && meeting.host && (
        <p className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-violet-700">
          <Shield className="h-3.5 w-3.5" aria-hidden />
          Host: {userFullName(meeting.host)}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {!isArchived && !isCancelled && meeting.can_join && (
          <Link to={`/meet/${meeting.join_slug}`}>
            <Button className={btnClass}>
              <Radio className="h-3.5 w-3.5" />
              Join
            </Button>
          </Link>
        )}
        {isArchived && (
          <Link to={buildMeetingPath(meeting, "archive")}>
            <Button variant={hasReport ? "primary" : "secondary"} className={btnClass}>
              <FileText className="h-3.5 w-3.5" />
              {hasReport ? "Report" : "Archive"}
            </Button>
          </Link>
        )}
        {!isArchived && (
          <Link to={buildMeetingPath(meeting)}>
            <Button variant="secondary" className={btnClass}>
              Details
            </Button>
          </Link>
        )}
        {meeting.can_manage && isLive && (
          <Button
            variant="danger"
            className={btnClass}
            loading={endMeeting.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `End "${meeting.title}" for everyone? The host and attendees will leave the live room.`
                )
              ) {
                endMeeting.mutate();
              }
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            End
          </Button>
        )}
        {meeting.can_manage && isArchived && (
          <Link to={buildMeetingPath(meeting, "archive")}>
            <Button variant="secondary" className={btnClass}>
              Manage report
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

/** Admin-only: fetch live meetings count for dashboard badge. */
export async function fetchAdminLiveMeetingsCount(): Promise<number> {
  const { data } = await api.get<{ count?: number; results?: unknown[] }>("/meetings/", {
    params: { scope: "live", page: 1, page_size: 1 },
  });
  if (typeof data === "object" && data && "count" in data) {
    return Number(data.count) || 0;
  }
  return Array.isArray(data) ? data.length : 0;
}
