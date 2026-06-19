import { Download, MessageSquare, ScrollText, Share2 } from "lucide-react";
import { summaryPdfUrl } from "../../lib/publicationGre";
import { buildPublicationPath } from "../../lib/publicationPaths";

interface Props {
  publicationId: number;
  encodedId?: string | null;
  publicationTitle?: string;
}

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PublicationMobileActionBar({
  publicationId,
  encodedId,
  publicationTitle,
}: Props) {
  const downloadHref = summaryPdfUrl(publicationId, { encodedId });

  const handleShare = async () => {
    const url = `${window.location.origin}${buildPublicationPath(publicationId, encodedId)}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: publicationTitle || "GRE publication",
          url,
        });
        return;
      } catch {
        /* cancelled or unavailable */
      }
    }
    scrollToSection("publication-access");
  };

  return (
    <div
      className="publication-mobile-bar fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/90 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden"
      aria-label="Publication quick actions"
    >
      <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-2 safe-bottom">
        <button
          type="button"
          onClick={() => scrollToSection("publication-paper")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ScrollText className="h-4 w-4 text-brand-600" aria-hidden />
          Paper
        </button>
        <a
          href={downloadHref}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4 text-brand-600" aria-hidden />
          PDF
        </a>
        <button
          type="button"
          onClick={() => scrollToSection("discussion")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <MessageSquare className="h-4 w-4 text-brand-600" aria-hidden />
          Discuss
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Share2 className="h-4 w-4 text-brand-600" aria-hidden />
          Share
        </button>
      </div>
    </div>
  );
}
