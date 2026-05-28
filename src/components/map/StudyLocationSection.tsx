import { Download, Eye, MapPin, Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { buildPublicationChatPath } from "../../lib/publicationChat";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import type { Publication } from "../../types";
import { PublicationIdentityRow } from "../publication/PublicationIdentityRow";
import { ResearchMap } from "./ResearchMap";

function StudyLocationInfoPanel({
  publication,
  chatPath,
}: {
  publication: Publication;
  chatPath: string;
}) {
  const author =
    publication.author?.full_name ||
    `${publication.author?.firstname ?? ""} ${publication.author?.lastname ?? ""}`.trim();
  const subVisual = publicationSubcategoryVisual(publication);
  const location = publication.coordinates?.location?.trim();
  const views = publication.views_count ?? 0;
  const downloads = publication.downloads_count ?? 0;

  return (
    <div className="study-location-info border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <PublicationIdentityRow user={publication.author} authorName={author} subVisual={subVisual} />
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

      <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {views} views
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            {downloads} downloads
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            to={chatPath}
            className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 sm:shrink-0"
          >
            Get summary
          </Link>
          <Link
            to={buildPublicationPath(publication.id, publication.encoded_id)}
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 sm:shrink-0"
          >
            View publication
          </Link>
        </div>
      </div>
    </div>
  );
}

interface Props {
  publication: Publication;
}

export function StudyLocationSection({ publication }: Props) {
  const [expanded, setExpanded] = useState(false);
  const chatPath = buildPublicationChatPath(publication.id, publication.encoded_id);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const mapProps = {
    publications: [publication],
    focusPublicationId: publication.id,
    variant: "embedded" as const,
    className: "rounded-none border-0",
  };

  const expandOverlay =
    expanded &&
    createPortal(
      <div className="study-location-expand fixed inset-0 z-[2000] flex flex-col bg-slate-900/50 p-3 sm:p-6">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="font-semibold text-ink">Study location</p>
                <p className="text-xs text-slate-500">Use +/− to zoom · Esc to close</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <X className="h-4 w-4" />
              Done
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <ResearchMap {...mapProps} height="100%" />
          </div>
          <StudyLocationInfoPanel publication={publication} chatPath={chatPath} />
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <section id="study-location" className="gre-card gre-card--study-map overflow-visible p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-600" />
            <h2 className="gre-display font-semibold text-ink">Study location</h2>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            <Maximize2 className="h-4 w-4" />
            Expand map
          </button>
        </div>
        <ResearchMap {...mapProps} height="380px" />
        <StudyLocationInfoPanel publication={publication} chatPath={chatPath} />
      </section>
      {expandOverlay}
    </>
  );
}
