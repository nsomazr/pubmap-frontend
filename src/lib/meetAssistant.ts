import api from "./api";
import { meetingApiSegment } from "./meetingPaths";
import type { MeetSession } from "../types";

export type MeetingAssistantTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function askMeetingAssistant(
  meetingId: number | string | Pick<MeetSession, "id" | "encoded_id">,
  question: string,
  history: MeetingAssistantTurn[] = []
) {
  const { data } = await api.post<{ answer: string }>(
    `/meetings/${meetingApiSegment(meetingId)}/assistant-ask/`,
    {
    question,
    history,
  });
  return data.answer;
}

export async function captureMeetingAssistantNotes(
  meetingId: number | string | Pick<MeetSession, "id" | "encoded_id">
) {
  const { data } = await api.post<{ assistant_notes: string }>(
    `/meetings/${meetingApiSegment(meetingId)}/assistant-capture/`
  );
  return data.assistant_notes;
}
