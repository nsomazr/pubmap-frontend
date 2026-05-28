import api, { parseApiError } from "./api";
import { meetingApiSegment } from "./meetingPaths";
import { unwrapPaginated, type Paginated } from "./pagination";
import type {
  MeetChatMessage,
  MeetInviteStatus,
  MeetParticipant,
  MeetRoomJoinResponse,
  MeetSession,
  MeetSessionType,
  MeetVisibility,
} from "../types";

export const MEETING_TYPE_LABELS: Record<MeetSessionType, string> = {
  research_discussion: "Research discussion",
  paper_presentation: "Paper presentation",
  workshop: "Workshop",
  institutional_meeting: "Institutional meeting",
  reviewer_session: "Reviewer session",
};

export const MEETING_VISIBILITY_LABELS: Record<MeetVisibility, string> = {
  authenticated_private: "GRE members with the link",
  public: "Public",
  invite_only: "Invite only",
};

import { formatTimezoneLabel, GRE_MEETING_TIMEZONE } from "./meetTimezones";

export { GRE_MEETING_TIMEZONE } from "./meetTimezones";

/** @deprecated Use formatTimezoneLabel(meeting.scheduled_timezone) instead. */
export const GRE_MEETING_TIMEZONE_LABEL = "GMT+3";

export function formatMeetingDate(date?: string | null, timeZone?: string | null) {
  if (!date) return "";
  try {
    const tz = (timeZone || "").trim() || GRE_MEETING_TIMEZONE;
    return new Date(date).toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    });
  } catch {
    return date;
  }
}

export function formatMeetingDateInTimezone(date?: string | null, timeZone?: string | null) {
  if (!date) return "";
  try {
    const tz = (timeZone || "").trim() || GRE_MEETING_TIMEZONE;
    return formatMeetingDate(date, tz);
  } catch {
    return date;
  }
}

export function formatMeetingScheduleLines(date?: string | null, timeZone?: string | null) {
  const tz = (timeZone || "").trim() || GRE_MEETING_TIMEZONE;
  if (!date) return { when: "", zone: formatTimezoneLabel(tz), iana: tz };
  try {
    const when = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    }).format(new Date(date));
    return { when, zone: formatTimezoneLabel(tz), iana: tz };
  } catch {
    return { when: date, zone: formatTimezoneLabel(tz), iana: tz };
  }
}

export function formatMeetingId(
  meeting?: Pick<MeetSession, "id" | "encoded_id"> | number | null
) {
  if (meeting == null) return "";
  if (typeof meeting === "object") {
    return meeting.encoded_id?.trim() || (meeting.id ? String(meeting.id) : "");
  }
  return String(meeting);
}

export async function fetchMeetings(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get("/meetings/", { params });
  return unwrapPaginated<MeetSession>(data as MeetSession[] | Paginated<MeetSession>);
}

export async function fetchMeeting(id: string | number) {
  const { data } = await api.get<MeetSession>(`/meetings/${meetingApiSegment(id)}/`);
  return data;
}

export async function fetchMeetingBySlug(slug: string) {
  const { data } = await api.get<MeetSession>(`/meetings/by-slug/${slug}/`);
  return data;
}

export async function joinMeetingRoom(id: string | number) {
  const { data } = await api.post<MeetRoomJoinResponse>(`/meetings/${meetingApiSegment(id)}/join-token/`);
  return data;
}

export async function fetchMeetingParticipants(id: string | number) {
  const { data } = await api.get<MeetParticipant[]>(`/meetings/${meetingApiSegment(id)}/participants/`);
  return data;
}

export async function inviteMeetingByEmail(
  meetingId: string | number,
  payload: { email: string; message?: string; role?: "speaker" | "participant" }
) {
  const { data } = await api.post<{ detail: string; email: string; user_found: boolean }>(
    `/meetings/${meetingApiSegment(meetingId)}/invite-email/`,
    payload
  );
  return data;
}

export async function inviteMeetingByEmailBulk(
  meetingId: string | number,
  payload: { emails: string[]; message?: string; role?: "speaker" | "participant" }
) {
  const uniqueEmails = Array.from(
    new Set(
      (payload.emails || [])
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
  const results = await Promise.allSettled(
    uniqueEmails.map((email) =>
      inviteMeetingByEmail(meetingId, {
        email,
        message: payload.message,
        role: payload.role,
      })
    )
  );
  const sent = results.filter((row) => row.status === "fulfilled").length;
  const failed = results.length - sent;
  return { total: results.length, sent, failed };
}

export async function inviteMeetingFieldMembers(
  meetingId: string | number,
  payload?: { message?: string; role?: "speaker" | "participant"; limit?: number }
) {
  const { data } = await api.post<{
    detail: string;
    invited_count: number;
    already_invited_count: number;
    subfield?: string | null;
  }>(`/meetings/${meetingApiSegment(meetingId)}/invite-field-members/`, payload || {});
  return data;
}

export async function respondMeetingInvite(
  meetingId: string | number,
  response: "accept" | "decline"
) {
  const { data } = await api.post<{ detail: string; invite_status: MeetInviteStatus; calendar_url?: string }>(
    `/meetings/${meetingApiSegment(meetingId)}/respond-invite/`,
    { response }
  );
  return data;
}

export function meetingCalendarDownloadUrl(meetingId: string | number) {
  return `${api.defaults.baseURL}/meetings/${meetingApiSegment(meetingId)}/calendar/`;
}

export async function fetchMeetingChat(id: string | number) {
  const { data } = await api.get<MeetChatMessage[]>(`/meetings/${meetingApiSegment(id)}/chat/`);
  return data;
}

export async function shareMeetingMinutes(
  meetingId: string | number,
  payload: { report: string; include_attendees?: boolean; emails?: string[] }
) {
  const { data } = await api.post<{
    detail: string;
    sent: number;
    failed: number;
    extra_emails_added: number;
  }>(`/meetings/${meetingApiSegment(meetingId)}/share-minutes/`, payload);
  return data;
}

export function meetingError(error: unknown, fallback: string) {
  return parseApiError(error, fallback);
}
