import api, { parseApiError } from "./api";
import type {
  MeetChatMessage,
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

export function formatMeetingDate(date?: string | null) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date;
  }
}

export async function fetchMeetings(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<MeetSession[] | { results: MeetSession[] }>("/meetings/", { params });
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function fetchMeeting(id: string | number) {
  const { data } = await api.get<MeetSession>(`/meetings/${id}/`);
  return data;
}

export async function fetchMeetingBySlug(slug: string) {
  const { data } = await api.get<MeetSession>(`/meetings/by-slug/${slug}/`);
  return data;
}

export async function joinMeetingRoom(id: number) {
  const { data } = await api.post<MeetRoomJoinResponse>(`/meetings/${id}/join-token/`);
  return data;
}

export async function fetchMeetingParticipants(id: number) {
  const { data } = await api.get<MeetParticipant[]>(`/meetings/${id}/participants/`);
  return data;
}

export async function fetchMeetingChat(id: number) {
  const { data } = await api.get<MeetChatMessage[]>(`/meetings/${id}/chat/`);
  return data;
}

export function meetingError(error: unknown, fallback: string) {
  return parseApiError(error, fallback);
}
