import { AlertCircle, MessageSquareWarning } from "lucide-react";
import type { PublicationComment } from "../../types";

interface Props {
  comments: PublicationComment[];
  /** When true, show a short prompt even if the comment list is empty. */
  revisionRequested?: boolean;
}

function formatCommentDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RevisionFeedbackBanner({ comments, revisionRequested }: Props) {
  const hasComments = comments.length > 0;
  if (!hasComments && !revisionRequested) return null;

  return (
    <section
      id="feedback"
      className="scroll-mt-24 rounded-2xl border border-amber-300/90 bg-gradient-to-br from-amber-50 to-orange-50/80 p-5 shadow-sm ring-1 ring-amber-200/80"
      aria-labelledby="revision-feedback-heading"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/90">
          <MessageSquareWarning className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="revision-feedback-heading"
            className="text-base font-semibold text-amber-950"
          >
            Admin revision feedback
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
            Address the notes below, update your submission in the editor, then use{" "}
            <strong>Review &amp; resubmit</strong> when you are ready.
          </p>
        </div>
      </div>

      {hasComments ? (
        <ul className="mt-4 space-y-3">
          {comments.map((comment, index) => {
            const when = formatCommentDate(comment.created_at);
            return (
              <li
                key={comment.id}
                className="rounded-xl border border-amber-100/90 bg-white/90 px-4 py-3.5 text-sm leading-relaxed text-amber-950 shadow-sm"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800/90">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>Note {comments.length > 1 ? index + 1 : ""}</span>
                  {when ? <span className="font-normal normal-case text-amber-700/80">{when}</span> : null}
                </div>
                <p className="whitespace-pre-wrap">{comment.comment}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white/70 px-4 py-3 text-sm text-amber-900/85">
          Revision was requested. If you do not see notes here, check your email or contact the
          review team before resubmitting.
        </p>
      )}
    </section>
  );
}
