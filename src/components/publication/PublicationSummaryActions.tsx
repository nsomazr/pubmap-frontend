import { Copy, RefreshCw, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { submitSummaryFeedback, type SummaryFeedbackRating } from "../../lib/assistant";
import { useToast } from "../ui/ToastProvider";

interface Props {
  publicationId: number;
  summary: string;
  publicationTitle?: string;
  publicationHref: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
  className?: string;
}

const actionClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

const feedbackClass = (active: boolean, tone: "up" | "down") =>
  `inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
    active
      ? tone === "up"
        ? "border-brand-300 bg-brand-50 text-brand-700"
        : "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
  }`;

export function PublicationSummaryActions({
  publicationId,
  summary,
  publicationTitle,
  publicationHref,
  onRegenerate,
  regenerating = false,
  className = "",
}: Props) {
  const toast = useToast();
  const [feedback, setFeedback] = useState<SummaryFeedbackRating | null>(null);
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  useEffect(() => {
    if (!summary.trim()) setFeedback(null);
  }, [summary]);

  const canNativeShare = useMemo(
    () => typeof navigator !== "undefined" && "share" in navigator,
    []
  );

  const copySummary = async () => {
    const text = summary.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success({
        title: "Summary copied",
        description: "The assistant summary is ready to paste.",
      });
    } catch {
      toast.error({
        title: "Could not copy summary",
        description: "Clipboard access was blocked. Select the text and copy manually.",
      });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicationHref);
      toast.success({
        title: "Link copied",
        description: "The publication link is ready to paste.",
      });
    } catch {
      toast.error({
        title: "Could not copy link",
        description: "Clipboard access was blocked. Copy the page URL manually.",
      });
    }
  };

  const shareSummary = async () => {
    if (!canNativeShare) return;
    const text = summary.trim();
    try {
      await navigator.share({
        title: publicationTitle || "GRE research summary",
        text: text ? `${text.slice(0, 500)}${text.length > 500 ? "…" : ""}` : undefined,
        url: publicationHref,
      });
    } catch {
      /* cancelled */
    }
  };

  const sendFeedback = async (rating: SummaryFeedbackRating) => {
    if (feedbackBusy) return;
    setFeedbackBusy(true);
    try {
      await submitSummaryFeedback(publicationId, rating, summary);
      setFeedback(rating);
      toast.success({
        title: rating === "up" ? "Thanks for the feedback" : "Feedback recorded",
        description: "This helps us improve GRE Assistant summaries.",
      });
    } catch {
      toast.error({
        title: "Could not save feedback",
        description: "Please try again in a moment.",
      });
    } finally {
      setFeedbackBusy(false);
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 ${className}`}
      role="toolbar"
      aria-label="Summary actions"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void copySummary()} className={actionClass}>
          <Copy className="h-3.5 w-3.5" />
          Copy summary
        </button>
        <button type="button" onClick={() => void copyLink()} className={actionClass}>
          <Copy className="h-3.5 w-3.5" />
          Copy link
        </button>
        {canNativeShare && (
          <button type="button" onClick={() => void shareSummary()} className={actionClass}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        )}
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className={actionClass}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">Was this helpful?</span>
        <button
          type="button"
          disabled={feedbackBusy || feedback === "up"}
          onClick={() => void sendFeedback("up")}
          className={feedbackClass(feedback === "up", "up")}
          aria-label="Like this summary"
          title="Helpful summary"
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={feedbackBusy || feedback === "down"}
          onClick={() => void sendFeedback("down")}
          className={feedbackClass(feedback === "down", "down")}
          aria-label="Dislike this summary"
          title="Not helpful"
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
