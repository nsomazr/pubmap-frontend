import { Copy, Link2, RefreshCw, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
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

const iconBtn =
  "gre-interactive inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

const feedbackBtn = (active: boolean, tone: "up" | "down") =>
  `${iconBtn} ${
    active
      ? tone === "up"
        ? "bg-brand-50 text-brand-700"
        : "bg-red-50 text-red-700"
      : ""
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
      toast.success({ title: "Copied" });
    } catch {
      toast.error({ title: "Copy failed" });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicationHref);
      toast.success({ title: "Link copied" });
    } catch {
      toast.error({ title: "Copy failed" });
    }
  };

  const shareSummary = async () => {
    if (!canNativeShare) return;
    const text = summary.trim();
    try {
      await navigator.share({
        title: publicationTitle || "Research summary",
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
    } catch {
      toast.error({ title: "Feedback failed" });
    } finally {
      setFeedbackBusy(false);
    }
  };

  return (
    <div
      className={`mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 ${className}`}
      role="toolbar"
      aria-label="Summary actions"
    >
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => void copySummary()}
          className={iconBtn}
          aria-label="Copy summary"
          title="Copy summary"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className={iconBtn}
          aria-label="Copy link"
          title="Copy link"
        >
          <Link2 className="h-4 w-4" />
        </button>
        {canNativeShare ? (
          <button
            type="button"
            onClick={() => void shareSummary()}
            className={iconBtn}
            aria-label="Share"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        ) : null}
        {onRegenerate ? (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className={iconBtn}
            aria-label="Regenerate summary"
            title="Regenerate"
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={feedbackBusy || feedback === "up"}
          onClick={() => void sendFeedback("up")}
          className={feedbackBtn(feedback === "up", "up")}
          aria-label="Helpful"
          title="Helpful"
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={feedbackBusy || feedback === "down"}
          onClick={() => void sendFeedback("down")}
          className={feedbackBtn(feedback === "down", "down")}
          aria-label="Not helpful"
          title="Not helpful"
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
