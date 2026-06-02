import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  GET_PUBLICATION_SUMMARY_LABEL,
  buildPublicationChatPath,
} from "../../lib/publicationChat";
import { requestPublicationSummary } from "../map/publicationPopupSummary";

interface Props {
  publicationId: number;
  encodedPublicationId?: string | null;
  className?: string;
}

export function PublicationSummaryButton({
  publicationId,
  encodedPublicationId,
  className = "",
}: Props) {
  const chatPath = buildPublicationChatPath(publicationId, encodedPublicationId);

  return (
    <Link
      to={chatPath}
      onClick={(event) => {
        event.preventDefault();
        requestPublicationSummary(publicationId, encodedPublicationId);
      }}
      className={`gre-interactive inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-800 ${className}`.trim()}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
      {GET_PUBLICATION_SUMMARY_LABEL}
    </Link>
  );
}
