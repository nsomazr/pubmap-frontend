import { Eye, MapPin, X } from "lucide-react";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import type { Publication } from "../../types";
import { PublicationAuthorTeamRow } from "../publication/PublicationAuthorTeamRow";

interface Props {
  publication: Publication;
  onClose?: () => void;
}

export function MapFocusedPublicationCard({ publication, onClose }: Props) {
  const subVisual = publicationSubcategoryVisual(publication);
  const location = publication.coordinates?.location?.trim();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] p-3 sm:p-4">
      <article className="pointer-events-auto relative mx-auto max-w-xl rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-md">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            aria-label="Close map info"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 pr-6">
          <PublicationAuthorTeamRow publication={publication} className="mb-2.5" />
          {subVisual && (
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full bg-brand-50 px-2.5 py-1.5 ring-1 ring-brand-100/80">
              <span className="truncate text-[11px] font-bold uppercase tracking-wide text-brand-700">
                {subVisual.name}
              </span>
            </div>
          )}
          <h3 className="text-sm font-semibold leading-snug text-ink sm:text-base">
            {formatGrePaperTitle(publication.title, publication.short_number)}
          </h3>
          {location && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <span>{location}</span>
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {publication.views_count ?? 0} views
          </span>
        </div>
      </article>
    </div>
  );
}
