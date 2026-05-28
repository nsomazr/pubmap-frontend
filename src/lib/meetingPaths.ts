import type { MeetSession } from "../types";

type MeetingLike = Pick<MeetSession, "id" | "encoded_id"> | number | string;

export function meetingRef(meeting: MeetingLike, encodedId?: string | null): string {
  if (typeof meeting === "object") {
    const encoded = (meeting.encoded_id || encodedId || "").trim();
    if (encoded) return encoded;
    return String(meeting.id);
  }
  if (encodedId?.trim()) return encodedId.trim();
  return String(meeting);
}

export function buildMeetingPath(
  meeting: MeetingLike,
  suffix?: "archive" | "edit",
  encodedId?: string | null
): string {
  const ref = meetingRef(meeting, encodedId);
  const base = `/dashboard/meetings/${ref}`;
  if (suffix === "archive") return `${base}/archive`;
  if (suffix === "edit") return `${base}/edit`;
  return base;
}

/** API path segment for meeting detail actions (accepts encoded or legacy integer). */
export function meetingApiSegment(meeting: MeetingLike): string {
  if (typeof meeting === "object") return meetingRef(meeting);
  return String(meeting);
}
