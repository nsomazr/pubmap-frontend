import { renderManuscriptHtml } from "./renderManuscriptHtml";

/** Convert stored summary/minutes (markdown or HTML) into CKEditor HTML. */
export function meetReportToEditorHtml(content?: string | null): string {
  const raw = (content || "").trim();
  if (!raw) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw;
  }
  return renderManuscriptHtml(raw);
}

/** Pick the best available draft source for the host report editor. */
export function pickMeetReportSource(meeting: {
  meeting_minutes?: string | null;
  summary?: string | null;
}): string {
  return (meeting.meeting_minutes || meeting.summary || "").trim();
}
