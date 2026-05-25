import { Eye, FileText, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { requestPublicationSummary } from "./publicationPopupSummary";
import type { Publication } from "../../types";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import { UserAvatar } from "../ui/UserAvatar";

interface Props {
  publication: Publication;
  onClose: () => void;
}

export function MapPublicationSheet({ publication, onClose }: Props) {
  const author =
    publication.author?.full_name ||
    `${publication.author?.firstname ?? ""} ${publication.author?.lastname ?? ""}`.trim();
  const subVisual = publicationSubcategoryVisual(publication);
  const views = publication.views_count ?? 0;
  const downloads = publication.downloads_count ?? 0;

  return (
    <div
      className="map-publication-sheet pointer-events-none absolute inset-x-0 bottom-0 z-[1250] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4"
      role="dialog"
      aria-label="Publication details"
    >
      <article className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-2xl border border-white/90 bg-white shadow-2xl ring-1 ring-slate-200/90">
        <div className="relative max-h-[min(58dvh,420px)] overflow-y-auto overscroll-contain">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:text-ink"
            aria-label="Close publication details"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 p-4 pr-12">
            <UserAvatar
              user={publication.author}
              size="md"
              className="!h-11 !w-11 shrink-0 !border-2 !text-xs"
            />
            <div className="min-w-0 flex-1">
              {subVisual && (
                <div className="mb-2 flex items-center gap-2">
                  <SubcategoryVisual visual={subVisual} size="sm" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                    {subVisual.name}
                  </span>
                </div>
              )}
              <h3 className="text-sm font-semibold leading-snug text-ink sm:text-base">
                {formatGrePaperTitle(publication.title, publication.short_number)}
              </h3>
              {author && <p className="mt-1 text-xs text-slate-600 sm:text-sm">{author}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {views} views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>⬇</span>
              {downloads} downloads
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 p-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              requestPublicationSummary(publication.id);
              onClose();
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Get summary
          </button>
          <Link
            to={`/publication/${publication.id}`}
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <FileText className="h-4 w-4" />
            View publication
          </Link>
        </div>
      </article>
    </div>
  );
}
