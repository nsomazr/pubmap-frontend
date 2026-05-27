import { Copy, RefreshCw, Share2 } from "lucide-react";
import { useMemo } from "react";
import { useToast } from "../ui/ToastProvider";

interface Props {
  summary: string;
  publicationTitle?: string;
  publicationHref: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
  className?: string;
}

const actionClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

export function PublicationSummaryActions({
  summary,
  publicationTitle,
  publicationHref,
  onRegenerate,
  regenerating = false,
  className = "",
}: Props) {
  const toast = useToast();
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

  return (
    <div
      className={`flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 ${className}`}
      role="toolbar"
      aria-label="Summary actions"
    >
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
  );
}
