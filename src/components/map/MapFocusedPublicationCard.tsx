import { Eye, MapPin } from "lucide-react";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { effectiveProfilePhoto } from "../../lib/profilePhoto";
import { mediaUrl } from "../../lib/mediaUrl";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { userInitials } from "../../lib/userDisplay";
import type { Publication } from "../../types";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";

interface Props {
  publication: Publication;
}

export function MapFocusedPublicationCard({ publication }: Props) {
  const author =
    publication.author?.full_name ||
    `${publication.author?.firstname ?? ""} ${publication.author?.lastname ?? ""}`.trim();
  const subVisual = publicationSubcategoryVisual(publication);
  const photo = effectiveProfilePhoto(publication.author?.photo);
  const location = publication.coordinates?.location?.trim();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] p-3 sm:p-4">
      <article className="pointer-events-auto mx-auto max-w-xl rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-md">
        <div className="flex items-start gap-3">
          {photo ? (
            <img
              src={mediaUrl(photo) || ""}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-sm">
              {userInitials(publication.author)}
            </span>
          )}

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
            {location && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span>{location}</span>
              </p>
            )}
          </div>
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
