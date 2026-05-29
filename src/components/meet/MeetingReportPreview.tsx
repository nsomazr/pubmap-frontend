import { FormattedAssistantText } from "../../lib/formatAssistantText";
import { formatIsoTimestampsInText } from "../../lib/meetReportContent";
import { sanitizeManuscriptHtml } from "../../lib/sanitizeHtml";

type Props = {
  content: string;
  className?: string;
};

/** Render stored meeting report (HTML or markdown/plain) for archive readers. */
export function MeetingReportPreview({ content, className = "" }: Props) {
  const raw = (content || "").trim();
  if (!raw) return null;

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(raw);
  if (looksLikeHtml) {
    return (
      <div
        className={`gre-rich text-sm leading-relaxed text-slate-700 ${className}`}
        dangerouslySetInnerHTML={{
          __html: sanitizeManuscriptHtml(formatIsoTimestampsInText(raw)),
        }}
      />
    );
  }

  return (
    <FormattedAssistantText
      content={formatIsoTimestampsInText(raw)}
      className={`text-slate-700 ${className}`}
    />
  );
}
