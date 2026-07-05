import { Download, Eye, FileText, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { abstractListingSnippet } from "../../lib/abstractText";
import { formatGrePaperTitle, grePaperCode } from "../../lib/grePaperTitle";
import {
  GET_PUBLICATION_SUMMARY_LABEL,
  buildPublicationChatPath,
} from "../../lib/publicationChat";
import { requestPublicationSummary } from "./publicationPopupSummary";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import type { Publication } from "../../types";
import { PublicationAuthorTeamRow } from "../publication/PublicationAuthorTeamRow";
import { SubcategoryBadge } from "../taxonomy/SubcategoryBadge";

interface Props {
  publication: Publication;
  onClose: () => void;
}

export function MapPublicationSheet({ publication, onClose }: Props) {
  const subVisual = publicationSubcategoryVisual(publication);
  const views = publication.views_count ?? 0;
  const downloads = publication.downloads_count ?? 0;
  const paperCode = grePaperCode(publication.short_number);
  const title = formatGrePaperTitle(publication.title, publication.short_number);
  const abstractSnippet = abstractListingSnippet(publication.abstract, 280);

  return (
    <div
      className="map-publication-sheet pointer-events-none absolute inset-x-0 bottom-0 z-[1250] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4"
      role="dialog"
      aria-label="Publication preview"
    >
      <article className="gre-public-card pointer-events-auto mx-auto max-w-md overflow-hidden">
        <header className="relative border-b border-slate-100 px-4 py-4 pr-12 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="gre-interactive absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-ink sm:right-4 sm:top-4"
            aria-label="Close publication preview"
          >
            <X className="h-4 w-4" />
          </button>

          {subVisual ? (
            <div className="mb-2">
              <SubcategoryBadge visual={subVisual} size="xs" variant="chip" />
            </div>
          ) : null}

          <div className="min-w-0 border-l-[3px] border-brand-500 pl-3">
            {paperCode ? (
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-brand-700">
                {paperCode}
              </p>
            ) : null}
            <h3 className="mt-0.5 text-base font-semibold leading-snug text-ink">{title}</h3>
          </div>

          <PublicationAuthorTeamRow publication={publication} className="mt-2 min-w-0 max-w-full" />
        </header>

        <div className="max-h-[min(42dvh,320px)] overflow-y-auto overscroll-contain">
          {abstractSnippet ? (
            <p className="px-4 py-3 text-sm leading-relaxed text-slate-600 sm:px-5">{abstractSnippet}</p>
          ) : (
            <p className="px-4 py-3 text-sm italic text-slate-400 sm:px-5">No abstract.</p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
              <Eye className="h-3.5 w-3.5 text-brand-600" />
              {views} {views === 1 ? "view" : "views"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
              <Download className="h-3.5 w-3.5 text-brand-600" />
              {downloads} {downloads === 1 ? "download" : "downloads"}
            </span>
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-slate-100 bg-white p-3 sm:flex-row sm:p-4">
          <Link
            to={buildPublicationChatPath(publication.id, publication.encoded_id)}
            onClick={(event) => {
              event.preventDefault();
              requestPublicationSummary(publication.id, publication.encoded_id);
              onClose();
            }}
            className="gre-interactive inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-800"
          >
            <Sparkles className="h-4 w-4 text-brand-600" />
            {GET_PUBLICATION_SUMMARY_LABEL}
          </Link>
          <Link
            to={buildPublicationPath(publication.id, publication.encoded_id)}
            onClick={onClose}
            className="gre-interactive inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
          >
            <FileText className="h-4 w-4" />
            View paper
          </Link>
        </footer>
      </article>
    </div>
  );
}
