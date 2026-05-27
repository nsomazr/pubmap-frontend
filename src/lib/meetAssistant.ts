import api from "./api";

export type MeetingAssistantTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function askMeetingAssistant(
  meetingId: number,
  question: string,
  history: MeetingAssistantTurn[] = []
) {
  const { data } = await api.post<{ answer: string }>(`/meetings/${meetingId}/assistant-ask/`, {
    question,
    history,
  });
  return data.answer;
}

export async function captureMeetingAssistantNotes(meetingId: number) {
  const { data } = await api.post<{ assistant_notes: string }>(
    `/meetings/${meetingId}/assistant-capture/`
  );
  return data.assistant_notes;
}
