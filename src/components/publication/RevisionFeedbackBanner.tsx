import { AlertCircle, CheckCircle2, Clock, MessageSquareWarning } from "lucide-react";
import { useMemo, useState } from "react";
import { setRevisionCommentAddressed } from "../../lib/publicationGre";
import type { PublicationComment } from "../../types";

interface Props {
  comments: PublicationComment[];
  publicationId: number | string;
  encodedPublicationId?: string | null;
  /** When true, show a short prompt even if the comment list is empty. */
  revisionRequested?: boolean;
  onCommentsChange?: () => void;
}

function formatCommentDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isAddressed(comment: PublicationComment): boolean {
  return Boolean(
    comment.is_addressed ||
      comment.marked_addressed_at ||
      comment.resolved_on_resubmit_at
  );
}

function statusLabel(comment: PublicationComment): string | null {
  const resolved = formatCommentDate(comment.resolved_on_resubmit_at);
  if (comment.resolved_on_resubmit_at && resolved) {
    return `Addressed when you resubmitted · ${resolved}`;
  }
  const marked = formatCommentDate(comment.marked_addressed_at);
  if (comment.marked_addressed_at && marked) {
    return `Marked addressed · ${marked}`;
  }
  return null;
}

function CommentCard({
  comment,
  noteLabel,
  tone,
  publicationId,
  encodedPublicationId,
  onUpdated,
}: {
  comment: PublicationComment;
  noteLabel: string;
  tone: "open" | "done";
  publicationId: number | string;
  encodedPublicationId?: string | null;
  onUpdated?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const when = formatCommentDate(comment.created_at);
  const addressed = isAddressed(comment);
  const locked = Boolean(comment.resolved_on_resubmit_at);
  const status = statusLabel(comment);

  const toggleAddressed = async (next: boolean) => {
    if (locked || busy) return;
    setError("");
    setBusy(true);
    try {
      await setRevisionCommentAddressed(
        publicationId,
        comment.id,
        next,
        encodedPublicationId
      );
      onUpdated?.();
    } catch {
      setError("Could not update this note. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className={`rounded-xl border px-4 py-3.5 text-sm leading-relaxed shadow-sm ${
        tone === "open"
          ? "border-amber-200 bg-white text-amber-950 ring-1 ring-amber-100/80"
          : "border-slate-200/90 bg-slate-50/90 text-slate-700"
      }`}
    >
      <div className="flex gap-3">
        {!locked ? (
          <label className="mt-0.5 flex shrink-0 cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              className={`mt-0.5 h-4 w-4 rounded focus:ring-brand-500 ${
                tone === "open"
                  ? "border-amber-300 text-brand-600"
                  : "border-slate-300 text-teal-600"
              }`}
              checked={addressed}
              disabled={busy}
              onChange={(e) => void toggleAddressed(e.target.checked)}
            />
            <span className="sr-only">
              {addressed ? "Mark note as not addressed" : "Mark note as addressed"}
            </span>
          </label>
        ) : (
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-teal-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            {tone === "open" ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
            )}
            <span className={tone === "open" ? "text-amber-800/90" : "text-slate-600"}>
              {noteLabel}
            </span>
            {comment.revision_round ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal ${
                  tone === "open"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                Request #{comment.revision_round}
              </span>
            ) : null}
            {when ? (
              <span className="inline-flex items-center gap-1 font-normal normal-case text-slate-500">
                <Clock className="h-3 w-3" aria-hidden />
                {when}
              </span>
            ) : null}
          </div>
          <p className="whitespace-pre-wrap">{comment.comment}</p>
          {status ? (
            <p className="mt-2 text-xs font-medium text-teal-800/90">{status}</p>
          ) : null}
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </li>
  );
}

export function RevisionFeedbackBanner({
  comments,
  publicationId,
  encodedPublicationId,
  revisionRequested,
  onCommentsChange,
}: Props) {
  const { openComments, addressedComments, currentRound } = useMemo(() => {
    const open: PublicationComment[] = [];
    const addressed: PublicationComment[] = [];
    for (const comment of comments) {
      if (isAddressed(comment)) addressed.push(comment);
      else open.push(comment);
    }
    const round = open.length
      ? Math.max(...open.map((c) => c.revision_round ?? 1))
      : addressed.length
        ? Math.max(...addressed.map((c) => c.revision_round ?? 1))
        : 0;
    return {
      openComments: open,
      addressedComments: addressed,
      currentRound: round,
    };
  }, [comments]);

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
          <h2 id="revision-feedback-heading" className="text-base font-semibold text-amber-950">
            Admin revision feedback
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
            Mark each note when you have addressed it. On{" "}
            <strong>Review &amp; resubmit</strong>, open notes are recorded as addressed in your
            resubmission.
          </p>
          {hasComments ? (
            <p className="mt-2 text-xs font-semibold text-amber-900/85">
              {openComments.length > 0
                ? `${openComments.length} note${openComments.length === 1 ? "" : "s"} still need attention`
                : "All notes are marked or were resolved in a prior resubmission"}
              {addressedComments.length > 0
                ? ` · ${addressedComments.length} addressed`
                : ""}
              {currentRound > 0 ? ` · latest request #${currentRound}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {openComments.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Needs your attention
          </h3>
          <ul className="mt-2 space-y-3">
            {openComments.map((comment, index) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                noteLabel={`Note ${openComments.length > 1 ? index + 1 : ""}`.trim()}
                tone="open"
                publicationId={publicationId}
                encodedPublicationId={encodedPublicationId}
                onUpdated={onCommentsChange}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {addressedComments.length > 0 ? (
        <div className={openComments.length > 0 ? "mt-5 border-t border-amber-200/80 pt-4" : "mt-4"}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Addressed notes
          </h3>
          <ul className="mt-2 space-y-3">
            {addressedComments.map((comment, index) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                noteLabel={`Note ${addressedComments.length > 1 ? index + 1 : ""}`.trim()}
                tone="done"
                publicationId={publicationId}
                encodedPublicationId={encodedPublicationId}
                onUpdated={onCommentsChange}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {!hasComments && revisionRequested ? (
        <p className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white/70 px-4 py-3 text-sm text-amber-900/85">
          Revision was requested. If you do not see notes here, check your email or contact the
          review team before resubmitting.
        </p>
      ) : null}
    </section>
  );
}

export function countOpenRevisionComments(comments: PublicationComment[]): number {
  return comments.filter((c) => !isAddressed(c)).length;
}
