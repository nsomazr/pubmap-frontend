import { renderManuscriptHtml } from "./renderManuscriptHtml";

const ISO_TIMESTAMP =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g;

/** Replace raw ISO timestamps in report text with a readable locale string. */
export function formatIsoTimestampsInText(text: string): string {
  return text.replace(ISO_TIMESTAMP, (match) => {
    const parsed = new Date(match);
    if (Number.isNaN(parsed.getTime())) return match;
    return parsed.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  });
}

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
